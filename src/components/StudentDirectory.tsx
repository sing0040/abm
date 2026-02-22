
import React, { useState, useEffect } from 'react';
import { dbService } from '../services/database';
import { StudentRecord } from '../types';
import { ShieldCheck, ShieldAlert, GraduationCap, Search, Filter, Mail, ExternalLink } from 'lucide-react';

const StudentDirectory: React.FC = () => {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [filter, setFilter] = useState<'all' | 'Pro' | 'Basic'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setStudents(dbService.getStudentRoster());
  }, []);

  const filtered = students.filter(s => {
    const matchesFilter = filter === 'all' || s.status === filter;
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight uppercase">Global Roster</h2>
          <p className="text-slate-500 text-sm">A directory of students currently using LumenMath neural engines.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or email..."
              className="bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-6 py-3 text-sm text-white focus:border-indigo-500 outline-none w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="bg-slate-900 border border-slate-800 rounded-2xl px-6 py-3 text-sm text-slate-300 font-bold outline-none cursor-pointer"
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
          >
            <option value="all">All Students</option>
            <option value="Pro">Pro Only</option>
            <option value="Basic">Basic Only</option>
          </select>
        </div>
      </header>

      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead className="bg-slate-800/50 border-b border-slate-800">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Student Identity</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Academic Status</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Verification</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-right">Last Session</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filtered.map((s) => (
              <tr key={s.id} className="group hover:bg-slate-800/30 transition-colors">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${s.status === 'Pro' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-white font-bold group-hover:text-indigo-400 transition-colors">{s.name}</p>
                      <p className="text-xs text-slate-500">{s.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${s.status === 'Pro' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
                    <GraduationCap size={12} />
                    {s.status} Access
                  </div>
                </td>
                <td className="px-8 py-6">
                  {s.verified ? (
                    <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-bold uppercase tracking-widest">
                      <ShieldCheck size={14} />
                      Verified
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-rose-500 text-[10px] font-bold uppercase tracking-widest">
                      <ShieldAlert size={14} />
                      Unverified
                    </div>
                  )}
                </td>
                <td className="px-8 py-6 text-right">
                  <p className="text-xs font-mono text-slate-500">
                    {new Date(s.lastActive).toLocaleDateString()}
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-20 text-center space-y-4">
            <div className="text-slate-700"><Search size={48} className="mx-auto" /></div>
            <p className="text-slate-500 font-bold">No students found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDirectory;
