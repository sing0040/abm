
import React, { useState, useEffect } from 'react';
import { dbService } from '../services/database';
import { MathSolution } from '../types';
import { Calendar, Trash2, ChevronRight, Calculator } from 'lucide-react';

const HistoryView: React.FC = () => {
  const [history, setHistory] = useState<MathSolution[]>([]);

  useEffect(() => {
    setHistory(dbService.getHistory());
  }, []);

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Calculator className="text-slate-800 mb-4" size={48} />
        <h3 className="text-xl font-semibold text-slate-400">No history yet</h3>
        <p className="text-slate-600 text-sm">Solved problems will appear here for reference.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header>
        <h2 className="text-3xl font-bold text-white mb-2">Recent Work</h2>
        <p className="text-slate-400">Your solved problems are stored locally for quick access.</p>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {history.map((item) => (
          <div 
            key={item.id} 
            className="group bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-indigo-500/30 transition-all flex items-start justify-between cursor-pointer"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-widest font-bold">
                <Calendar size={14} />
                {new Date(item.timestamp).toLocaleDateString()}
              </div>
              <h4 className="text-slate-200 font-medium font-mono line-clamp-1 group-hover:text-indigo-400 transition-colors">
                {item.question}
              </h4>
              <p className="text-sm text-slate-500 line-clamp-2">
                {item.explanation.substring(0, 150)}...
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 text-slate-600 hover:text-rose-400 transition-colors">
                <Trash2 size={18} />
              </button>
              <div className="p-2 bg-slate-800 rounded-lg text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <ChevronRight size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryView;
