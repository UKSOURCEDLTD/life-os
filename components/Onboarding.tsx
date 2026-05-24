import React, { useState } from 'react';
import { AppState, UserProfile, RecurringTransaction, Goal, MealLibraryItem, Asset, Liability, Ingredient } from '../types';
import { DEFAULT_WEALTH, DEFAULT_GOALS, DEFAULT_PROFILE, getTodayDateStr, createEmptyLog } from '../utils/storage';
import { INITIAL_HABITS, INITIAL_MEALS, INITIAL_MEAL_LIBRARY } from '../constants';

interface Props {
  onComplete: (state: AppState) => void;
  onSkip: () => void;
}

type Step = 'welcome' | 'profile' | 'macros' | 'income' | 'expenses' | 'wealth' | 'goals' | 'meals' | 'done';

const Onboarding: React.FC<Props> = ({ onComplete, onSkip }) => {
  const [step, setStep] = useState<Step>('welcome');

  // Profile
  const [profile, setProfile] = useState<UserProfile>({ ...DEFAULT_PROFILE, trackingStartDate: getTodayDateStr() });

  // Macros
  const [targetCalories, setTargetCalories] = useState(2200);
  const [proteinRatio, setProteinRatio] = useState(35);
  const [carbsRatio, setCarbsRatio] = useState(40);
  const [fatsRatio, setFatsRatio] = useState(25);

  // Income
  const [income, setIncome] = useState<{ description: string; amount: number; dayOfMonth: number }[]>([
    { description: 'Salary', amount: 0, dayOfMonth: 28 },
  ]);

  // Expenses
  const [expenses, setExpenses] = useState<{ description: string; amount: number; dayOfMonth: number; category: string }[]>([
    { description: 'Rent', amount: 0, dayOfMonth: 1, category: 'Housing' },
    { description: 'Phone', amount: 0, dayOfMonth: 15, category: 'Phone' },
    { description: 'Gym', amount: 0, dayOfMonth: 1, category: 'Gym' },
  ]);

  // Wealth
  const [bankBalance, setBankBalance] = useState(0);
  const [tradingBalance, setTradingBalance] = useState(0);
  const [ivaBalance, setIvaBalance] = useState(0);
  const [ivaPayment, setIvaPayment] = useState(0);

  // Goals
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState(0);
  const [goalDeadline, setGoalDeadline] = useState('');

  // Meals — let user override the 3 master meals
  const [breakfast, setBreakfast] = useState({ name: 'Protein Oats + Whey', cals: 624, p: 40, c: 87, f: 14 });
  const [lunch, setLunch] = useState({ name: 'Chicken Rice Bowl', cals: 705, p: 69, c: 55, f: 21 });
  const [dinner, setDinner] = useState({ name: 'Lean Beef & Sweet Potato', cals: 546, p: 50, c: 60, f: 12 });

  const STEPS: Step[] = ['welcome', 'profile', 'macros', 'income', 'expenses', 'wealth', 'goals', 'meals', 'done'];
  const idx = STEPS.indexOf(step);
  const next = () => setStep(STEPS[Math.min(idx + 1, STEPS.length - 1)]);
  const back = () => setStep(STEPS[Math.max(idx - 1, 0)]);

  const finish = () => {
    const filledIncome: RecurringTransaction[] = income.filter(i => i.amount > 0).map((i, ix) => ({
      id: `rec-inc-${ix}-${Date.now()}`,
      type: 'income',
      category: 'Salary',
      description: i.description,
      amount: i.amount,
      frequency: 'monthly',
      dayOfMonth: i.dayOfMonth,
      startDate: getTodayDateStr(),
      active: true,
    }));

    const filledExpenses: RecurringTransaction[] = expenses.filter(e => e.amount > 0).map((e, ix) => ({
      id: `rec-exp-${ix}-${Date.now()}`,
      type: 'expense',
      category: e.category,
      description: e.description,
      amount: e.amount,
      frequency: 'monthly',
      dayOfMonth: e.dayOfMonth,
      startDate: getTodayDateStr(),
      active: true,
    }));

    if (ivaBalance > 0 && ivaPayment > 0) {
      filledExpenses.push({
        id: `rec-iva-${Date.now()}`,
        type: 'expense',
        category: 'Debt',
        description: 'IVA Payment',
        amount: ivaPayment,
        frequency: 'monthly',
        dayOfMonth: 1,
        startDate: getTodayDateStr(),
        active: true,
      });
    }

    const assets: Asset[] = [
      { id: 'a-cash', name: 'Bank Account', type: 'cash', value: bankBalance, lastUpdated: getTodayDateStr() },
    ];
    if (tradingBalance > 0) assets.push({ id: 'a-trading', name: 'Trading Account', type: 'investment', value: tradingBalance, lastUpdated: getTodayDateStr() });

    const liabilities: Liability[] = [];
    if (ivaBalance > 0) liabilities.push({ id: 'l-iva', name: 'IVA', type: 'iva', balance: ivaBalance, monthlyPayment: ivaPayment, lastUpdated: getTodayDateStr() });

    const goals: Goal[] = [];
    if (goalTitle && goalTarget > 0) {
      goals.push({
        id: `g-${Date.now()}`,
        lifeArea: 'wealth',
        timeframe: 'yearly',
        period: `${new Date().getFullYear()}`,
        title: goalTitle,
        description: '',
        targetValue: goalTarget,
        currentValue: 0,
        unit: '£',
        status: 'active',
        dueDate: goalDeadline || undefined,
        createdAt: new Date().toISOString(),
        milestones: [],
        linkedHabitIds: [],
        trackingMode: 'manual',
      });
    }

    const mkIngredient = (name: string, cals: number, p: number, c: number, f: number): Ingredient => ({
      name, macros: { calories: cals, protein: p, carbs: c, fats: f }
    });

    const finalProfile: UserProfile = {
      ...profile,
      defaultTargetCalories: targetCalories,
      defaultProteinRatio: proteinRatio,
      defaultCarbsRatio: carbsRatio,
      defaultFatsRatio: fatsRatio,
    };

    const masterMeals = [
      { id: 'm1', name: breakfast.name, type: 'Breakfast' as const, completed: false, ingredients: [mkIngredient(breakfast.name, breakfast.cals, breakfast.p, breakfast.c, breakfast.f)] },
      { id: 'm2', name: lunch.name, type: 'Lunch' as const, completed: false, ingredients: [mkIngredient(lunch.name, lunch.cals, lunch.p, lunch.c, lunch.f)] },
      { id: 'm3', name: dinner.name, type: 'Dinner' as const, completed: false, ingredients: [mkIngredient(dinner.name, dinner.cals, dinner.p, dinner.c, dinner.f)] },
    ];

    const state: AppState = {
      logs: { [getTodayDateStr()]: createEmptyLog(getTodayDateStr(), INITIAL_HABITS, masterMeals, finalProfile) },
      currentDate: getTodayDateStr(),
      view: 'today',
      masterHabits: INITIAL_HABITS,
      masterMeals,
      mealLibrary: INITIAL_MEAL_LIBRARY,
      userProfile: finalProfile,
      wealth: {
        ...DEFAULT_WEALTH,
        recurringTransactions: [...filledIncome, ...filledExpenses],
        assets,
        liabilities,
        monthlyBudget: { income: filledIncome.reduce((s, r) => s + r.amount, 0), fixedExpenses: filledExpenses.reduce((s, r) => s + r.amount, 0), variableExpenses: 0 },
      },
      goals: { ...DEFAULT_GOALS, goals: goals.length > 0 ? goals : DEFAULT_GOALS.goals },
    };

    onComplete(state);
  };

  return (
    <div className="fixed inset-0 z-[400] bg-zinc-950 flex flex-col overflow-y-auto">
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-2xl">
          <ProgressBar step={idx} total={STEPS.length - 1} />

          {step === 'welcome' && (
            <Card>
              <h2 className="text-4xl font-black uppercase text-white tracking-tight mb-3">Welcome to Life OS</h2>
              <p className="text-zinc-400 mb-6 leading-relaxed">Quick 2-minute setup so the app fits <em>your</em> life from day 1. You can change everything later. Or skip and use defaults.</p>
              <ul className="space-y-2 mb-8">
                {['Daily targets (calories + macros)', 'Recurring income & expenses', 'Current net worth baseline', 'One headline goal', 'Your 3 go-to meals'].map(t => (
                  <li key={t} className="flex items-center gap-3 text-sm text-zinc-300"><span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />{t}</li>
                ))}
              </ul>
              <div className="flex gap-3">
                <button onClick={onSkip} className="bg-zinc-900 border border-zinc-800 text-zinc-400 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest">Skip — use defaults</button>
                <button onClick={next} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20">Let's go →</button>
              </div>
            </Card>
          )}

          {step === 'profile' && (
            <Card>
              <Header title="Your Body" subtitle="Used to calculate TDEE and weight projections" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Current Weight (kg)"><input type="number" step="0.1" value={profile.weight} onChange={e => setProfile({ ...profile, weight: Number(e.target.value) })} className={inputClass} /></Field>
                <Field label="Target Weight (kg)"><input type="number" step="0.1" value={profile.targetWeight} onChange={e => setProfile({ ...profile, targetWeight: Number(e.target.value) })} className={inputClass} /></Field>
                <Field label="Height (cm)"><input type="number" value={profile.height} onChange={e => setProfile({ ...profile, height: Number(e.target.value) })} className={inputClass} /></Field>
                <Field label="Date of Birth"><input type="date" value={profile.dob} onChange={e => setProfile({ ...profile, dob: e.target.value })} className={inputClass} /></Field>
                <Field label="Gender"><select value={profile.gender} onChange={e => setProfile({ ...profile, gender: e.target.value as 'male' | 'female' })} className={inputClass}><option value="male">Male</option><option value="female">Female</option></select></Field>
                <Field label="Sleep Target (hours)"><input type="number" step="0.5" value={profile.sleepTarget} onChange={e => setProfile({ ...profile, sleepTarget: Number(e.target.value) })} className={inputClass} /></Field>
              </div>
              <NavRow onBack={back} onNext={next} />
            </Card>
          )}

          {step === 'macros' && (
            <Card>
              <Header title="Daily Nutrition Targets" subtitle="Pre-fills every day's plan" />
              <Field label="Daily Calories"><input type="number" value={targetCalories} onChange={e => setTargetCalories(Number(e.target.value))} className={inputClass + ' text-2xl'} /></Field>
              <div className="grid grid-cols-3 gap-3 mt-4">
                <Field label="Protein %"><input type="number" value={proteinRatio} onChange={e => setProteinRatio(Number(e.target.value))} className={inputClass} /></Field>
                <Field label="Carbs %"><input type="number" value={carbsRatio} onChange={e => setCarbsRatio(Number(e.target.value))} className={inputClass} /></Field>
                <Field label="Fats %"><input type="number" value={fatsRatio} onChange={e => setFatsRatio(Number(e.target.value))} className={inputClass} /></Field>
              </div>
              <div className="mt-4 p-3 bg-zinc-900/50 rounded-xl border border-zinc-800 grid grid-cols-3 gap-3 text-center">
                <div><div className="text-[8px] font-black text-zinc-600 uppercase">Protein</div><div className="text-lg font-bold text-indigo-400">{Math.round(targetCalories * proteinRatio / 100 / 4)}g</div></div>
                <div><div className="text-[8px] font-black text-zinc-600 uppercase">Carbs</div><div className="text-lg font-bold text-emerald-400">{Math.round(targetCalories * carbsRatio / 100 / 4)}g</div></div>
                <div><div className="text-[8px] font-black text-zinc-600 uppercase">Fats</div><div className="text-lg font-bold text-amber-400">{Math.round(targetCalories * fatsRatio / 100 / 9)}g</div></div>
              </div>
              {proteinRatio + carbsRatio + fatsRatio !== 100 && <div className="mt-2 text-[10px] text-amber-400 font-bold">⚠ Ratios sum to {proteinRatio + carbsRatio + fatsRatio}% (should be 100)</div>}
              <NavRow onBack={back} onNext={next} />
            </Card>
          )}

          {step === 'income' && (
            <Card>
              <Header title="Recurring Income" subtitle="Auto-posts each month — set what you actually receive" />
              <div className="space-y-3">
                {income.map((i, ix) => (
                  <div key={ix} className="grid grid-cols-12 gap-2 items-center">
                    <input value={i.description} onChange={e => setIncome(income.map((x, k) => k === ix ? { ...x, description: e.target.value } : x))} placeholder="Source" className={inputClass + ' col-span-6'} />
                    <input type="number" value={i.amount || ''} onChange={e => setIncome(income.map((x, k) => k === ix ? { ...x, amount: Number(e.target.value) } : x))} placeholder="£/mo" className={inputClass + ' col-span-3'} />
                    <input type="number" min={1} max={31} value={i.dayOfMonth} onChange={e => setIncome(income.map((x, k) => k === ix ? { ...x, dayOfMonth: Number(e.target.value) } : x))} placeholder="Day" className={inputClass + ' col-span-2'} />
                    <button onClick={() => setIncome(income.filter((_, k) => k !== ix))} className="text-red-400 col-span-1">×</button>
                  </div>
                ))}
                <button onClick={() => setIncome([...income, { description: '', amount: 0, dayOfMonth: 28 }])} className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">+ Add income source</button>
              </div>
              <NavRow onBack={back} onNext={next} />
            </Card>
          )}

          {step === 'expenses' && (
            <Card>
              <Header title="Recurring Expenses" subtitle="Rent, subscriptions, debt — anything monthly" />
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {expenses.map((e, ix) => (
                  <div key={ix} className="grid grid-cols-12 gap-2 items-center">
                    <input value={e.description} onChange={ev => setExpenses(expenses.map((x, k) => k === ix ? { ...x, description: ev.target.value } : x))} placeholder="Description" className={inputClass + ' col-span-5'} />
                    <input value={e.category} onChange={ev => setExpenses(expenses.map((x, k) => k === ix ? { ...x, category: ev.target.value } : x))} placeholder="Category" className={inputClass + ' col-span-3'} />
                    <input type="number" value={e.amount || ''} onChange={ev => setExpenses(expenses.map((x, k) => k === ix ? { ...x, amount: Number(ev.target.value) } : x))} placeholder="£" className={inputClass + ' col-span-2'} />
                    <input type="number" min={1} max={31} value={e.dayOfMonth} onChange={ev => setExpenses(expenses.map((x, k) => k === ix ? { ...x, dayOfMonth: Number(ev.target.value) } : x))} placeholder="Day" className={inputClass + ' col-span-1'} />
                    <button onClick={() => setExpenses(expenses.filter((_, k) => k !== ix))} className="text-red-400 col-span-1">×</button>
                  </div>
                ))}
                <button onClick={() => setExpenses([...expenses, { description: '', amount: 0, dayOfMonth: 1, category: 'Other' }])} className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">+ Add expense</button>
              </div>
              <NavRow onBack={back} onNext={next} />
            </Card>
          )}

          {step === 'wealth' && (
            <Card>
              <Header title="Net Worth Baseline" subtitle="Current snapshot — you'll update monthly" />
              <div className="space-y-3">
                <Field label="Bank Account (£)"><input type="number" value={bankBalance || ''} onChange={e => setBankBalance(Number(e.target.value))} className={inputClass} /></Field>
                <Field label="Trading Account (£)"><input type="number" value={tradingBalance || ''} onChange={e => setTradingBalance(Number(e.target.value))} className={inputClass} /></Field>
                <div className="border-t border-zinc-800 my-3" />
                <Field label="IVA Balance Remaining (£)"><input type="number" value={ivaBalance || ''} onChange={e => setIvaBalance(Number(e.target.value))} className={inputClass} /></Field>
                <Field label="IVA Monthly Payment (£)"><input type="number" value={ivaPayment || ''} onChange={e => setIvaPayment(Number(e.target.value))} className={inputClass} /></Field>
              </div>
              <div className="mt-4 p-3 bg-zinc-900/50 rounded-xl border border-zinc-800 flex justify-between">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Net Worth</span>
                <span className={`text-lg font-black ${bankBalance + tradingBalance - ivaBalance >= 0 ? 'text-emerald-400' : 'text-red-400'} tabular-nums`}>£{(bankBalance + tradingBalance - ivaBalance).toLocaleString()}</span>
              </div>
              <NavRow onBack={back} onNext={next} />
            </Card>
          )}

          {step === 'goals' && (
            <Card>
              <Header title="One Headline Goal" subtitle="The big thing you want by end of year. Add more later." />
              <div className="space-y-3">
                <Field label="What's the goal?"><input value={goalTitle} onChange={e => setGoalTitle(e.target.value)} placeholder="e.g. Off porter job, £10k saved, BW 75kg" className={inputClass} /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Target (£ or count)"><input type="number" value={goalTarget || ''} onChange={e => setGoalTarget(Number(e.target.value))} className={inputClass} /></Field>
                  <Field label="By when"><input type="date" value={goalDeadline} onChange={e => setGoalDeadline(e.target.value)} className={inputClass} /></Field>
                </div>
              </div>
              <NavRow onBack={back} onNext={next} />
            </Card>
          )}

          {step === 'meals' && (
            <Card>
              <Header title="Your 3 Go-To Meals" subtitle="Auto-fills every new day. The Library has 12 more starter meals." />
              <div className="space-y-4">
                {[{ label: 'Breakfast', meal: breakfast, set: setBreakfast },
                  { label: 'Lunch', meal: lunch, set: setLunch },
                  { label: 'Dinner', meal: dinner, set: setDinner }].map(({ label, meal, set }) => (
                  <div key={label} className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                    <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2">{label}</div>
                    <input value={meal.name} onChange={e => set({ ...meal, name: e.target.value })} className={inputClass + ' mb-2'} />
                    <div className="grid grid-cols-4 gap-2">
                      <input type="number" value={meal.cals || ''} onChange={e => set({ ...meal, cals: Number(e.target.value) })} placeholder="kcal" className={inputClass} />
                      <input type="number" value={meal.p || ''} onChange={e => set({ ...meal, p: Number(e.target.value) })} placeholder="P" className={inputClass + ' text-indigo-400'} />
                      <input type="number" value={meal.c || ''} onChange={e => set({ ...meal, c: Number(e.target.value) })} placeholder="C" className={inputClass + ' text-emerald-400'} />
                      <input type="number" value={meal.f || ''} onChange={e => set({ ...meal, f: Number(e.target.value) })} placeholder="F" className={inputClass + ' text-amber-400'} />
                    </div>
                  </div>
                ))}
              </div>
              <NavRow onBack={back} onNext={next} nextLabel="Almost done →" />
            </Card>
          )}

          {step === 'done' && (
            <Card>
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-emerald-500 rounded-2xl mx-auto mb-4 flex items-center justify-center text-2xl">✓</div>
                <h2 className="text-3xl font-black uppercase text-white mb-2">You're set</h2>
                <p className="text-zinc-400 mb-8">Life OS is configured. Now it's daily reps.</p>
                <button onClick={finish} className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-6 py-4 rounded-xl text-xs font-black uppercase tracking-widest shadow-2xl shadow-emerald-500/30">Launch Dashboard →</button>
                <button onClick={back} className="mt-3 text-[10px] font-black text-zinc-600 uppercase tracking-widest">← Review</button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

const inputClass = 'w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-base font-bold text-white focus:border-indigo-500 outline-none';

const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="glass p-6 sm:p-8 rounded-3xl border border-zinc-800 animate-in fade-in slide-in-from-bottom-4 duration-300">{children}</div>
);

const Header: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
  <div className="mb-6">
    <h2 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight">{title}</h2>
    <p className="text-zinc-500 text-sm mt-1">{subtitle}</p>
  </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1.5 block">{label}</label>
    {children}
  </div>
);

const NavRow: React.FC<{ onBack: () => void; onNext: () => void; nextLabel?: string }> = ({ onBack, onNext, nextLabel = 'Next →' }) => (
  <div className="flex gap-3 mt-6 pt-6 border-t border-zinc-800">
    <button onClick={onBack} className="bg-zinc-900 border border-zinc-800 text-zinc-400 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest">← Back</button>
    <button onClick={onNext} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest">{nextLabel}</button>
  </div>
);

const ProgressBar: React.FC<{ step: number; total: number }> = ({ step, total }) => (
  <div className="mb-4 flex items-center justify-between">
    <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Step {step + 1} of {total + 1}</div>
    <div className="flex-1 mx-4 h-1 bg-zinc-900 rounded-full overflow-hidden">
      <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${((step + 1) / (total + 1)) * 100}%` }} />
    </div>
    <div className="text-[9px] font-black text-indigo-400 tabular-nums">{Math.round(((step + 1) / (total + 1)) * 100)}%</div>
  </div>
);

export default Onboarding;
