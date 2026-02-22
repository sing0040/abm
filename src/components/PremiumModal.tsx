
import React, { useState } from 'react';
import { ShieldCheck, CreditCard, CheckCircle2, Zap, Smartphone, Mail, X, Loader2, ArrowRight } from 'lucide-react';
import { dbService } from '../services/database';

interface PremiumModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const PremiumModal: React.FC<PremiumModalProps> = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState<'verify' | 'pay' | 'success'>('verify');
  const [otp, setOtp] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleVerify = () => {
    setIsProcessing(true);
    setTimeout(() => {
      dbService.setVerified(true);
      setIsProcessing(false);
      setStep('pay');
    }, 1500);
  };

  const handlePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      dbService.upgradeToPremium();
      setIsProcessing(false);
      setStep('success');
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden relative">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-500 hover:text-white transition-colors">
          <X size={20} />
        </button>

        <div className="p-10">
          {step === 'verify' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4">
              <div className="text-center space-y-3">
                <div className="inline-flex p-4 bg-indigo-600/10 rounded-3xl border border-indigo-500/20 text-indigo-400 mb-2">
                  <Smartphone size={32} />
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Identity Verification</h3>
                <p className="text-slate-400 text-sm">To access Pro features, please verify your mobile or email.</p>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Enter 6-digit OTP" 
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-center text-2xl font-mono tracking-[0.5em] text-white focus:border-indigo-500 transition-all outline-none"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
                <button 
                  onClick={handleVerify}
                  disabled={otp.length < 6 || isProcessing}
                  className="w-full flex items-center justify-center gap-3 bg-white text-slate-950 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-50 transition-all disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="animate-spin" /> : 'Verify Identity'}
                </button>
              </div>
            </div>
          )}

          {step === 'pay' && (
            <div className="space-y-8 animate-in slide-in-from-right-4">
              <div className="text-center space-y-3">
                <div className="inline-flex p-4 bg-amber-600/10 rounded-3xl border border-amber-500/20 text-amber-400 mb-2">
                  <CreditCard size={32} />
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">LumenMath Pro</h3>
                <p className="text-slate-400 text-sm">Join 5,000+ students with unlimited access.</p>
              </div>

              <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                  <span className="text-slate-400">Annual Master Plan</span>
                  <span className="text-white font-black">$49.99/yr</span>
                </div>
                <div className="space-y-2">
                  {['Unlimited Scans', 'Priority Neural Processing', 'Advanced Step-by-Step', 'Global Student Roster Access'].map(f => (
                    <div key={f} className="flex items-center gap-2 text-xs text-slate-500">
                      <CheckCircle2 size={14} className="text-indigo-400" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-3 bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 transition-all"
              >
                {isProcessing ? <Loader2 className="animate-spin" /> : 'Confirm Payment'}
              </button>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center space-y-8 animate-in zoom-in-95">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full"></div>
                <div className="relative inline-flex p-8 bg-indigo-600 rounded-[3rem] text-white shadow-2xl">
                  <Zap size={64} className="fill-white" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-white uppercase">Pro Activated</h3>
                <p className="text-slate-400">Your account is now verified and upgraded.</p>
              </div>
              <button 
                onClick={() => { onSuccess(); onClose(); }}
                className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-slate-700 transition-all"
              >
                Enter Pro Workspace
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PremiumModal;
