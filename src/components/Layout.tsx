
import React, { useState } from 'react';
import { 
  Calculator, 
  History, 
  Mic, 
  LogOut, 
  Menu, 
  Zap,
  Users,
  Lock,
  FileText
} from 'lucide-react';
import { AuthState } from '../types';
import Logo from './Logo';

interface LayoutProps {
  children: React.ReactNode;
  auth: AuthState;
  onLogout: () => void;
  activeTab: 'solve' | 'voice' | 'history' | 'directory' | 'mocktest';
  setActiveTab: (tab: 'solve' | 'voice' | 'history' | 'directory' | 'mocktest') => void;
}

const Layout: React.FC<LayoutProps> = ({ children, auth, onLogout, activeTab, setActiveTab }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { id: 'solve', label: 'Solver', icon: Calculator },
    { id: 'mocktest', label: 'Mock Test', icon: FileText },
    { id: 'voice', label: 'Oral Tutor', icon: Mic },
    { id: 'directory', label: 'Roster', icon: Users },
    { id: 'history', label: 'History', icon: History },
  ];

  const isPro = auth.user?.status === 'Pro';

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* Mobile Toggle */}
      <button 
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-slate-900 rounded-2xl text-slate-200 border border-slate-800"
      >
        <Menu size={24} />
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 transition-transform duration-300 transform
        lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Brand Logo */}
          <div className="p-8 pb-4">
             <Logo size="sm" showText />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-2 mt-4">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as any);
                  setSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all
                  ${activeTab === item.id 
                    ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(79,70,229,0.1)]' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}
                `}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={18} />
                  <span className="font-bold text-xs uppercase tracking-widest">{item.label}</span>
                </div>
                {item.id === 'directory' && !isPro && <Lock size={12} className="text-slate-600" />}
              </button>
            ))}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-slate-800">
            <div className="bg-slate-950/50 rounded-2xl p-4 mb-4 border border-slate-800/50">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${isPro ? 'bg-amber-600 text-black' : 'bg-indigo-600 text-white'}`}>
                  {auth.user?.name.charAt(0)}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-slate-100 truncate">{auth.user?.name || 'Student'}</p>
                  <p className="text-[10px] text-slate-500 truncate">{auth.user?.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-black uppercase tracking-widest">
                  <Zap size={10} className={isPro ? 'text-amber-400' : 'text-slate-600'} />
                  <span>{isPro ? 'Pro' : 'Basic'}</span>
                </div>
                {auth.user?.isVerified && (
                  <div className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tighter">Verified</div>
                )}
              </div>
            </div>
            <button 
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-slate-500 hover:text-rose-400 hover:bg-rose-400/5 rounded-xl transition-colors"
            >
              <LogOut size={16} />
              <span className="font-bold text-[10px] uppercase tracking-widest">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-950">
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-4xl mx-auto h-full">
            {activeTab === 'directory' && !isPro ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-8 animate-in zoom-in-95">
                <div className="p-8 bg-slate-900 border border-slate-800 rounded-[3rem] shadow-2xl relative">
                   <Lock className="text-indigo-500 mb-6 mx-auto" size={64} />
                   <h2 className="text-3xl font-black text-white uppercase mb-4">Access Restricted</h2>
                   <p className="text-slate-400 max-w-sm mx-auto mb-8 text-sm">The Global Student Roster is a Pro-only feature designed for academic networking and class management.</p>
                   <button 
                    onClick={() => setActiveTab('solve')}
                    className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl"
                   >
                     Upgrade to Access
                   </button>
                </div>
              </div>
            ) : children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
