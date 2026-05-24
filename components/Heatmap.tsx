
import React, { useState } from 'react';
import { DayLog } from '../types';

interface HeatmapProps {
  logs: Record<string, DayLog>;
  onDateClick?: (date: string) => void;
  currentDate: string;
  trackingStartDate: string;
}

const Heatmap: React.FC<HeatmapProps> = ({ logs, onDateClick, currentDate, trackingStartDate }) => {
  const [viewDate, setViewDate] = useState(new Date(currentDate));

  const changeMonth = (offset: number) => {
    const next = new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1);
    setViewDate(next);
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  const monthName = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const todayStr = new Date().toISOString().split('T')[0];

  const getCompletionLevel = (dateStr: string) => {
    // If date is before tracking start date, we return a special 'muted' status
    if (dateStr < trackingStartDate) return 'bg-zinc-950 opacity-20';

    const log = logs[dateStr];
    if (!log) return 'bg-zinc-900';
    const total = log.habits.length;
    if (total === 0) return 'bg-zinc-800';
    const completed = log.habits.filter(h => h.completed).length;
    const pct = completed / total;
    
    if (pct === 0) return 'bg-zinc-800';
    if (pct < 0.3) return 'bg-indigo-950/40';
    if (pct < 0.6) return 'bg-indigo-900/60';
    if (pct < 0.9) return 'bg-indigo-700';
    
    return 'bg-indigo-500';
  };

  return (
    <div className="bg-zinc-900/50 p-6 sm:p-8 rounded-3xl border border-zinc-800/50 overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-1">Consistency Matrix</h3>
          <span className="text-sm font-bold text-zinc-100 uppercase tracking-tight">{monthName}</span>
        </div>
        <div className="flex gap-1">
          <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <button onClick={() => setViewDate(new Date())} className="px-3 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white">Now</button>
          <button onClick={() => changeMonth(1)} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
          <div key={d} className="text-[9px] font-black text-zinc-700 text-center uppercase py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`pad-${i}`} className="aspect-square" />
        ))}
        
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isSelected = dateStr === currentDate;
          const isToday = dateStr === todayStr;
          const isBeforeGenesis = dateStr < trackingStartDate;
          
          const completionLevel = getCompletionLevel(dateStr);
          
          return (
            <button 
              key={dateStr}
              title={isBeforeGenesis ? `Pre-Genesis: ${dateStr}` : `Day ${day}: ${dateStr}`}
              onClick={() => onDateClick?.(dateStr)}
              className={`
                relative w-full aspect-square rounded-lg transition-all duration-300 group
                flex items-center justify-center overflow-hidden
                ${isSelected ? 'ring-2 ring-white scale-110 z-10 shadow-xl' : 'hover:scale-105'} 
                ${completionLevel}
                ${completionLevel.includes('bg-indigo-500') ? 'shadow-[0_0_10px_rgba(99,102,241,0.3)]' : ''}
              `}
            >
              <span className={`
                text-[9px] font-black transition-opacity duration-300 opacity-0 group-hover:opacity-100
                ${completionLevel.includes('bg-indigo-500') ? 'text-zinc-950' : 'text-zinc-400'}
              `}>
                {day}
              </span>
              {isToday && (
                <div className="absolute top-1 right-1 w-1 h-1 bg-white rounded-full shadow-[0_0_5px_white]" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-8 pt-6 border-t border-zinc-800 flex items-center justify-between text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-sm bg-zinc-950 opacity-20 border border-zinc-800" />
          <span>Pre-Genesis</span>
        </div>
        <div className="flex gap-1 items-center">
          {[ 'bg-zinc-800', 'bg-indigo-950/40', 'bg-indigo-900/60', 'bg-indigo-700', 'bg-indigo-500' ].map(c => (
            <div key={c} className={`w-2.5 h-2.5 rounded-sm ${c}`} />
          ))}
        </div>
        <span>Peak Execution</span>
      </div>
    </div>
  );
};

export default Heatmap;
