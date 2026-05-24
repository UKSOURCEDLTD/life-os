import React, { useState, useMemo } from 'react';
import { GoalsData, Goal, LifeArea, GoalTimeframe, Milestone, WealthData, Habit, DayLog } from '../types';

interface Props {
  goals: GoalsData;
  wealth: WealthData;
  masterHabits: Habit[];
  logs: Record<string, DayLog>;
  onUpdate: (g: GoalsData) => void;
}

const LIFE_AREAS: { id: LifeArea; label: string; icon: string; color: string; bgColor: string; borderColor: string }[] = [
  { id: 'health', label: 'Health', icon: '❤', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/30' },
  { id: 'wealth', label: 'Wealth', icon: '$', color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30' },
  { id: 'relationships', label: 'Relationships', icon: '◇', color: 'text-rose-400', bgColor: 'bg-rose-500/10', borderColor: 'border-rose-500/30' },
  { id: 'growth', label: 'Growth', icon: '↗', color: 'text-indigo-400', bgColor: 'bg-indigo-500/10', borderColor: 'border-indigo-500/30' },
  { id: 'fun', label: 'Fun', icon: '◆', color: 'text-violet-400', bgColor: 'bg-violet-500/10', borderColor: 'border-violet-500/30' },
  { id: 'home', label: 'Home', icon: '⌂', color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', borderColor: 'border-cyan-500/30' },
];

const GoalsView: React.FC<Props> = ({ goals, wealth, masterHabits, logs, onUpdate }) => {
  const [timeframe, setTimeframe] = useState<GoalTimeframe>('yearly');
  const [showNew, setShowNew] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [editingHeadline, setEditingHeadline] = useState(false);
  const [headlineDraft, setHeadlineDraft] = useState(goals.headlineGoal);

  const filteredGoals = goals.goals.filter(g => g.timeframe === timeframe);
  const activeGoals = filteredGoals.filter(g => g.status === 'active');
  const completedGoals = filteredGoals.filter(g => g.status === 'completed');

  const stats = useMemo(() => {
    const total = activeGoals.length + completedGoals.length;
    const completed = completedGoals.length;
    const hitRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { active: activeGoals.length, completed, hitRate };
  }, [activeGoals, completedGoals]);

  const updateGoal = (g: Goal) => onUpdate({ ...goals, goals: goals.goals.map(x => x.id === g.id ? g : x) });
  const deleteGoal = (id: string) => onUpdate({ ...goals, goals: goals.goals.filter(g => g.id !== id) });
  const addGoal = (g: Omit<Goal, 'id' | 'createdAt'>) => {
    onUpdate({ ...goals, goals: [...goals.goals, { ...g, id: `g-${Date.now()}`, createdAt: new Date().toISOString() }] });
    setShowNew(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h3 className="text-[10px] font-black uppercase text-zinc-600 mb-2">Life Architecture</h3>
          <h2 className="text-3xl lg:text-5xl font-bold uppercase text-white">Goals</h2>
        </div>
        <div className="flex gap-2">
          {(['yearly', 'quarterly', 'monthly'] as GoalTimeframe[]).map(t => (
            <button key={t} onClick={() => setTimeframe(t)}
              className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${timeframe === t ? 'bg-indigo-500 text-zinc-950' : 'bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}>
              This {t.replace('ly', '')}
            </button>
          ))}
        </div>
      </header>

      <div className="glass p-6 rounded-3xl border border-indigo-500/30 bg-indigo-500/5">
        <div className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-2 flex justify-between items-center">
          <span>★ Headline Goal</span>
          <button onClick={() => { setEditingHeadline(!editingHeadline); setHeadlineDraft(goals.headlineGoal); }} className="text-zinc-500 hover:text-indigo-400">{editingHeadline ? 'Cancel' : 'Edit'}</button>
        </div>
        {editingHeadline ? (
          <div className="space-y-2">
            <textarea value={headlineDraft} onChange={e => setHeadlineDraft(e.target.value)} rows={3} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-base font-bold text-white" />
            <button onClick={() => { onUpdate({ ...goals, headlineGoal: headlineDraft }); setEditingHeadline(false); }} className="bg-indigo-500 text-zinc-950 px-4 py-2 rounded-lg text-[10px] font-black uppercase">Save</button>
          </div>
        ) : (
          <p className="text-lg font-bold text-white leading-relaxed">{goals.headlineGoal}</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Active" value={`${stats.active}`} color="text-indigo-400" />
        <Stat label="Completed" value={`${stats.completed}`} color="text-emerald-400" />
        <Stat label="Hit Rate" value={`${stats.hitRate}%`} color="text-amber-400" />
      </div>

      <div className="flex justify-end"><button onClick={() => setShowNew(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 shadow-lg shadow-indigo-500/20">+ New Goal</button></div>

      <div className="space-y-4">
        {LIFE_AREAS.map(area => {
          const areaGoals = activeGoals.filter(g => g.lifeArea === area.id);
          return (
            <div key={area.id} className={`glass p-5 rounded-3xl border ${area.borderColor}`}>
              <div className="flex justify-between items-center mb-4 border-b border-zinc-900 pb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl ${area.bgColor} ${area.borderColor} border flex items-center justify-center text-lg ${area.color}`}>{area.icon}</div>
                  <div>
                    <h4 className="font-bold text-white uppercase tracking-wider text-sm">{area.label}</h4>
                    <div className="text-[9px] font-black text-zinc-600 uppercase">{areaGoals.length} active</div>
                  </div>
                </div>
              </div>

              {areaGoals.length === 0 ? (
                <div className="text-center py-6 text-[10px] font-black text-zinc-700 uppercase tracking-widest">No goals set</div>
              ) : (
                <div className="space-y-3">
                  {areaGoals.map(g => <GoalCard key={g.id} goal={g} onUpdate={updateGoal} onDelete={deleteGoal} onEdit={() => setEditingGoal(g)} />)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {completedGoals.length > 0 && (
        <details className="glass p-5 rounded-3xl border border-zinc-800">
          <summary className="text-[10px] font-black text-emerald-400 uppercase tracking-widest cursor-pointer">✓ Completed ({completedGoals.length})</summary>
          <div className="mt-4 space-y-2">
            {completedGoals.map(g => (
              <div key={g.id} className="flex justify-between items-center p-3 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
                <div>
                  <div className="text-sm font-bold text-zinc-300 line-through">{g.title}</div>
                  <div className="text-[9px] font-black text-zinc-600 uppercase">{g.lifeArea}</div>
                </div>
                <button onClick={() => updateGoal({ ...g, status: 'active' })} className="text-[10px] font-black text-indigo-400 uppercase">Reactivate</button>
              </div>
            ))}
          </div>
        </details>
      )}

      {(showNew || editingGoal) && (
        <GoalEditor initial={editingGoal} timeframe={timeframe} wealth={wealth} habits={masterHabits} onSave={(g) => editingGoal ? updateGoal({ ...editingGoal, ...g } as Goal) : addGoal(g)} onCancel={() => { setShowNew(false); setEditingGoal(null); }} />
      )}
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div className="glass p-4 rounded-2xl border border-zinc-800">
    <div className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{label}</div>
    <div className={`text-2xl font-black ${color} tabular-nums mt-1`}>{value}</div>
  </div>
);

const GoalCard: React.FC<{ goal: Goal; onUpdate: (g: Goal) => void; onDelete: (id: string) => void; onEdit: () => void }> = ({ goal, onUpdate, onDelete, onEdit }) => {
  const pct = goal.targetValue ? Math.min(100, ((goal.currentValue || 0) / goal.targetValue) * 100) : 0;
  const isAuto = goal.trackingMode !== 'manual';
  const milestonesDone = goal.milestones.filter(m => m.completed).length;

  const toggleMilestone = (mid: string) => onUpdate({ ...goal, milestones: goal.milestones.map(m => m.id === mid ? { ...m, completed: !m.completed } : m) });
  const increment = (delta: number) => onUpdate({ ...goal, currentValue: Math.max(0, (goal.currentValue || 0) + delta) });
  const complete = () => onUpdate({ ...goal, status: 'completed' });

  return (
    <div className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800/50">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h5 className="font-bold text-white text-sm">{goal.title}</h5>
            {isAuto && <span className="text-[8px] font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 px-2 py-0.5 rounded-full uppercase">auto · {goal.trackingMode.replace('auto-', '')}</span>}
          </div>
          {goal.description && <p className="text-xs text-zinc-500 mt-1">{goal.description}</p>}
        </div>
        <div className="flex gap-1">
          <button onClick={onEdit} className="text-zinc-500 text-xs hover:text-white">✎</button>
          <button onClick={() => onDelete(goal.id)} className="text-red-400 text-xs hover:text-red-300">×</button>
        </div>
      </div>

      {goal.targetValue && (
        <>
          <div className="flex justify-between items-end mb-1.5 mt-3">
            <span className="text-[9px] font-black text-zinc-600 uppercase">Progress</span>
            <span className="text-xs font-bold text-white tabular-nums">{goal.unit || ''}{goal.currentValue || 0} / {goal.unit || ''}{goal.targetValue}</span>
          </div>
          <div className="h-2 bg-zinc-900 rounded-full overflow-hidden mb-3"><div className={`h-full transition-all duration-700 ${pct >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${pct}%` }} /></div>
          {!isAuto && (
            <div className="flex gap-2 mb-3">
              <button onClick={() => increment(1)} className="bg-zinc-800 border border-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase active:scale-95">+1</button>
              <button onClick={() => increment(5)} className="bg-zinc-800 border border-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase active:scale-95">+5</button>
              <button onClick={() => increment(-1)} className="bg-zinc-800 border border-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase active:scale-95">-1</button>
              {pct < 100 && <button onClick={complete} className="ml-auto bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase">✓ Complete</button>}
            </div>
          )}
        </>
      )}

      {goal.milestones.length > 0 && (
        <div className="mt-3 pt-3 border-t border-zinc-800/50">
          <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-2">Milestones · {milestonesDone}/{goal.milestones.length}</div>
          <div className="space-y-1">
            {goal.milestones.map(m => (
              <label key={m.id} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={m.completed} onChange={() => toggleMilestone(m.id)} className="w-4 h-4 rounded" />
                <span className={`text-xs ${m.completed ? 'text-emerald-400 font-bold line-through' : 'text-zinc-400'}`}>{m.title}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {goal.dueDate && <div className="text-[9px] font-black text-zinc-700 uppercase mt-3">Due {goal.dueDate}</div>}
    </div>
  );
};

interface EditorProps {
  initial: Goal | null;
  timeframe: GoalTimeframe;
  wealth: WealthData;
  habits: Habit[];
  onSave: (g: Omit<Goal, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

const GoalEditor: React.FC<EditorProps> = ({ initial, timeframe, wealth, habits, onSave, onCancel }) => {
  const [g, setG] = useState<Omit<Goal, 'id' | 'createdAt'>>(initial || {
    lifeArea: 'health', timeframe, period: timeframe === 'yearly' ? `${new Date().getFullYear()}` : timeframe === 'quarterly' ? `${new Date().getFullYear()}-Q${Math.ceil((new Date().getMonth() + 1) / 3)}` : new Date().toISOString().slice(0, 7),
    title: '', description: '', targetValue: undefined, currentValue: 0, unit: '', status: 'active', dueDate: '', milestones: [], linkedHabitIds: [], trackingMode: 'manual',
  });

  const addMilestone = () => setG({ ...g, milestones: [...g.milestones, { id: `m-${Date.now()}`, title: '', completed: false }] });
  const updateMilestone = (id: string, title: string) => setG({ ...g, milestones: g.milestones.map(m => m.id === id ? { ...m, title } : m) });
  const removeMilestone = (id: string) => setG({ ...g, milestones: g.milestones.filter(m => m.id !== id) });

  return (
    <div className="fixed inset-0 z-[200] bg-zinc-950/90 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto" onClick={onCancel}>
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-2xl w-full p-6 my-8" onClick={e => e.stopPropagation()}>
        <h3 className="text-[10px] font-black uppercase text-zinc-600 tracking-widest mb-4">{initial ? 'Edit' : 'New'} Goal</h3>

        <div className="space-y-3">
          <input value={g.title} onChange={e => setG({ ...g, title: e.target.value })} placeholder="Goal title" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-lg font-bold text-white" />
          <textarea value={g.description} onChange={e => setG({ ...g, description: e.target.value })} placeholder="Description (why does this matter?)" rows={2} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white" />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1 block">Life Area</label>
              <select value={g.lifeArea} onChange={e => setG({ ...g, lifeArea: e.target.value as LifeArea })} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white font-bold">
                {LIFE_AREAS.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1 block">Timeframe</label>
              <select value={g.timeframe} onChange={e => setG({ ...g, timeframe: e.target.value as GoalTimeframe })} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white font-bold">
                <option value="yearly">Yearly</option><option value="quarterly">Quarterly</option><option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <input type="number" value={g.targetValue || ''} onChange={e => setG({ ...g, targetValue: Number(e.target.value) })} placeholder="Target" className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white font-bold" />
            <input value={g.unit || ''} onChange={e => setG({ ...g, unit: e.target.value })} placeholder="Unit (£, kg, x)" className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white font-bold" />
            <input type="date" value={g.dueDate} onChange={e => setG({ ...g, dueDate: e.target.value })} className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white" />
          </div>

          <div>
            <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1 block">Tracking Mode</label>
            <select value={g.trackingMode} onChange={e => setG({ ...g, trackingMode: e.target.value as Goal['trackingMode'] })} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white font-bold">
              <option value="manual">Manual (you update progress)</option>
              <option value="auto-habit">Auto from Habits (count completions)</option>
              <option value="auto-wealth">Auto from Savings Goal</option>
              <option value="auto-weight">Auto from Daily Weight</option>
            </select>
          </div>

          {g.trackingMode === 'auto-wealth' && (
            <select value={g.linkedSavingsGoalId || ''} onChange={e => setG({ ...g, linkedSavingsGoalId: e.target.value })} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white">
              <option value="">Pick a savings goal</option>
              {wealth.savingsGoals.map(sg => <option key={sg.id} value={sg.id}>{sg.name} (£{sg.currentAmount}/£{sg.targetAmount})</option>)}
            </select>
          )}

          {g.trackingMode === 'auto-habit' && (
            <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800">
              <div className="text-[9px] font-black text-zinc-600 uppercase mb-2">Linked Habits</div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {habits.map(h => (
                  <label key={h.id} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={g.linkedHabitIds.includes(h.id)} onChange={e => setG({ ...g, linkedHabitIds: e.target.checked ? [...g.linkedHabitIds, h.id] : g.linkedHabitIds.filter(x => x !== h.id) })} className="w-4 h-4 rounded" />
                    <span className="text-xs text-zinc-300">{h.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex justify-between mb-1">
              <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Milestones</label>
              <button onClick={addMilestone} className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">+ Add</button>
            </div>
            <div className="space-y-1">
              {g.milestones.map(m => (
                <div key={m.id} className="flex gap-2">
                  <input value={m.title} onChange={e => updateMilestone(m.id, e.target.value)} placeholder="Milestone..." className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white" />
                  <button onClick={() => removeMilestone(m.id)} className="text-red-400 text-sm">×</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onCancel} className="flex-1 bg-zinc-900 border border-zinc-800 text-zinc-400 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest">Cancel</button>
          <button onClick={() => g.title && onSave(g)} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest">{initial ? 'Save' : 'Create Goal'}</button>
        </div>
      </div>
    </div>
  );
};

export default GoalsView;
