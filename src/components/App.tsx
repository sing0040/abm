
import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import Auth from './Auth';
import MathSolver from './MathSolver';
import VoiceAssistant from './VoiceAssistant';
import HistoryView from './History';
import StudentDirectory from './StudentDirectory';
import ChatBot from './ChatBot';
import MockTest from './MockTest';
import { AuthState } from '../types';

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
  });
  
  const [activeTab, setActiveTab] = useState<'solve' | 'voice' | 'history' | 'directory' | 'mocktest'>('solve');
  const [language, setLanguage] = useState('English');

  // Persistence for session
  useEffect(() => {
    const storedAuth = localStorage.getItem('lumenmath_auth');
    if (storedAuth) {
      setAuth(JSON.parse(storedAuth));
    }
  }, []);

  const handleLogin = (user: any) => {
    const newState = { 
      isAuthenticated: true, 
      user: { 
        ...user, 
        status: 'Basic',
        isVerified: false
      } 
    };
    setAuth(newState);
    localStorage.setItem('lumenmath_auth', JSON.stringify(newState));
  };

  const handleLogout = () => {
    const newState = { isAuthenticated: false, user: null };
    setAuth(newState);
    localStorage.removeItem('lumenmath_auth');
  };

  if (!auth.isAuthenticated) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <Layout 
      auth={auth} 
      onLogout={handleLogout} 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
    >
      <div className="h-full">
        {activeTab === 'solve' && <MathSolver onLanguageChange={setLanguage} />}
        {activeTab === 'mocktest' && <MockTest language={language} />}
        {activeTab === 'voice' && <VoiceAssistant />}
        {activeTab === 'history' && <HistoryView />}
        {activeTab === 'directory' && <StudentDirectory />}
        
        {/* Persistent AI Chatbot */}
        <ChatBot />
      </div>
    </Layout>
  );
};

export default App;