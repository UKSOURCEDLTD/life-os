import React, { useMemo } from 'react';
import { DayLog, UserProfile, WealthData, GoalsData } from '../types';
import { aggregateRange, findBestAndWorstDay } from '../utils/aggregations';
import { getWeekRange, formatDate } from '../utils/storage';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface Props {
  logs: Record<string, DayLog>;
  currentDate: string;
  profile: UserProfile;
  wealth: WealthData;
  goals: GoalsData;
  burnFn: (log: DayLog) => number;
  onNavigateDate: (date: string) => void;
  onChangeWeek: (newDate: string) => void;
}

const WeeklyView: React.FC<Props> = ({ logs, currentDate, profile, wealth, goals, burnFn, onNavigateDate, onChangeWeek }) => {
  const week = useMemo(() => getWeekRange(currentDate), [currentDate]);
  const agg = useMemo(() => aggregateRange(logs, week.days, burnFn), [logs, week, burnFn]);
  const bw = useMemo(() => findBestAndWorstDay(logs, week.days), [logs, week]);

  const chartData = week.days.map(d => {
    const log = logs[d];
    const intake = log ? log.meals.reduce((s, m) => s + m.ingredients.reduce((s2, i) => s2 + (i.macros?.calories || 0), 0), 0) : 0;
    const burn = log ? burnFn(log) : 0;
    return {
      day: new Date(d).toLocaleDateString('en-US', { weekday: 'short' }),
      date: d,
      intake: Math.round(intake),
      burn: Math.round(burn),
      net: Math.round(intake - burn),
      habits: log && log.habits.length ? Math.round((log.habits.filter(h => h.completed).length / log.habits.length) * 100) : 0,
      sleep: log?.sleepHours || 0,
      mood: log?.mood || 0,
    };
  });

  const shiftWeek = (delta: number) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + delta * 7);
    onChangeWeek(d.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h3 className="text-[10px] font-black uppercase text-zinc-600 mb-2">Weekly Synthesis</h3>
          <h2 className="text-3xl lg:text-5xl font-bold uppercase text-white">Week Review</h2>
          <p className="text-[10px] font-bold text-zinc-500 uppercase mt-2 tracking-widest">{formatDate(week.start)} — {formatDate(week.end)} · {agg.loggedCount}/7 days logged</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => shiftWeek(-1)} className="bg-zinc-900 border border-zinc-800 text-zinc-400 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-white">← Prev</button>
          <button onClick={() => onChangeWeek(new Date().toISOString().split('T')[0])} className="bg-zinc-900 border border-zinc-800 text-zinc-400 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-white">This Week</button>
          <button onClick={() => shiftWeek(1)} className="bg-zinc-900 border border-zinc-800 text-zinc-400 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-white">Next →</button>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        <Stat label="Habit %" value={`${agg.avg.habitPct}%`} color="text-indigo-400" />
        <Stat label="Avg Intake" value={`${agg.avg.intake}`} sub="KCAL" color="text-white" />
        <Stat label="Avg Burn" value={`${agg.avg.burn}`} sub="KCAL" color="text-white" />
        <Stat label="Net Δ" value={`${agg.avg.net > 0 ? '+' : ''}${agg.avg.net}`} color={agg.avg.net > 0 ? 'text-amber-400' : 'text-emerald-400'} />
        <Stat label="Avg Sleep" value={`${agg.avg.sleep}h`} color={agg.avg.sleep >= profile.sleepTarget ? 'text-emerald-400' : 'text-amber-400'} />
        <Stat label="Avg Mood" value={`${agg.avg.mood}/5`} color="text-emerald-400" />
        <Stat label="Weight Δ" value={`${agg.weightDelta > 0 ? '+' : ''}${agg.weightDelta}`} sub="KG" color={agg.weightDelta < 0 ? 'text-emerald-400' : 'text-amber-400'} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="glass p-6 rounded-3xl border border-zinc-800">
          <div className="flex justify-between items-center mb-4 border-b border-zinc-900 pb-3">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Calorie Balance</h4>
            <div className="flex gap-3 text-[8px]">
              <span className="text-indigo-400 font-bold">● Intake</span>
              <span className="text-emerald-400 font-bold">● Burn</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                <XAxis dataKey="day" stroke="#3f3f46" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#3f3f46" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px', fontSize: '11px' }} />
                <Bar dataKey="intake" fill="#6366f1" radius={[6, 6, 0, 0]} />
                <Bar dataKey="burn" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass p-6 rounded-3xl border border-zinc-800">
          <div className="flex justify-between items-center mb-4 border-b border-zinc-900 pb-3">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Habit Consistency</h4>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                <XAxis dataKey="day" stroke="#3f3f46" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} stroke="#3f3f46" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px', fontSize: '11px' }} />
                <Line type="monotone" dataKey="habits" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {bw.best && (
          <div className="glass p-6 rounded-3xl border border-emerald-500/30">
            <div className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">★ Best Day</div>
            <div className="text-2xl font-bold text-white mb-1">{formatDate(bw.best.date)}</div>
            <div className="text-sm text-zinc-400">Habit consistency: {Math.round(bw.best.pct)}%</div>
            <button onClick={() => onNavigateDate(bw.best!.date)} className="mt-3 text-[10px] font-black text-emerald-400 uppercase tracking-widest hover:underline">View →</button>
          </div>
        )}
        {bw.worst && bw.best?.date !== bw.worst.date && (
          <div className="glass p-6 rounded-3xl border border-red-500/20">
            <div className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-1">⚠ Lowest Day</div>
            <div className="text-2xl font-bold text-white mb-1">{formatDate(bw.worst.date)}</div>
            <div className="text-sm text-zinc-400">Habit consistency: {Math.round(bw.worst.pct)}%</div>
            <button onClick={() => onNavigateDate(bw.worst!.date)} className="mt-3 text-[10px] font-black text-red-400 uppercase tracking-widest hover:underline">View →</button>
          </div>
        )}
      </div>

      <div className="glass p-6 rounded-3xl border border-zinc-800">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">Daily Breakdown</h4>
        <div className="space-y-2">
          {week.days.map(d => {
            const log = logs[d];
            const habitsPct = log && log.habits.length ? Math.round((log.habits.filter(h => h.completed).length / log.habits.length) * 100) : 0;
            const intake = log ? log.meals.reduce((s, m) => s + m.ingredients.reduce((s2, i) => s2 + (i.macros?.calories || 0), 0), 0) : 0;
            return (
              <button key={d} onClick={() => onNavigateDate(d)} className="w-full flex items-center gap-3 p-3 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/50 rounded-xl transition-all text-left">
                <div className="w-20 shrink-0">
                  <div className="text-[9px] font-black uppercase text-zinc-600">{new Date(d).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                  <div className="text-sm font-bold text-white">{new Date(d).getDate()}</div>
                </div>
                <div className="flex-1 grid grid-cols-4 gap-3 text-xs">
                  <div><div className="text-[8px] text-zinc-600 uppercase">Habits</div><div className={`font-bold ${habitsPct >= 80 ? 'text-emerald-400' : habitsPct >= 50 ? 'text-amber-400' : 'text-zinc-500'}`}>{habitsPct}%</div></div>
                  <div><div className="text-[8px] text-zinc-600 uppercase">Kcal</div><div className="font-bold text-white">{Math.round(intake)}</div></div>
                  <div><div className="text-[8px] text-zinc-600 uppercase">Sleep</div><div className="font-bold text-white">{log?.sleepHours || '—'}h</div></div>
                  <div><div className="text-[8px] text-zinc-600 uppercase">Mood</div><div className="font-bold text-white">{log?.mood ? `${log.mood}/5` : '—'}</div></div>
                </div>
                <svg className="w-4 h-4 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string; sub?: string; color: string }> = ({ label, value, sub, color }) => (
  <div className="glass p-4 rounded-2xl border border-zinc-800">
    <div className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{label}</div>
    <div className={`text-xl font-black ${color} tabular-nums mt-1`}>{value}</div>
    {sub && <div className="text-[8px] text-zinc-700 uppercase font-bold mt-0.5">{sub}</div>}
  </div>
);

export default WeeklyView;
