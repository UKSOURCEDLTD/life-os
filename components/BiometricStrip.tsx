import React from 'react';
import { DayLog, UserProfile } from '../types';

interface Props {
  log: DayLog;
  profile: UserProfile;
  onChange: (log: DayLog) => void;
}

const BiometricStrip: React.FC<Props> = ({ log, profile, onChange }) => {
  const update = (patch: Partial<DayLog>) => onChange({ ...log, ...patch });

  const moods = [
    { v: 1, label: 'AWFUL', color: 'bg-red-500' },
    { v: 2, label: 'LOW', color: 'bg-orange-500' },
    { v: 3, label: 'OK', color: 'bg-amber-500' },
    { v: 4, label: 'GOOD', color: 'bg-emerald-500' },
    { v: 5, label: 'PEAK', color: 'bg-indigo-500' },
  ];

  return (
    <div className="glass p-6 rounded-[2rem] border border-zinc-800/50 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      <div>
        <label className="text-[9px] font-black uppercase text-zinc-600 tracking-widest block mb-1.5">Weight</label>
        <div className="flex items-center gap-1">
          <input
            type="number"
            step="0.1"
            value={log.weight || ''}
            onChange={(e) => update({ weight: Number(e.target.value) })}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-base font-bold text-white w-full focus:border-indigo-500 outline-none"
            placeholder="0.0"
          />
          <span className="text-[9px] font-black text-zinc-600 uppercase">kg</span>
        </div>
      </div>

      <div>
        <label className="text-[9px] font-black uppercase text-zinc-600 tracking-widest block mb-1.5">Steps</label>
        <input
          type="number"
          value={log.steps || ''}
          onChange={(e) => update({ steps: Number(e.target.value) })}
          className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-base font-bold text-indigo-400 w-full focus:border-indigo-500 outline-none"
          placeholder="0"
        />
      </div>

      <div>
        <label className="text-[9px] font-black uppercase text-zinc-600 tracking-widest block mb-1.5">
          Sleep <span className="text-zinc-700">/ {profile.sleepTarget}h</span>
        </label>
        <div className="flex items-center gap-1">
          <input
            type="number"
            step="0.25"
            value={log.sleepHours || ''}
            onChange={(e) => update({ sleepHours: Number(e.target.value) })}
            className={`bg-zinc-900 border rounded-lg px-3 py-2 text-base font-bold w-full outline-none ${
              log.sleepHours >= profile.sleepTarget ? 'border-emerald-500/30 text-emerald-400' : log.sleepHours > 0 ? 'border-amber-500/30 text-amber-400' : 'border-zinc-800 text-white'
            }`}
            placeholder="0"
          />
          <span className="text-[9px] font-black text-zinc-600 uppercase">h</span>
        </div>
      </div>

      <div>
        <label className="text-[9px] font-black uppercase text-zinc-600 tracking-widest block mb-1.5">
          Water <span className="text-zinc-700">/ {profile.waterTarget}L</span>
        </label>
        <div className="flex items-center gap-1">
          <input
            type="number"
            step="0.1"
            value={log.waterLiters || ''}
            onChange={(e) => update({ waterLiters: Number(e.target.value) })}
            className={`bg-zinc-900 border rounded-lg px-3 py-2 text-base font-bold w-full outline-none ${
              log.waterLiters >= profile.waterTarget ? 'border-blue-500/30 text-blue-400' : 'border-zinc-800 text-white'
            }`}
            placeholder="0.0"
          />
          <span className="text-[9px] font-black text-zinc-600 uppercase">L</span>
        </div>
      </div>

      <div className="col-span-2 md:col-span-1">
        <label className="text-[9px] font-black uppercase text-zinc-600 tracking-widest block mb-1.5">Mood</label>
        <div className="flex gap-1">
          {moods.map(m => (
            <button
              key={m.v}
              onClick={() => update({ mood: log.mood === m.v ? 0 : m.v })}
              title={m.label}
              className={`flex-1 h-9 rounded-md transition-all active:scale-90 ${log.mood === m.v ? m.color : 'bg-zinc-900 border border-zinc-800'}`}
            />
          ))}
        </div>
      </div>

      <div className="col-span-2 md:col-span-1">
        <label className="text-[9px] font-black uppercase text-zinc-600 tracking-widest block mb-1.5">Energy</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              onClick={() => update({ energy: log.energy === n ? 0 : n })}
              className={`flex-1 h-9 rounded-md transition-all active:scale-90 text-[10px] font-black ${
                log.energy >= n ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-900 border border-zinc-800 text-zinc-600'
              }`}
            >{log.energy >= n ? '⚡' : ''}</button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BiometricStrip;
