
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Loader2, Sparkles, Camera, Mic, MicOff, GraduationCap, Globe, Crop, X, BrainCircuit, Search, Upload, RefreshCcw, CheckCircle2, RotateCcw, ArrowRight, Layers, Volume2, VolumeX } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { dbService } from '../services/database';
import { generateMathExplanation, solveMathFromImage, chatWithProfessor, speakSolution, decode, decodeAudioData, ScanMode } from '../services/gemini';
import { MathSolution } from '../types';
import { DAILY_LIMIT, LANGUAGES } from '../constants';
import CameraScanner from './CameraScanner';
import MathSolutionRenderer from './MathSolutionRenderer';
import SolvingOverlay from './SolvingOverlay';
import PremiumModal from './PremiumModal';
import Logo from './Logo';

interface MathSolverProps {
  onLanguageChange?: (lang: string) => void;
}

const MathSolver: React.FC<MathSolverProps> = ({ onLanguageChange }) => {
  const [question, setQuestion] = useState('');
  const [solution, setSolution] = useState<MathSolution | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [isSocraticMode, setIsSocraticMode] = useState(true);
  
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const [useThinking, setUseThinking] = useState(false);
  const [useSearch, setUseSearch] = useState(false);
  const [groundingLinks, setGroundingLinks] = useState<any[]>([]);

  // Image manipulation state
  const [fullImage, setFullImage] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [activeScanMode, setActiveScanMode] = useState<ScanMode>('standard');

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: string, parts: string }[]>([]);
  const [followUpText, setFollowUpText] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [questionCount, setQuestionCount] = useState(1);

  const recognitionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stats = dbService.getUserStats();
    setUsage(stats.dailyCount);
    setIsPremium(stats.isPremium);
    setQuestionCount(stats.dailyCount + 1);

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.onresult = (e: any) => {
          const transcript = e.results[0][0].transcript;
          setQuestion(prev => (prev ? prev + ' ' : '') + transcript);
          setIsListening(false);
        };
        recognitionRef.current.onend = () => setIsListening(false);
        recognitionRef.current.onerror = () => setIsListening(false);
      } catch (e) {
        console.warn("Speech recognition unavailable.");
      }
    }
  }, []);

  // Auto-scroll chat to bottom when history or loading state changes
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isChatLoading]);

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
    if (onLanguageChange) onLanguageChange(lang);
  };

  const handleReadAloud = async () => {
    if (isSpeaking) {
      audioSourceRef.current?.stop();
      setIsSpeaking(false);
      return;
    }
    if (!solution) return;
    setIsSpeaking(true);
    try {
      const audioData = await speakSolution(solution.explanation, selectedLanguage === 'Hindi' ? 'Puck' : 'Kore');
      if (!audioData) throw new Error("Voice synthesis failed");
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const buffer = await decodeAudioData(decode(audioData), audioContextRef.current, 24000, 1);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => setIsSpeaking(false);
      audioSourceRef.current = source;
      source.start(0);
    } catch (err) {
      console.error(err);
      setIsSpeaking(false);
    }
  };

  const handleSolve = async (manualBase64?: string) => {
    if (!dbService.hasRemainingLimit()) {
      setShowPremiumModal(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    setGroundingLinks([]);
    
    try {
      let resultText = '';
      if (manualBase64 || fullImage) {
        const targetImage = manualBase64 || fullImage!.split(',')[1];
        let prompt = `Analyze Question No. ${questionCount}. Read carefully. ${isSocraticMode ? 'Be Socratic.' : 'Provide direct solution.'} Greet with: "Jay Bheem 💙 Professor Satyam 🎓". Use ${selectedLanguage}. IMPORTANT: Keep Hindi/Text strictly separate from math delimiters.`;
        if (question.trim()) {
           prompt = `Student's added note: "${question}". ${prompt}`;
        }
        resultText = await solveMathFromImage(targetImage, 'image/jpeg', selectedLanguage, prompt, useThinking, activeScanMode, isSocraticMode);
      } else {
        const result = await generateMathExplanation(question, selectedLanguage, useThinking, useSearch, isSocraticMode);
        resultText = result.text;
        if (result.grounding) {
          setGroundingLinks(result.grounding.filter((c: any) => c.web).map((c: any) => c.web));
        }
      }

      const newSolution: MathSolution = {
        id: Date.now().toString(),
        question: question || `Question No. ${questionCount}`,
        solution: `Satyam's Scholarly Path`,
        explanation: resultText || 'Failed to generate explanation.',
        timestamp: Date.now()
      };

      dbService.storeSolution(newSolution);
      dbService.incrementUsage();
      
      const stats = dbService.getUserStats();
      setUsage(stats.dailyCount);
      setSolution(newSolution);
      setChatHistory([
        { role: 'user', parts: question || `Question No. ${questionCount}` },
        { role: 'model', parts: resultText || '' }
      ]);
      setQuestionCount(prev => prev + 1);
    } catch (err: any) {
      setError(err.message || 'The neural processor is busy. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onCropComplete = useCallback((_area: any, pixels: any) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const applyCrop = async () => {
    if (!fullImage || !croppedAreaPixels) return;
    setIsLoading(true);
    try {
      const img = new Image();
      img.src = fullImage;
      await new Promise((res) => { img.onload = res; });
      const canvas = document.createElement('canvas');
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, croppedAreaPixels.x, croppedAreaPixels.y, croppedAreaPixels.width, croppedAreaPixels.height, 0, 0, croppedAreaPixels.width, croppedAreaPixels.height);
        const croppedBase64 = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
        setIsCropping(false);
        await handleSolve(croppedBase64);
      }
    } catch (e) {
      setError("Image extraction failed.");
      setIsLoading(false);
    }
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const handleFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpText.trim() || isChatLoading) return;

    const userMsg = followUpText.trim();
    setFollowUpText('');
    setIsChatLoading(true);
    
    try {
      const response = await chatWithProfessor(chatHistory, userMsg, selectedLanguage);
      setChatHistory(prev => [
        ...prev, 
        { role: 'user', parts: userMsg }, 
        { role: 'model', parts: response || '' }
      ]);
    } catch (err: any) {
      setError("Neural link interrupted. Please try re-phrasing your question to Professor Satyam.");
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto px-4">
      {isCameraOpen && (
        <CameraScanner 
          onCapture={(img, voice, mode) => { 
            setFullImage(img); 
            setIsCropping(true); 
            if (voice) setQuestion(voice);
            if (mode) setActiveScanMode(mode);
          }} 
          onClose={() => setIsCameraOpen(false)} 
        />
      )}
      {showPremiumModal && <PremiumModal onClose={() => setShowPremiumModal(false)} onSuccess={() => setUsage(dbService.getUserStats().dailyCount)} />}
      <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) {
          const r = new FileReader();
          r.onload = (ev) => { setFullImage(ev.target?.result as string); setIsCropping(true); setActiveScanMode('standard'); };
          r.readAsDataURL(file);
        }
      }} />

      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/40 p-5 rounded-[2rem] border border-slate-800/60 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl shadow-lg transition-all ${isPremium ? 'bg-amber-600' : 'bg-indigo-600'}`}>
            <GraduationCap className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight uppercase">
              Professor Satyam
              {isPremium && <span className="text-[8px] bg-amber-500 text-black px-2 py-0.5 rounded-full font-black ml-2">Verified</span>}
            </h2>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Global Academic Node • Q{questionCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-3">
             <div className={`w-1.5 h-1.5 rounded-full ${isPremium ? 'bg-amber-500' : 'bg-indigo-500 animate-pulse'}`}></div>
             <span className="text-[10px] font-black text-slate-400 tracking-tighter uppercase">
               {isPremium ? 'Infinite Scholar' : `${usage} / ${DAILY_LIMIT} Free`}
             </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300">
            <Globe size={14} className="text-indigo-400" />
            <select value={selectedLanguage} onChange={e => handleLanguageChange(e.target.value)} className="bg-transparent border-none outline-none font-black text-[10px] uppercase tracking-widest cursor-pointer">
              {LANGUAGES.map(l => <option key={l.code} value={l.name} className="bg-slate-900">{l.name}</option>)}
            </select>
          </div>

          <button 
            onClick={() => setIsSocraticMode(!isSocraticMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${isSocraticMode ? 'bg-indigo-600/10 border-indigo-500/50 text-indigo-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
          >
            <BrainCircuit size={14} className={isSocraticMode ? 'text-indigo-400' : 'text-slate-600'} />
            <span className="text-[10px] font-black uppercase tracking-widest">{isSocraticMode ? 'Socratic' : 'Direct'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Input Area */}
        <div className={`${solution ? 'lg:col-span-4' : 'lg:col-span-12'} transition-all duration-500 space-y-4`}>
          <div className="relative group bg-slate-900/60 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-xl">
            {isLoading && <SolvingOverlay />}
            
            {fullImage && isCropping ? (
              <div className="flex flex-col animate-in fade-in zoom-in-95">
                <div className="w-full h-[350px] relative bg-slate-950">
                  <Cropper
                    image={fullImage}
                    crop={crop}
                    zoom={zoom}
                    rotation={rotation}
                    aspect={undefined}
                    onCropChange={setCrop}
                    onCropComplete={onCropComplete}
                    onZoomChange={setZoom}
                    onRotationChange={setRotation}
                    style={{
                      containerStyle: { background: '#020617' },
                      cropAreaStyle: { border: '3px solid #818cf8', boxShadow: '0 0 0 9999px rgba(2, 6, 23, 0.9)', borderRadius: '0px' }
                    }}
                  />
                </div>
                <div className="p-5 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-4">
                  <div className="flex gap-2">
                    <button onClick={() => setRotation(r => r - 90)} className="p-2 bg-slate-800 text-slate-400 rounded-lg"><RotateCcw size={16} /></button>
                    <button onClick={() => { setZoom(1); setCrop({x:0,y:0}); }} className="p-2 bg-slate-800 text-slate-400 rounded-lg"><RefreshCcw size={16} /></button>
                  </div>
                  <button onClick={applyCrop} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2">
                    Analyze <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col relative">
                <textarea
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  placeholder={selectedLanguage === 'Hindi' ? "सत्यम सर, मेरा प्रश्न है..." : `Jay Bheem! Scholar, type Question No. ${questionCount}...`}
                  className={`w-full bg-transparent p-8 pr-16 text-xl text-white placeholder-slate-800 outline-none resize-none font-serif tracking-tight leading-relaxed transition-all ${solution ? 'min-h-[120px]' : 'min-h-[200px]'}`}
                />
                
                {/* Speech-to-Text Button Next to Input */}
                <button 
                  onClick={isListening ? stopListening : startListening}
                  className={`absolute top-8 right-8 p-3 rounded-2xl transition-all shadow-lg active:scale-95 ${isListening ? 'bg-indigo-600 text-white animate-pulse' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                  title="Speech to Text"
                >
                  {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                </button>

                <div className="p-4 bg-slate-800/30 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex gap-2">
                    <button onClick={() => setIsCameraOpen(true)} className="p-3 bg-slate-800/80 text-indigo-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-lg"><Camera size={18} /></button>
                    <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-slate-800/80 text-amber-400 rounded-xl hover:bg-amber-600 hover:text-white transition-all shadow-lg"><Upload size={18} /></button>
                  </div>
                  <button
                    onClick={() => handleSolve()}
                    disabled={isLoading || (!question.trim() && !fullImage)}
                    className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest text-[9px] shadow-xl disabled:opacity-40"
                  >
                    Ask Satyam
                  </button>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-[10px] font-bold uppercase tracking-widest text-center animate-in shake-in">
              {error}
            </div>
          )}
        </div>

        {/* Solution Area */}
        {solution && (
          <div className="lg:col-span-8 space-y-6 animate-in slide-in-from-right-4 duration-700">
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-3xl">
              <div className="px-8 py-4 bg-slate-800/40 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center border border-white/10 shadow-lg">
                      <Logo size="sm" showText={false} />
                   </div>
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Scholarly Derivation No. {questionCount-1}</span>
                </div>
                <button 
                  onClick={handleReadAloud}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isSpeaking ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                >
                  {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  {isSpeaking ? 'Mute' : 'Speak'}
                </button>
              </div>

              <div className="p-8 md:p-12 space-y-10">
                {chatHistory.map((h, i) => (
                  <div key={i} className={`flex flex-col gap-4 ${h.role === 'user' ? 'items-end' : 'items-start'}`}>
                    {h.role === 'user' ? (
                      <div className="bg-indigo-600/10 border border-indigo-500/20 px-6 py-2 rounded-xl text-indigo-200 font-bold text-[9px] uppercase tracking-widest">
                        {h.parts}
                      </div>
                    ) : (
                      <div className="w-full">
                        <MathSolutionRenderer content={h.parts} />
                      </div>
                    )}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <div className="p-6 border-t border-slate-800 bg-slate-950/40 flex flex-wrap gap-4 items-center">
                  <form onSubmit={handleFollowUp} className="flex-1 relative">
                    <input
                      type="text"
                      value={followUpText}
                      onChange={e => setFollowUpText(e.target.value)}
                      placeholder="Ask Professor Satyam for a hint..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-3 text-xs text-slate-100 outline-none focus:border-indigo-500/50 transition-all shadow-inner"
                      disabled={isChatLoading}
                    />
                    <button type="submit" disabled={isChatLoading} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500">
                      {isChatLoading ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                    </button>
                  </form>
                  <button onClick={() => { setSolution(null); setQuestion(''); setFullImage(null); }} className="px-5 py-3 bg-slate-800 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-700">New Topic</button>
              </div>
            </div>

            {groundingLinks.length > 0 && (
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-[2rem] space-y-3">
                 <div className="flex items-center gap-2 text-emerald-400">
                   <Search size={14} />
                   <h4 className="text-[9px] font-black uppercase tracking-widest">Scholar's Library Citations</h4>
                 </div>
                 <div className="flex flex-wrap gap-2">
                   {groundingLinks.map((link, i) => (
                     <a key={i} href={link.uri} target="_blank" rel="noopener noreferrer" className="px-4 py-1.5 bg-emerald-600/5 border border-emerald-500/20 rounded-full text-[8px] text-emerald-300 hover:bg-emerald-600 hover:text-white transition-all uppercase font-bold">
                       {link.title || "Academic Link"}
                     </a>
                   ))}
                 </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MathSolver;
