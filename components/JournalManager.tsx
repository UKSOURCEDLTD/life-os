import React, { useMemo, useState } from 'react';
import { DayLog } from '../types';
import { formatDate } from '../utils/storage';

interface JournalManagerProps {
  logs: Record<string, DayLog>;
  currentDate: string;
  onDateSelect: (date: string) => void;
  onJournalChange: (date: string, text: string) => void;
  onMoodChange: (date: string, mood: number) => void;
}

const JournalManager: React.FC<JournalManagerProps> = ({ 
  logs, 
  currentDate, 
  onDateSelect, 
  onJournalChange, 
  onMoodChange 
}) => {
  // Mobile state to toggle between archive list and editor
  const [mobileView, setMobileView] = useState<'list' | 'editor'>('editor');

  const sortedLogs = useMemo(() => {
    return (Object.values(logs) as DayLog[]).sort((a, b) => b.date.localeCompare(a.date));
  }, [logs]);

  const activeLog = logs[currentDate];

  const moodColors = [
    'text-zinc-600',
    'text-red-400',
    'text-orange-400',
    'text-yellow-400',
    'text-emerald-400',
    'text-indigo-400'
  ];

  const wordCount = activeLog?.journal ? activeLog.journal.trim().split(/\s+/).filter(Boolean).length : 0;

  const handleSelectDate = (date: string) => {
    onDateSelect(date);
    setMobileView('editor');
  };

  return (
    <div className="flex flex-col xl:flex-row h-[calc(100vh-14rem)] lg:h-[calc(100vh-10rem)] gap-4 lg:gap-6 animate-in fade-in duration-500">
      {/* SIDEBAR: Timeline of entries - Visible on Desktop or when mobileView is 'list' */}
      <aside className={`xl:w-80 flex flex-col glass rounded-[2rem] overflow-hidden shrink-0 border border-zinc-900 transition-all ${
        mobileView === 'editor' ? 'hidden xl:flex' : 'flex'
      }`}>
        <div className="p-5 lg:p-6 border-b border-zinc-800 bg-zinc-900/40 flex justify-between items-center">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Archive Timeline</h3>
          <button 
            className="xl:hidden text-[10px] font-black uppercase text-indigo-400"
            onClick={() => setMobileView('editor')}
          >
            Close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
          {sortedLogs.map((log) => (
            <button
              key={log.date}
              onClick={() => handleSelectDate(log.date)}
              className={`w-full text-left p-4 lg:p-5 rounded-2xl transition-all mb-2 group ${
                currentDate === log.date 
                ? 'bg-zinc-100 text-zinc-950 shadow-xl scale-[0.98]' 
                : 'hover:bg-zinc-900/60 text-zinc-400'
              }`}
            >
              <div className="flex justify-between items-start mb-1 lg:mb-2">
                <span className={`text-[9px] lg:text-[10px] font-black uppercase tracking-wider ${currentDate === log.date ? 'text-zinc-500' : 'text-zinc-600'}`}>
                  {formatDate(log.date)}
                </span>
                <span className={`text-[9px] lg:text-[10px] font-black uppercase tracking-widest ${currentDate === log.date ? 'text-zinc-950' : moodColors[log.mood]}`}>
                  {log.mood === 0 ? '—' : `Mood: ${log.mood}`}
                </span>
              </div>
              <p className={`text-[11px] lg:text-xs font-bold line-clamp-2 leading-relaxed ${currentDate === log.date ? 'text-zinc-800' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                {log.journal || "No entry recorded..."}
              </p>
            </button>
          ))}
        </div>
      </aside>

      {/* MAIN: Focused Editor - Visible on Desktop or when mobileView is 'editor' */}
      <main className={`flex-1 glass rounded-[2rem] lg:rounded-[2.5rem] flex flex-col overflow-hidden border border-zinc-900/50 ${
        mobileView === 'list' ? 'hidden xl:flex' : 'flex'
      }`}>
        <div className="p-6 lg:p-8 border-b border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 lg:gap-6 bg-zinc-900/20">
          <div className="w-full md:w-auto">
            <div className="flex items-center justify-between md:block">
              <h2 className="text-xl lg:text-3xl font-black text-white tracking-tight">{formatDate(currentDate)}</h2>
              <button 
                onClick={() => setMobileView('list')}
                className="xl:hidden bg-zinc-900 text-zinc-400 border border-zinc-800 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest"
              >
                View Archive
              </button>
            </div>
            <div className="flex items-center gap-3 lg:gap-4 mt-2">
              <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-zinc-500">{wordCount} Words</span>
              <div className="w-1 h-1 bg-zinc-800 rounded-full" />
              <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-emerald-500/80">Draft Active</span>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2 w-full md:w-auto pt-2 md:pt-0 border-t border-zinc-800/50 md:border-none">
            <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-zinc-600">Daily Mood</span>
            <div className="flex gap-1.5 lg:gap-2 w-full md:w-auto">
              {[1, 2, 3, 4, 5].map((m) => (
                <button
                  key={m}
                  onClick={() => onMoodChange(currentDate, m)}
                  className={`flex-1 md:w-11 md:h-11 lg:w-12 lg:h-12 py-3 md:py-0 rounded-xl text-sm font-black transition-all active:scale-90 border ${
                    activeLog?.mood === m
                      ? 'bg-zinc-100 text-zinc-950 border-white shadow-lg'
                      : 'bg-zinc-900 text-zinc-600 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 relative group">
          <textarea
            value={activeLog?.journal || ''}
            onChange={(e) => onJournalChange(currentDate, e.target.value)}
            placeholder="Reflect on performance, breakthroughs, or blockers..."
            className="w-full h-full p-6 lg:p-10 bg-transparent text-zinc-200 text-base lg:text-xl font-medium leading-relaxed resize-none focus:outline-none placeholder-zinc-800 transition-all caret-indigo-500"
          />
          <div className="absolute bottom-4 right-6 text-[8px] lg:text-[9px] font-black text-zinc-800 uppercase tracking-[0.3em]">
            Log End
          </div>
        </div>

        <div className="px-6 lg:px-8 py-4 bg-zinc-950/40 border-t border-zinc-900/50 flex justify-between items-center">
           <div className="flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[8px] lg:text-[9px] font-black uppercase text-zinc-600 tracking-widest">Auto-Persisting</span>
           </div>
           <button 
             onClick={() => {
                const text = activeLog?.journal || '';
                const blob = new Blob([text], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Journal-${currentDate}.txt`;
                a.click();
             }}
             className="text-[8px] lg:text-[9px] font-black uppercase text-zinc-500 hover:text-indigo-400 transition-colors tracking-widest"
           >
             Export Day
           </button>
        </div>
      </main>
    </div>
  );
};

export default JournalManager;