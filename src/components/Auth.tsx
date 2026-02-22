
import React from 'react';
import { ShieldCheck, Zap } from 'lucide-react';
import Logo from './Logo';

interface AuthProps {
  onLogin: (user: any) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const handleGoogleLogin = () => {
    // Simulated production login
    const mockUser = {
      name: 'Dr. Math Scholar',
      email: 'scholar@gmail.com',
      photoUrl: 'https://picsum.photos/200'
    };
    onLogin(mockUser);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 overflow-hidden relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="max-w-md w-full space-y-8 animate-in zoom-in-95 duration-700 relative z-10">
        <div className="flex justify-center">
           <Logo size="lg" showText />
        </div>

        <div className="bg-slate-900 border border-slate-800 p-10 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-8 backdrop-blur-3xl">
          <div className="space-y-4">
            <button 
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-4 bg-white hover:bg-slate-100 text-slate-950 py-5 px-6 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl active:scale-95"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
              Sign in with Google
            </button>
            <div className="flex items-center gap-4 py-2">
               <div className="h-[1px] flex-1 bg-slate-800"></div>
               <span className="text-[10px] text-slate-600 font-black uppercase tracking-[0.3em]">Institutional Access</span>
               <div className="h-[1px] flex-1 bg-slate-800"></div>
            </div>
            <button 
              className="w-full bg-slate-800 text-slate-300 py-4 px-6 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-700 transition-colors border border-slate-700/50"
            >
              Enter Institutional ID
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800/50 flex flex-col gap-2">
                <ShieldCheck className="text-indigo-400" size={20} />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-200">Secure</p>
                <p className="text-[8px] text-slate-500 uppercase tracking-tighter">End-to-end verified</p>
             </div>
             <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800/50 flex flex-col gap-2">
                <Zap className="text-amber-500" size={20} />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-200">Pro Ready</p>
                <p className="text-[8px] text-slate-500 uppercase tracking-tighter">Unlimited AI solving</p>
             </div>
          </div>
        </div>

        <div className="text-center space-y-4">
           <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">Powered by Professor Satyam's Neural Intelligence</p>
           <div className="flex items-center justify-center gap-6 opacity-30">
              <span className="text-[8px] font-black uppercase tracking-widest text-white">Privacy Ensured</span>
              <span className="text-[8px] font-black uppercase tracking-widest text-white">Academic Integrity</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
