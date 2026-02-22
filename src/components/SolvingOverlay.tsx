
import React, { useState, useEffect } from 'react';
import { Sparkles, BrainCircuit, ScanLine, UserCheck } from 'lucide-react';
import Logo from './Logo';

const phrases = [
  "Optical processing active...",
  "Isolating mathematical symbols...",
  "Professor Satyam is deciphering symbols...",
  "Analyzing logic for Question No...",
  "Formatting academic derivation...",
  "Jay Bheem! Solution incoming..."
];

const SolvingOverlay: React.FC = () => {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIdx(v => (v + 1) % phrases.length), 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-300">
      
      {/* Scanning Laser Effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="w-full h-1 bg-indigo-500/40 shadow-[0_0_25px_rgba(79,70,229,1)] absolute top-0 left-0 animate-[scan_2.5s_linear_infinite]"></div>
      </div>
      
      <div className="relative flex flex-col items-center gap-12">
        <div className="relative flex flex-col items-center">
          <div className="scale-125 mb-10">
             <Logo size="lg" showText={false} />
          </div>
          <div className="w-40 h-40 rounded-full border-[3px] border-slate-800 border-t-indigo-500 animate-spin absolute top-0 -translate-y-4"></div>
        </div>

        <div className="text-center space-y-6 max-w-sm px-6">
          <div className="flex items-center justify-center gap-3">
            <UserCheck className="text-indigo-400" size={20} />
            <h4 className="text-white text-xs font-black uppercase tracking-[0.4em]">Professor Satyam Solving</h4>
          </div>
          <p className="text-indigo-300 font-mono text-sm animate-pulse tracking-wide h-6">{phrases[idx]}</p>
          <div className="flex gap-2 justify-center pt-4">
             {[...Array(5)].map((_, i) => (
               <div key={i} className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }}></div>
             ))}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan {
          0% { top: -5% }
          100% { top: 105% }
        }
      `}} />
    </div>
  );
};

export default SolvingOverlay;
