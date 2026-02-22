import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Loader2, Zap, Sigma, AlertCircle, Waves, RefreshCw, X } from 'lucide-react';
import { Modality, LiveServerMessage } from '@google/genai';
import { getGeminiClient, createBlob, decode, decodeAudioData } from '../services/gemini';
import { MATH_MODELS, SYSTEM_INSTRUCTION } from '../constants';
import { VoiceMessage } from '../types';
import MathSolutionRenderer from './MathSolutionRenderer';
import Logo from './Logo';

const VoiceAssistant: React.FC = () => {
  // State Management
  const [status, setStatus] = useState<'idle' | 'connecting' | 'active' | 'error'>('idle');
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [lastFormula, setLastFormula] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Refs for Audio & Connection (Prevents re-render loops)
  const sessionRef = useRef<any>(null);
  const audioCtxRef = useRef<{ input: AudioContext; output: AudioContext } | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextAudioTimeRef = useRef<number>(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Buffer management for smooth transcriptions
  const transcriptBuffer = useRef({ user: '', assistant: '' });

  // --- Utility: Cleanup ---
  const shutdown = useCallback(() => {
    // 1. Stop all playing audio
    sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
    sourcesRef.current.clear();
    
    // 2. Disconnect Mic processor
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    // 3. Stop Mic Stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    // 4. Close Gemini Session
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }

    setStatus('idle');
    nextAudioTimeRef.current = 0;
  }, []);

  useEffect(() => () => shutdown(), [shutdown]);

  // --- Transcription Logic ---
  const updateTranscription = (role: 'user' | 'assistant', newText: string) => {
    setMessages(prev => {
      const last = prev[prev.length - 1];
      if (last && last.role === role) {
        const updated = [...prev];
        updated[updated.length - 1] = { ...last, text: newText };
        return updated;
      }
      return [...prev, { id: Date.now().toString(), role, text: newText, timestamp: Date.now() }];
    });
  };

  // --- Main Connection Logic ---
  const startSession = async () => {
    try {
      setErrorMessage(null);
      setStatus('connecting');

      // 1. Initialize Audio Contexts (16k in for Gemini, 24k out)
      if (!audioCtxRef.current) {
        const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = {
          input: new AudioCtx({ sampleRate: 16000 }),
          output: new AudioCtx({ sampleRate: 24000 })
        };
      }
      await Promise.all([audioCtxRef.current.input.resume(), audioCtxRef.current.output.resume()]);

      // 2. Get Mic Access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // 3. Connect to Gemini Live
      const ai = getGeminiClient();
      const sessionPromise = ai.live.connect({
        model: MATH_MODELS.VOICE,
        callbacks: {
          onopen: () => {
            setStatus('active');
            
            // 5. Pipe Mic to Session
            const sourceNode = audioCtxRef.current!.input.createMediaStreamSource(stream);
            processorRef.current = audioCtxRef.current!.input.createScriptProcessor(4096, 1, 1);
            
            processorRef.current.onaudioprocess = (e) => {
              if (sessionRef.current) {
                const pcm = e.inputBuffer.getChannelData(0);
                sessionRef.current.sendRealtimeInput({ media: createBlob(pcm) });
              }
            };

            sourceNode.connect(processorRef.current);
            processorRef.current.connect(audioCtxRef.current!.input.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            // Audio Output
            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData && !isMuted) {
              const buffer = await decodeAudioData(decode(audioData), audioCtxRef.current!.output, 24000, 1);
              const source = audioCtxRef.current!.output.createBufferSource();
              source.buffer = buffer;
              source.connect(audioCtxRef.current!.output.destination);
              
              const startTime = Math.max(audioCtxRef.current!.output.currentTime, nextAudioTimeRef.current);
              source.start(startTime);
              nextAudioTimeRef.current = startTime + buffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }

            // Interruption handling
            if (msg.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
              sourcesRef.current.clear();
              nextAudioTimeRef.current = 0;
            }

            // Transcriptions
            if (msg.serverContent?.outputTranscription) {
              transcriptBuffer.current.assistant += msg.serverContent.outputTranscription.text;
              updateTranscription('assistant', transcriptBuffer.current.assistant);
            } else if (msg.serverContent?.inputTranscription) {
              transcriptBuffer.current.user += msg.serverContent.inputTranscription.text;
              updateTranscription('user', transcriptBuffer.current.user);
            }

            if (msg.serverContent?.turnComplete) {
              transcriptBuffer.current = { user: '', assistant: '' };
            }
          },
          onerror: (e) => {
            console.error('Live Session Error:', e);
            setErrorMessage("Connection lost. Tap to reconnect.");
            shutdown();
          },
          onclose: () => {
            shutdown();
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } },
          systemInstruction: SYSTEM_INSTRUCTION + "\nRespond concisely. Use 'Jay Bheem'. Use LaTeX.",
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err: any) {
      console.error("Session Failed:", err);
      let msg = "Neural Link Failed";
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = "Microphone Permission Denied. Please allow access in your browser.";
      }
      setErrorMessage(msg);
      setStatus('error');
      shutdown();
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6 max-w-7xl mx-auto p-4">
      <div className="flex-1 flex flex-col gap-4">
        {/* Error Display */}
        {errorMessage && (
          <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex items-center justify-between gap-3 text-rose-400 text-xs font-bold uppercase tracking-widest animate-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <AlertCircle size={18} /> 
              <p>{errorMessage}</p>
            </div>
            <button 
              onClick={() => { setErrorMessage(null); startSession(); }}
              className="p-2 hover:bg-rose-500/10 rounded-lg transition-colors"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        )}

        {/* Connection Controls */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2.5rem] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl ${status === 'active' ? 'bg-indigo-600 animate-pulse' : 'bg-slate-800'} text-white`}>
              <Waves size={24} />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-tighter">Oral Feed: Prof. Satyam</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                {status === 'active' ? 'Duplex Link Established' : 'System Offline'}
              </p>
            </div>
          </div>

          <button 
            onClick={status === 'active' ? shutdown : startSession}
            disabled={status === 'connecting'}
            className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
              status === 'active' ? 'bg-rose-600 hover:bg-rose-500' : 'bg-indigo-600 hover:bg-indigo-500'
            } text-white shadow-xl disabled:opacity-50`}
          >
            {status === 'connecting' ? <Loader2 className="animate-spin" /> : status === 'active' ? 'Disconnect' : 'Connect Link'}
          </button>
        </div>

        {/* Message Feed */}
        <div ref={scrollRef} className="flex-1 bg-slate-900/50 rounded-[2.5rem] border border-slate-800 overflow-y-auto p-8 space-y-4">
          {messages.map(m => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-2xl text-xs ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'}`}>
                {m.text}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Side Blackboard */}
      <div className="w-96 bg-slate-900 rounded-[2.5rem] border border-slate-800 p-8 shadow-2xl">
        <h3 className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
          <Sigma size={16} /> Visual Logic
        </h3>
        <div className="h-full">
           {lastFormula ? <MathSolutionRenderer content={lastFormula} /> : <div className="text-slate-700 text-xs italic">Awaiting mathematical input...</div>}
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistant;