
import React from 'react';
import { Habit } from '../types';

interface HabitListProps {
  habits: Habit[];
  onToggle: (id: string) => void;
  onAdd: (name: string) => void;
  onDelete: (id: string) => void;
}

const HabitList: React.FC<HabitListProps> = ({ habits, onToggle, onAdd, onDelete }) => {
  const [newHabit, setNewHabit] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newHabit.trim()) {
      onAdd(newHabit.trim());
      setNewHabit('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between border-b border-zinc-800 pb-4">
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-1">Execution</h3>
          <h2 className="text-2xl font-bold text-zinc-100">Habit Tracking</h2>
        </div>
        <span className="text-xs font-mono text-zinc-400 bg-zinc-900 px-3 py-1 rounded border border-zinc-800">
          {Math.round((habits.filter(h => h.completed).length / (habits.length || 1)) * 100)}% CONSISTENCY
        </span>
      </div>
      
      <div className="space-y-2">
        {habits.map((habit) => (
          <div 
            key={habit.id} 
            className={`group flex items-center p-4 rounded-lg border transition-all duration-300 ${
              habit.completed 
                ? 'bg-zinc-900/50 border-zinc-800/50' 
                : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <button
              onClick={() => onToggle(habit.id)}
              className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all active:scale-90 ${
                habit.completed ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'border-2 border-zinc-700 hover:border-zinc-500'
              }`}
            >
              {habit.completed && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <span className={`ml-4 flex-1 text-sm font-medium tracking-tight transition-all ${habit.completed ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>
              {habit.name}
            </span>
            <button 
              onClick={() => onDelete(habit.id)}
              className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all p-2 active:scale-75"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-6 flex gap-2">
        <input 
          type="text" 
          value={newHabit}
          onChange={(e) => setNewHabit(e.target.value)}
          placeholder="New performance habit..."
          className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-medium focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all placeholder-zinc-700"
        />
        <button 
          type="submit"
          className="bg-zinc-100 text-zinc-950 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all active:scale-95"
        >
          Add
        </button>
      </form>
    </div>
  );
};

export default HabitList;
