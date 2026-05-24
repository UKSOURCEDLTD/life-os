
import React, { useState } from 'react';
import { Exercise } from '../types';
import { parseExerciseActivity } from '../services/geminiService';

interface ExerciseTrackerProps {
  exercises: Exercise[];
  onAdd: (ex: Omit<Exercise, 'id'>) => void;
  onDelete: (id: string) => void;
}

const ExerciseTracker: React.FC<ExerciseTrackerProps> = ({ exercises, onAdd, onDelete }) => {
  const [input, setInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isParsing) {
      setIsParsing(true);
      const result = await parseExerciseActivity(input.trim());
      if (result) {
        onAdd(result);
        setInput('');
      } else {
        alert("Could not identify exercise. Please try again (e.g., '30 mins running')");
      }
      setIsParsing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between border-b border-zinc-800 pb-4">
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-1">Movement</h3>
          <h2 className="text-2xl font-bold text-zinc-100">Exercise Log</h2>
        </div>
      </div>
      
      <div className="space-y-3">
        {exercises.map(ex => (
          <div key={ex.id} className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-xl group animate-in fade-in slide-in-from-right-2">
            <div className="flex-1">
              <div className="text-sm font-bold text-zinc-100 uppercase">{ex.name}</div>
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                {ex.durationMinutes} MIN | {ex.caloriesBurned} KCAL
              </div>
            </div>
            <button onClick={() => onDelete(ex.id)} className="text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={handleAdd} className="pt-4">
        <div className="relative">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isParsing}
            placeholder={isParsing ? "AI is analyzing..." : "Add activity (e.g. '45m lifting')"}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-5 py-4 text-xs font-bold text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all pr-12"
          />
          <button 
            type="submit"
            disabled={isParsing || !input.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-500 disabled:opacity-30 hover:text-indigo-400 transition-colors"
          >
            {isParsing ? (
               <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-[10px] text-zinc-700 mt-2 italic text-center font-bold uppercase tracking-widest">
          Powered by Gemini AI Vision
        </p>
      </form>
    </div>
  );
};

export default ExerciseTracker;
