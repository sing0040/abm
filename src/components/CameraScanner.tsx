
import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, Zap, RefreshCw, Check, Mic, MicOff, Upload, Lightbulb, Type, Edit3, Grid3X3 } from 'lucide-react';
import { ScanMode } from '../services/gemini';

interface CameraScannerProps {
  onCapture: (fullBase64: string, voiceQuery?: string, scanMode?: ScanMode) => void;
  onClose: () => void;
}

const CameraScanner: React.FC<CameraScannerProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [torch, setTorch] = useState(false);
  const [scanMode, setScanMode] = useState<ScanMode>('handwriting');
  
  // Voice Input State
  const [isListening, setIsListening] = useState(false);
  const [voiceQuery, setVoiceQuery] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    startCamera();
    
    // Initialize Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        setVoiceQuery(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };
    }

    return () => {
      stopCamera();
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  const startCamera = async () => {
    try {
      // Request maximum possible resolution for OCR precision
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', 
          width: { ideal: 4096, min: 1280 }, 
          height: { ideal: 2160, min: 720 },
          frameRate: { ideal: 30 }
        },
        audio: false,
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.onloadedmetadata = () => setIsReady(true);
      }
    } catch (err) {
      console.error("Advanced Camera initialization failed:", err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const toggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    const capabilities = track.getCapabilities() as any;
    
    if (capabilities.torch) {
      try {
        await track.applyConstraints({
          advanced: [{ torch: !torch }]
        } as any);
        setTorch(!torch);
      } catch (e) {
        console.error("Torch error:", e);
      }
    } else {
      alert("Torch not supported on this device's camera.");
    }
  };

  const toggleVoice = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const capture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.98); // High quality for OCR
      onCapture(dataUrl, voiceQuery, scanMode);
      onClose();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        onCapture(base64, voiceQuery, scanMode);
        onClose();
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-0 animate-in fade-in duration-300">
      <input 
        type="file" 
        accept="image/*" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
      />
      
      <div className="relative w-full h-full flex flex-col overflow-hidden bg-slate-950">
        
        {/* Advanced Overlay Interface */}
        <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-20">
          <button 
            onClick={onClose}
            className="p-3 bg-slate-900/80 hover:bg-slate-800 text-white rounded-2xl backdrop-blur-xl border border-slate-700/50 transition-all shadow-lg"
          >
            <X size={20} />
          </button>

          <div className="flex gap-2">
            <button 
              onClick={toggleTorch}
              className={`p-3 rounded-2xl backdrop-blur-xl border transition-all ${torch ? 'bg-amber-500 border-amber-400 text-slate-950' : 'bg-slate-900/80 border-slate-700 text-white'}`}
            >
              <Lightbulb size={20} />
            </button>
            <div className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
              <Zap size={14} className="text-amber-400 fill-amber-400" />
              <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Neural Lens High-Res</span>
            </div>
          </div>
        </div>

        {/* Video Preview with Mathematical Grid */}
        <div className="flex-1 relative bg-black flex items-center justify-center">
          {!isReady && (
            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                <RefreshCw className="animate-spin text-indigo-500" size={56} />
                <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full"></div>
              </div>
              <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">Calibrating Scholarly Node...</p>
            </div>
          )}
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className={`w-full h-full object-contain transition-opacity duration-1000 ${isReady ? 'opacity-100' : 'opacity-0'}`}
          />
          
          {/* Mathematical Targeting Guides */}
          {isReady && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-12">
               <div className="w-full h-full max-w-2xl max-h-[60%] border-[2px] border-white/5 rounded-[3rem] relative flex items-center justify-center">
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-10">
                    <div className="border border-white/20"></div>
                    <div className="border border-white/20"></div>
                    <div className="border border-white/20"></div>
                    <div className="border border-white/20"></div>
                    <div className="border border-white/20"></div>
                    <div className="border border-white/20"></div>
                    <div className="border border-white/20"></div>
                    <div className="border border-white/20"></div>
                    <div className="border border-white/20"></div>
                  </div>
                  <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-indigo-500 rounded-tl-[2rem]"></div>
                  <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-indigo-500 rounded-tr-[2rem]"></div>
                  <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-indigo-500 rounded-bl-[2rem]"></div>
                  <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-indigo-500 rounded-br-[2rem]"></div>
                  
                  {/* Laser Scan Animation */}
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-indigo-500/50 shadow-[0_0_15px_rgba(79,70,229,1)] animate-[scan_3s_linear_infinite]"></div>
                  
                  <div className="bg-slate-900/40 backdrop-blur-md px-6 py-2 rounded-full border border-white/5">
                    <p className="text-[9px] font-black text-white/50 uppercase tracking-[0.3em]">Align Equation for Analysis</p>
                  </div>
               </div>
            </div>
          )}

          {/* Voice Prompt Display */}
          {voiceQuery && (
            <div className="absolute bottom-40 left-1/2 -translate-x-1/2 w-full max-w-lg px-8 animate-in slide-in-from-bottom-4">
              <div className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 p-5 rounded-3xl text-white text-center text-sm font-medium shadow-2xl">
                <p className="text-indigo-400 text-[9px] font-black uppercase tracking-widest mb-1.5 flex items-center justify-center gap-2">
                   <Mic size={10} className="animate-pulse" /> Oral Instruction Context
                </p>
                {voiceQuery}
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Controls Footer */}
        <div className="p-8 pb-12 bg-slate-950 flex flex-col items-center gap-8 border-t border-slate-900">
          
          {/* Scan Mode Selector */}
          <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800">
             <button 
              onClick={() => setScanMode('handwriting')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${scanMode === 'handwriting' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
             >
               <Edit3 size={14} /> Handwriting
             </button>
             <button 
              onClick={() => setScanMode('print')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${scanMode === 'print' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
             >
               <Type size={14} /> Printed Text
             </button>
          </div>

          <div className="flex items-center gap-10">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-6 rounded-[2rem] bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all shadow-xl active:scale-95 group"
              title="Upload from Gallery"
            >
              <Upload size={28} className="group-hover:-translate-y-1 transition-transform" />
            </button>

            <button 
              onClick={capture}
              disabled={!isReady}
              className="group relative flex items-center justify-center p-1.5 bg-white rounded-full transition-all active:scale-90 disabled:opacity-50 shadow-[0_0_40px_rgba(255,255,255,0.2)]"
            >
              <div className="w-24 h-24 rounded-full border-[5px] border-slate-950 bg-white flex items-center justify-center">
                 <Camera className="text-slate-900" size={38} />
              </div>
              <div className="absolute -inset-2 border-2 border-white/20 rounded-full animate-ping opacity-20 group-active:hidden"></div>
            </button>

            <button 
              onClick={toggleVoice}
              className={`p-6 rounded-[2rem] border transition-all shadow-xl active:scale-95 ${isListening ? 'bg-rose-600 border-rose-500 text-white animate-pulse' : 'bg-slate-900 border-slate-700 text-slate-400'}`}
              title="Add Voice Context"
            >
              {isListening ? <MicOff size={28} /> : <Mic size={28} />}
            </button>
          </div>

          <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">
            {isListening ? 'Oral Context Capture Active' : 'Neural Calibrator Steady...'}
          </p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan {
          0% { top: 0% }
          50% { top: 100% }
          100% { top: 0% }
        }
      `}} />
    </div>
  );
};

export default CameraScanner;
