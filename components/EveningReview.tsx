import React from 'react';
import { EveningReview as ReviewType } from '../types';

interface Props {
  review: ReviewType;
  onChange: (r: ReviewType) => void;
}

const EveningReview: React.FC<Props> = ({ review, onChange }) => {
  const setField = <K extends keyof ReviewType>(k: K, v: ReviewType[K]) => onChange({ ...review, [k]: v });

  return (
    <div className="glass p-6 sm:p-8 rounded-[2rem] border border-zinc-800/50">
      <div className="flex justify-between items-center mb-5 border-b border-zinc-900 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>
          </div>
          <div>
            <div className="text-[9px] font-black uppercase tracking-[0.25em] text-zinc-500">Evening Review</div>
            <div className="text-sm font-bold text-white">60-Second Wrap-up</div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-[9px] font-black uppercase text-zinc-600 ml-1 tracking-widest mb-2 block">Day Rating</label>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
              <button
                key={n}
                onClick={() => setField('rating', review.rating === n ? 0 : n)}
                className={`flex-1 h-9 rounded-lg text-[10px] font-black transition-all active:scale-90 ${
                  review.rating >= n
                    ? n >= 8 ? 'bg-emerald-500 text-zinc-950' : n >= 5 ? 'bg-amber-500 text-zinc-950' : 'bg-red-500 text-zinc-950'
                    : 'bg-zinc-900 text-zinc-600 border border-zinc-800'
                }`}
              >{n}</button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[9px] font-black uppercase text-zinc-600 ml-1 tracking-widest mb-1 block">Today's Win</label>
          <input
            type="text"
            value={review.win}
            onChange={(e) => setField('win', e.target.value)}
            placeholder="What went well?"
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-zinc-700 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-[9px] font-black uppercase text-zinc-600 ml-1 tracking-widest mb-1 block">Lesson Learned</label>
          <input
            type="text"
            value={review.lesson}
            onChange={(e) => setField('lesson', e.target.value)}
            placeholder="What would you do differently?"
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-zinc-700 focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-[9px] font-black uppercase text-zinc-600 ml-1 tracking-widest mb-1 block">Gratitude</label>
          <input
            type="text"
            value={review.gratitude}
            onChange={(e) => setField('gratitude', e.target.value)}
            placeholder="One thing you're grateful for"
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-zinc-700 focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
};

export default EveningReview;
