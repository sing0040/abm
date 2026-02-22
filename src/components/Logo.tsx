
import React from 'react';
import { Lightbulb } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true }) => {
  const scale = size === 'sm' ? 0.6 : size === 'lg' ? 1.5 : 1;
  
  return (
    <div className="flex flex-col items-center justify-center select-none">
      <div 
        className="relative flex items-center justify-center"
        style={{ width: 120 * scale, height: 120 * scale }}
      >
        {/* Outer Circular Frame */}
        <div className="absolute inset-0 border-2 border-amber-500/40 rounded-full"></div>
        <div className="absolute inset-2 border border-amber-500/20 rounded-full"></div>
        
        {/* Target Lines */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-amber-500/60"></div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-amber-500/60"></div>
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-0.5 bg-amber-500/60"></div>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-0.5 bg-amber-500/60"></div>

        {/* Floating Math Symbols */}
        <span className="absolute top-4 right-8 text-amber-400/40 font-serif text-[10px] transform rotate-12">π</span>
        <span className="absolute bottom-8 left-6 text-amber-400/40 font-serif text-[10px] transform -rotate-12">Σ</span>
        <span className="absolute top-10 left-10 text-amber-400/40 font-serif text-[8px]">√</span>
        <span className="absolute bottom-10 right-10 text-amber-400/40 font-serif text-[8px]">∫</span>

        {/* The White Checkmark */}
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="white" 
          strokeWidth="4" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="w-2/3 h-2/3 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] z-10"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>

        {/* The Lightbulb */}
        <div className="absolute -top-1 right-2 z-20 animate-pulse">
           <div className="relative">
             <div className="absolute inset-0 bg-amber-400 blur-md opacity-50 rounded-full"></div>
             <Lightbulb size={24 * scale} className="text-amber-400 fill-amber-400 drop-shadow-lg" />
           </div>
        </div>
      </div>

      {showText && (
        <div className="mt-2 text-center">
          <h1 className="text-3xl font-black text-white tracking-[0.2em] uppercase leading-none">ABM</h1>
          <p className="text-sm font-bold text-slate-400 tracking-[0.4em] uppercase mt-1">SOLVER</p>
        </div>
      )}
    </div>
  );
};

export default Logo;
