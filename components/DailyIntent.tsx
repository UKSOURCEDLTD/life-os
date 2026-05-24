import React from 'react';
import { DailyIntent as DailyIntentType } from '../types';

interface Props {
  intent: DailyIntentType;
  onChange: (intent: DailyIntentType) => void;
}

const DailyIntent: React.FC<Props> = ({ intent, onChange }) => {
  const setField = (k: keyof DailyIntentType, v: string) => onChange({ ...intent, [k]: v });
  const completedCount = [intent.mit1, intent.mit2, intent.mit3].filter(Boolean).length;

  return (
    <div className="glass p-6 sm:p-8 rounded-[2rem] border border-zinc-800/50">
      <div className="flex justify-between items-center mb-5 border-b border-zinc-900 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <div>
            <div className="text-[9px] font-black uppercase tracking-[0.25em] text-zinc-500">Morning Intent</div>
            <div className="text-sm font-bold text-white">3 Most Important Tasks</div>
          </div>
        </div>
        <div className="text-[9px] font-black uppercase tracking-widest text-indigo-400">{completedCount}/3 SET</div>
      </div>

      <div className="space-y-2.5">
        {[1, 2, 3].map(n => {
          const key = `mit${n}` as keyof DailyIntentType;
          return (
            <div key={n} className="flex items-center gap-3 group">
              <div className="w-7 h-7 shrink-0 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-black text-zinc-500 group-focus-within:border-indigo-500 group-focus-within:text-indigo-400 transition-colors">{n}</div>
              <input
                type="text"
                value={intent[key] as string}
                onChange={(e) => setField(key, e.target.value)}
                placeholder={n === 1 ? 'The one thing that must get done' : n === 2 ? 'Second priority' : 'Third priority'}
                className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm font-medium text-white placeholder:text-zinc-700 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          );
        })}
        <div className="pt-2">
          <label className="text-[9px] font-black uppercase text-zinc-600 ml-1 tracking-widest mb-1 block">Focus / Theme</label>
          <input
            type="text"
            value={intent.focus}
            onChange={(e) => setField('focus', e.target.value)}
            placeholder="e.g. Deep work, recovery, execution"
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-medium text-zinc-300 placeholder:text-zinc-700 focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
};

export default DailyIntent;
