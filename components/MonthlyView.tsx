import React, { useMemo } from 'react';
import { DayLog, UserProfile, WealthData, GoalsData } from '../types';
import { aggregateRange, findBestAndWorstDay } from '../utils/aggregations';
import { getMonthRange } from '../utils/storage';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface Props {
  logs: Record<string, DayLog>;
  currentDate: string;
  profile: UserProfile;
  wealth: WealthData;
  goals: GoalsData;
  burnFn: (log: DayLog) => number;
  onNavigateDate: (date: string) => void;
  onChangeMonth: (newDate: string) => void;
}

const MonthlyView: React.FC<Props> = ({ logs, currentDate, profile, wealth, goals, burnFn, onNavigateDate, onChangeMonth }) => {
  const month = useMemo(() => getMonthRange(currentDate), [currentDate]);
  const agg = useMemo(() => aggregateRange(logs, month.days, burnFn), [logs, month, burnFn]);
  const bw = useMemo(() => findBestAndWorstDay(logs, month.days), [logs, month]);

  const weightTrend = month.days.map(d => {
    const log = logs[d];
    return { day: new Date(d).getDate(), weight: log?.weight || null, date: d };
  }).filter(p => p.weight !== null);

  const shiftMonth = (delta: number) => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + delta);
    onChangeMonth(d.toISOString().split('T')[0]);
  };

  const goalsThisMonth = goals.goals.filter(g => g.status === 'active');
  const completedGoals = goals.goals.filter(g => g.status === 'completed');

  const insights: string[] = [];
  if (agg.avg.habitPct >= 80) insights.push(`Strong execution — ${agg.avg.habitPct}% habit consistency.`);
  else if (agg.avg.habitPct < 50) insights.push(`Execution dipped to ${agg.avg.habitPct}%. Reset for next month.`);
  if (agg.weightDelta < -0.5) insights.push(`Lost ${Math.abs(agg.weightDelta)}kg this month.`);
  else if (agg.weightDelta > 0.5) insights.push(`Gained ${agg.weightDelta}kg this month.`);
  if (agg.avg.sleep < profile.sleepTarget - 1) insights.push(`Sleep averaged ${agg.avg.sleep}h vs ${profile.sleepTarget}h target.`);
  if (agg.avg.sleep >= profile.sleepTarget) insights.push(`Sleep on target at ${agg.avg.sleep}h average.`);
  if (agg.loggedCount < month.days.length * 0.7) insights.push(`Only ${agg.loggedCount}/${month.days.length} days logged.`);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h3 className="text-[10px] font-black uppercase text-zinc-600 mb-2">Monthly Retro</h3>
          <h2 className="text-3xl lg:text-5xl font-bold uppercase text-white">{month.label}</h2>
          <p className="text-[10px] font-bold text-zinc-500 uppercase mt-2 tracking-widest">{agg.loggedCount}/{month.days.length} days logged · {Math.round((agg.loggedCount / month.days.length) * 100)}% adherence</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => shiftMonth(-1)} className="bg-zinc-900 border border-zinc-800 text-zinc-400 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-white">← Prev</button>
          <button onClick={() => onChangeMonth(new Date().toISOString().split('T')[0])} className="bg-zinc-900 border border-zinc-800 text-zinc-400 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-white">This Month</button>
          <button onClick={() => shiftMonth(1)} className="bg-zinc-900 border border-zinc-800 text-zinc-400 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-white">Next →</button>
        </div>
      </header>

      {insights.length > 0 && (
        <div className="glass p-6 rounded-3xl border border-indigo-500/20 bg-indigo-500/5">
          <div className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-3">◆ Monthly Insights</div>
          <ul className="space-y-1.5">
            {insights.map((i, ix) => (
              <li key={ix} className="text-sm text-zinc-200 flex gap-2"><span className="text-indigo-400">→</span>{i}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
        <Stat label="Execution" value={`${agg.avg.habitPct}%`} color="text-indigo-400" />
        <Stat label="Avg Kcal" value={`${agg.avg.intake}`} color="text-white" />
        <Stat label="Avg Burn" value={`${agg.avg.burn}`} color="text-white" />
        <Stat label="Avg Sleep" value={`${agg.avg.sleep}h`} color="text-emerald-400" />
        <Stat label="Avg Steps" value={`${agg.avg.steps.toLocaleString()}`} color="text-amber-400" />
        <Stat label="Weight Δ" value={`${agg.weightDelta > 0 ? '+' : ''}${agg.weightDelta}kg`} color={agg.weightDelta < 0 ? 'text-emerald-400' : 'text-zinc-300'} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="glass p-6 rounded-3xl border border-zinc-800">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4 border-b border-zinc-900 pb-3">Weight Trajectory</h4>
          {weightTrend.length > 1 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weightTrend}>
                  <defs>
                    <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                  <XAxis dataKey="day" stroke="#3f3f46" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis domain={['auto', 'auto']} stroke="#3f3f46" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px', fontSize: '11px' }} />
                  <Area type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={2.5} fill="url(#weightGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : <div className="h-64 flex items-center justify-center text-[10px] font-black text-zinc-700 uppercase tracking-widest">Not enough data</div>}
        </div>

        <div className="glass p-6 rounded-3xl border border-zinc-800">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4 border-b border-zinc-900 pb-3">Goal Progress</h4>
          <div className="space-y-3">
            {goalsThisMonth.slice(0, 5).map(g => {
              const pct = g.targetValue ? Math.min(100, ((g.currentValue || 0) / g.targetValue) * 100) : 0;
              return (
                <div key={g.id}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-bold text-zinc-300 truncate">{g.title}</span>
                    <span className="text-zinc-500 tabular-nums">{g.unit || ''}{g.currentValue || 0} / {g.unit || ''}{g.targetValue || '—'}</span>
                  </div>
                  <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all duration-700" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {goalsThisMonth.length === 0 && <div className="text-[10px] font-black text-zinc-700 uppercase tracking-widest text-center py-8">No active goals</div>}
          </div>
        </div>
      </div>

      <div className="glass p-6 rounded-3xl border border-zinc-800">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4 border-b border-zinc-900 pb-3">Calendar</h4>
        <div className="grid grid-cols-7 gap-1.5">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <div key={i} className="text-center text-[9px] font-black text-zinc-700 uppercase tracking-widest pb-2">{d}</div>
          ))}
          {(() => {
            const firstDay = new Date(month.start).getDay();
            const offset = firstDay === 0 ? 6 : firstDay - 1;
            return Array.from({ length: offset }).map((_, i) => <div key={`pad-${i}`} />);
          })()}
          {month.days.map(d => {
            const log = logs[d];
            const habitsPct = log && log.habits.length ? (log.habits.filter(h => h.completed).length / log.habits.length) : 0;
            const intensity = !log ? 'bg-zinc-900/50' : habitsPct >= 0.8 ? 'bg-emerald-500' : habitsPct >= 0.5 ? 'bg-emerald-500/60' : habitsPct > 0 ? 'bg-emerald-500/30' : 'bg-zinc-900';
            return (
              <button key={d} onClick={() => onNavigateDate(d)} className={`aspect-square rounded-md ${intensity} border border-zinc-800/30 hover:border-indigo-500 transition-all text-[10px] font-bold text-white/80 flex items-center justify-center`}>
                {new Date(d).getDate()}
              </button>
            );
          })}
        </div>
      </div>

      {(bw.best || bw.worst) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bw.best && (
            <div className="glass p-6 rounded-3xl border border-emerald-500/30">
              <div className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">★ Best Day of Month</div>
              <div className="text-2xl font-bold text-white">{new Date(bw.best.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</div>
              <div className="text-sm text-zinc-400 mt-1">{Math.round(bw.best.pct)}% habit completion</div>
            </div>
          )}
          {completedGoals.length > 0 && (
            <div className="glass p-6 rounded-3xl border border-amber-500/30">
              <div className="text-[9px] font-black text-amber-400 uppercase tracking-widest mb-1">✓ Goals Completed</div>
              <div className="text-2xl font-bold text-white">{completedGoals.length}</div>
              <div className="text-sm text-zinc-400 mt-1">Total milestones hit</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div className="glass p-4 rounded-2xl border border-zinc-800">
    <div className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{label}</div>
    <div className={`text-xl font-black ${color} tabular-nums mt-1`}>{value}</div>
  </div>
);

export default MonthlyView;
