
import React, { useState } from 'react';
import { BookOpen, FileText, Send, Loader2, CheckCircle, XCircle, RefreshCcw, Award, Sigma } from 'lucide-react';
import { generateMockTest } from '../services/gemini';
import { MockTest as MockTestType } from '../types';
import MathSolutionRenderer from './MathSolutionRenderer';

const MockTest: React.FC<{ language: string }> = ({ language }) => {
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('High School');
  const [isGenerating, setIsGenerating] = useState(false);
  const [test, setTest] = useState<MockTestType | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    try {
      const result = await generateMockTest(topic, level, language);
      setTest(result);
      setAnswers({});
      setShowResults(false);
    } catch (e) {
      alert("Failed to generate test. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectAnswer = (qId: string, idx: number) => {
    if (showResults) return;
    setAnswers(prev => ({ ...prev, [qId]: idx }));
  };

  const calculateScore = () => {
    if (!test) return 0;
    return test.questions.reduce((acc, q) => acc + (answers[q.id] === q.correctAnswer ? 1 : 0), 0);
  };

  if (test) {
    const score = calculateScore();
    return (
      <div className="space-y-8 pb-20 animate-in fade-in duration-500">
        <header className="flex items-center justify-between bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-indigo-600 rounded-2xl text-white">
              <FileText size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase">{test.title}</h2>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{level} • {language}</p>
            </div>
          </div>
          {showResults && (
            <div className="text-right">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Final Result</p>
              <div className={`text-4xl font-black ${score >= 3 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {score} / {test.questions.length}
              </div>
            </div>
          )}
        </header>

        <div className="space-y-6">
          {test.questions.map((q, qIdx) => (
            <div key={q.id} className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl transition-all">
              <div className="p-8 md:p-12 space-y-8">
                <div className="flex gap-4">
                  <span className="text-indigo-400 font-black text-xl">0{qIdx + 1}.</span>
                  <div className="flex-1">
                    <MathSolutionRenderer content={q.question} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {q.options.map((opt, oIdx) => {
                    const isSelected = answers[q.id] === oIdx;
                    const isCorrect = q.correctAnswer === oIdx;
                    let borderClass = "border-slate-800";
                    let bgClass = "bg-slate-950/50";

                    if (showResults) {
                      if (isCorrect) {
                        borderClass = "border-emerald-500 bg-emerald-500/10";
                      } else if (isSelected && !isCorrect) {
                        borderClass = "border-rose-500 bg-rose-500/10";
                      }
                    } else if (isSelected) {
                      borderClass = "border-indigo-500 bg-indigo-600/10";
                    }

                    return (
                      <button
                        key={oIdx}
                        onClick={() => handleSelectAnswer(q.id, oIdx)}
                        className={`p-6 border-2 rounded-2xl text-left transition-all ${borderClass} ${bgClass} hover:border-indigo-400`}
                      >
                        <div className="flex items-center justify-between">
                          <MathSolutionRenderer content={opt} />
                          {showResults && isCorrect && <CheckCircle size={20} className="text-emerald-500" />}
                          {showResults && isSelected && !isCorrect && <XCircle size={20} className="text-rose-500" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {showResults && (
                  <div className="mt-8 pt-8 border-t border-slate-800 animate-in slide-in-from-top-4">
                    <div className="flex items-center gap-2 text-indigo-400 mb-4">
                      <Sigma size={18} />
                      <h4 className="text-xs font-black uppercase tracking-widest">Satyam's Logic</h4>
                    </div>
                    <MathSolutionRenderer content={q.explanation} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-4">
          {!showResults ? (
            <button
              onClick={() => setShowResults(true)}
              disabled={Object.keys(answers).length < test.questions.length}
              className="px-12 py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 disabled:opacity-50"
            >
              Submit Exam
            </button>
          ) : (
            <button
              onClick={() => setTest(null)}
              className="px-12 py-5 bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-700 flex items-center gap-3"
            >
              <RefreshCcw size={20} />
              New Test
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
      <div className="relative">
        <div className="absolute -inset-4 bg-indigo-600/20 blur-3xl rounded-full"></div>
        <div className="relative p-8 bg-slate-900 border border-slate-800 rounded-[3rem] text-indigo-400 shadow-2xl">
          <BookOpen size={64} />
        </div>
      </div>

      <div className="max-w-md space-y-2">
        <h2 className="text-4xl font-black text-white uppercase">Mock Test Engine</h2>
        <p className="text-slate-500">Generate a custom math assessment tailored to your level. Use {language} for best results.</p>
      </div>

      <div className="w-full max-w-lg bg-slate-900 p-10 rounded-[2.5rem] border border-slate-800 space-y-6 shadow-2xl">
        <div className="space-y-2 text-left">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Topic (विषय)</label>
          <input
            type="text"
            placeholder="e.g. Calculus, Algebra, Geometry..."
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white outline-none focus:border-indigo-500 transition-all"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </div>

        <div className="space-y-2 text-left">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Academic Level (स्तर)</label>
          <select
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white outline-none focus:border-indigo-500 appearance-none cursor-pointer"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
          >
            <option>Middle School</option>
            <option>High School</option>
            <option>Undergraduate</option>
            <option>Postgraduate</option>
          </select>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating || !topic.trim()}
          className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 transition-all flex items-center justify-center gap-3"
        >
          {isGenerating ? <Loader2 className="animate-spin" /> : <Sigma size={20} />}
          {isGenerating ? 'Synthesizing Test...' : 'Generate Mock Test'}
        </button>
      </div>
    </div>
  );
};

export default MockTest;
