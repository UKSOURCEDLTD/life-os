
import React, { useState, useEffect, useMemo } from 'react';
import { DayLog, AppState, ViewType, Habit, Meal, HabitCategory, User, UserProfile, WealthData, GoalsData, MealLibraryItem } from './types';
import {
  getTodayDateStr,
  createEmptyLog,
  loadState,
  saveState,
  formatDate,
  roundTo2,
  calculateAge,
  DEFAULT_WEALTH,
  DEFAULT_GOALS,
  DEFAULT_PROFILE,
  getMonthRange,
} from './utils/storage';
import { syncGoalsFromWealth, syncGoalsFromHabits } from './utils/aggregations';
import HabitList from './components/HabitList';
import MealTracker from './components/MealTracker';
import ExerciseTracker from './components/ExerciseTracker';
import Heatmap from './components/Heatmap';
import AIAssistant from './components/AIAssistant';
import NutritionalTargetEditor from './components/NutritionalTargetEditor';
import MealDetailModal from './components/MealDetailModal';
import JournalManager from './components/JournalManager';
import Login from './components/Login';
import AccountView from './components/AccountView';
import WealthView from './components/WealthView';
import GoalsView from './components/GoalsView';
import WeeklyView from './components/WeeklyView';
import MonthlyView from './components/MonthlyView';
import MealLibraryView from './components/MealLibraryView';
import BiometricStrip from './components/BiometricStrip';
import DailyIntent from './components/DailyIntent';
import EveningReview from './components/EveningReview';
import QuickActions from './components/QuickActions';
import AIInsights from './components/AIInsights';
import InstallPrompt from './components/InstallPrompt';
import Onboarding from './components/Onboarding';
import DataManagement from './components/DataManagement';
import { supabaseEnabled, loadStateFromCloud, saveStateToCloud } from './utils/supabase';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { INITIAL_HABITS, INITIAL_MEALS, INITIAL_MEAL_LIBRARY } from './constants';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [state, setState] = useState<AppState | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [protocolsSaveStatus, setProtocolsSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [profileSaveStatus, setProfileSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [selectedMasterMeal, setSelectedMasterMeal] = useState<Meal | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('life_dashboard_active_session');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  useEffect(() => {
    if (!user) { setState(null); return; }

    const init = async () => {
      let saved = loadState(user.id);
      if (supabaseEnabled && !user.isGuest) {
        const cloud = await loadStateFromCloud(user.id);
        if (cloud) saved = cloud;
      }
      if (saved) {
        setState({ ...saved, currentDate: getTodayDateStr() });
        return;
      }
      // First-time user — show onboarding
      setNeedsOnboarding(true);
    };
    init();
    localStorage.setItem('life_dashboard_active_session', JSON.stringify(user));
  }, [user]);

  // Cloud sync (debounced)
  useEffect(() => {
    if (!user || !state || !supabaseEnabled || user.isGuest) return;
    const t = setTimeout(() => { saveStateToCloud(user.id, state).catch(() => {}); }, 1500);
    return () => clearTimeout(t);
  }, [state, user]);

  useEffect(() => {
    if (user && state) saveState(user.id, state);
  }, [state, user]);

  // Auto-sync goals from wealth/habits when relevant data changes
  useEffect(() => {
    if (!state) return;
    const month = getMonthRange(state.currentDate);
    const synced1 = syncGoalsFromWealth(state.goals.goals, state.wealth);
    const synced2 = syncGoalsFromHabits(synced1, state.logs, month.days);
    if (JSON.stringify(synced2) !== JSON.stringify(state.goals.goals)) {
      setState(prev => prev ? ({ ...prev, goals: { ...prev.goals, goals: synced2 } }) : null);
    }
  }, [state?.wealth, state?.logs]);

  const currentLog = useMemo(() => {
    if (!state) return null;
    if (!state.logs[state.currentDate]) {
      const logDates = Object.keys(state.logs).sort();
      const prevDate = logDates.filter(d => d < state.currentDate).pop();
      const previousLog = prevDate ? state.logs[prevDate] : undefined;
      return createEmptyLog(state.currentDate, state.masterHabits, state.masterMeals, state.userProfile, previousLog);
    }
    return state.logs[state.currentDate];
  }, [state]);

  const previousLog = useMemo(() => {
    if (!state) return null;
    const logDates = Object.keys(state.logs).sort();
    const prevDate = logDates.filter(d => d < state.currentDate).pop();
    return prevDate ? state.logs[prevDate] : null;
  }, [state]);

  const updateLog = (newLog: DayLog, dateOverride?: string) => {
    if (!state) return;
    const targetDate = dateOverride || state.currentDate;
    setState(prev => prev ? ({ ...prev, logs: { ...prev.logs, [targetDate]: newLog } }) : null);
  };

  const handleProfileSave = (updatedProfile: UserProfile) => {
    if (!state) return;
    setProfileSaveStatus('saving');
    const today = getTodayDateStr();
    const age = calculateAge(updatedProfile.dob);
    let bmr = (10 * updatedProfile.weight) + (6.25 * updatedProfile.height) - (5 * age);
    bmr += updatedProfile.gender === 'male' ? 5 : -161;
    const newTdee = roundTo2(bmr * 1.1);
    setState(prev => {
      if (!prev) return null;
      const newLogs = { ...prev.logs };
      if (newLogs[today]) newLogs[today] = { ...newLogs[today], weight: updatedProfile.weight };
      return { ...prev, userProfile: { ...updatedProfile, tdee: newTdee, activityLevel: 1.1 }, logs: newLogs };
    });
    setTimeout(() => { setProfileSaveStatus('saved'); setTimeout(() => setProfileSaveStatus('idle'), 2000); }, 600);
  };

  const handleLogout = () => { localStorage.removeItem('life_dashboard_active_session'); setUser(null); };

  const handleManualSave = () => {
    if (!user || !state) return;
    setSaveStatus('saving');
    saveState(user.id, state);
    setTimeout(() => { setSaveStatus('saved'); setTimeout(() => setSaveStatus('idle'), 2000); }, 600);
  };

  const handleDeployProtocols = () => {
    if (!state) return;
    setProtocolsSaveStatus('saving');
    const todayBoundary = getTodayDateStr();
    setState(prev => {
      if (!prev) return null;
      const updatedLogs = { ...prev.logs };
      const targetCals = prev.userProfile.defaultTargetCalories;
      const targetP = roundTo2((targetCals * (prev.userProfile.defaultProteinRatio / 100)) / 4);
      const targetC = roundTo2((targetCals * (prev.userProfile.defaultCarbsRatio / 100)) / 4);
      const targetF = roundTo2((targetCals * (prev.userProfile.defaultFatsRatio / 100)) / 9);
      if (!updatedLogs[todayBoundary]) {
        const logDates = Object.keys(updatedLogs).sort();
        const prevDate = logDates.filter(d => d < todayBoundary).pop();
        const previousLog = prevDate ? updatedLogs[prevDate] : undefined;
        updatedLogs[todayBoundary] = createEmptyLog(todayBoundary, prev.masterHabits, prev.masterMeals, prev.userProfile, previousLog);
      }
      Object.keys(updatedLogs).forEach(date => {
        if (date >= todayBoundary) {
          const log = { ...updatedLogs[date] };
          log.targetCalories = targetCals; log.targetProtein = targetP; log.targetCarbs = targetC; log.targetFats = targetF;
          const existingHabitNames = new Set(log.habits.map(h => h.name));
          prev.masterHabits.forEach(mh => { if (!existingHabitNames.has(mh.name)) log.habits.push({ ...mh, id: Date.now().toString() + Math.random(), completed: false }); });
          const masterHabitNames = new Set(prev.masterHabits.map(mh => mh.name));
          log.habits = log.habits.filter(h => masterHabitNames.has(h.name) || h.completed);
          const existingMealNames = new Set(log.meals.map(m => m.name));
          prev.masterMeals.forEach(mm => { if (!existingMealNames.has(mm.name)) log.meals.push({ ...mm, id: Date.now().toString() + Math.random(), completed: false }); });
          const masterMealNames = new Set(prev.masterMeals.map(mm => mm.name));
          log.meals = log.meals.filter(m => masterMealNames.has(m.name) || m.completed);
          updatedLogs[date] = log;
        }
      });
      return { ...prev, logs: updatedLogs };
    });
    setTimeout(() => { setProtocolsSaveStatus('saved'); setTimeout(() => setProtocolsSaveStatus('idle'), 2000); }, 800);
  };

  const calculateDailyBurn = (log: DayLog) => {
    if (!state) return 0;
    const age = calculateAge(state.userProfile.dob);
    const weight = log.weight || state.userProfile.weight;
    let bmr = (10 * weight) + (6.25 * state.userProfile.height) - (5 * age);
    bmr += state.userProfile.gender === 'male' ? 5 : -161;
    const tefBaseline = bmr * 1.1;
    const exerciseBurn = log.exercises.reduce((a, c) => a + c.caloriesBurned, 0);
    const stepBurn = log.steps * 0.04;
    return roundTo2(tefBaseline + exerciseBurn + stepBurn);
  };

  const filteredLogs = useMemo(() => {
    if (!state) return [];
    return (Object.values(state.logs) as DayLog[]).filter(l => l.date >= state.userProfile.trackingStartDate).sort((a, b) => a.date.localeCompare(b.date));
  }, [state]);

  const weightDynamicsData = useMemo(() => {
    if (!state || filteredLogs.length === 0) return [];
    let currentProjectedWeight = filteredLogs[0].weight || state.userProfile.weight;
    return filteredLogs.map(log => {
      const intake = log.meals.reduce((acc, m) => acc + m.ingredients.reduce((iAcc, ing) => iAcc + (ing.macros?.calories || 0), 0), 0);
      const totalBurn = calculateDailyBurn(log);
      const netCalories = intake - totalBurn;
      const weightDelta = netCalories / 7700;
      currentProjectedWeight += weightDelta;
      return { date: log.date.split('-').slice(1).join('/'), actual: log.weight || null, projected: roundTo2(currentProjectedWeight) };
    });
  }, [state, filteredLogs]);

  const extendedMetrics = useMemo(() => {
    if (filteredLogs.length === 0) return { consistency: 0, netBalance: 0, intake: 0, burn: 0, steps: 0, mood: 0 };
    const totals = filteredLogs.reduce((acc, log) => {
      const dailyIntake = log.meals.reduce((m, mi) => m + mi.ingredients.reduce((i, ing) => i + (ing.macros?.calories || 0), 0), 0);
      const dailyBurn = calculateDailyBurn(log);
      const habitCompletion = log.habits.length > 0 ? log.habits.filter(h => h.completed).length / log.habits.length : 0;
      acc.consistency += habitCompletion; acc.intake += dailyIntake; acc.burn += dailyBurn; acc.steps += log.steps;
      acc.mood += log.mood > 0 ? log.mood : 0; acc.moodCount += log.mood > 0 ? 1 : 0; return acc;
    }, { consistency: 0, intake: 0, burn: 0, steps: 0, mood: 0, moodCount: 0 });
    const len = filteredLogs.length;
    return {
      consistency: roundTo2((totals.consistency / len) * 100),
      netBalance: roundTo2((totals.intake - totals.burn) / len),
      intake: roundTo2(totals.intake / len), burn: roundTo2(totals.burn / len),
      steps: Math.round(totals.steps / len), mood: roundTo2(totals.mood / (totals.moodCount || 1)),
    };
  }, [filteredLogs, state]);

  const NavItems = [
    { id: 'today', icon: 'M13 10V3L4 14h7v7l9-11h-7z', label: 'Today' },
    { id: 'weekly', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', label: 'Weekly' },
    { id: 'monthly', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', label: 'Monthly' },
    { id: 'wealth', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Wealth' },
    { id: 'goals', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', label: 'Goals' },
    { id: 'meals', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z', label: 'Meals' },
    { id: 'journal', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', label: 'Journal' },
    { id: 'analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', label: 'Data' },
    { id: 'protocols', icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4', label: 'Master' },
    { id: 'account', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', label: 'Account' },
  ];

  if (!user) return <Login onLogin={setUser} />;
  if (needsOnboarding) return <Onboarding onComplete={(s) => { setState(s); setNeedsOnboarding(false); }} onSkip={() => {
    const initialProfile = { ...DEFAULT_PROFILE, trackingStartDate: getTodayDateStr() };
    setState({
      logs: { [getTodayDateStr()]: createEmptyLog(getTodayDateStr(), INITIAL_HABITS, INITIAL_MEALS, initialProfile) },
      currentDate: getTodayDateStr(), view: 'today',
      masterHabits: INITIAL_HABITS, masterMeals: INITIAL_MEALS, mealLibrary: INITIAL_MEAL_LIBRARY,
      userProfile: initialProfile, wealth: DEFAULT_WEALTH, goals: DEFAULT_GOALS,
    });
    setNeedsOnboarding(false);
  }} />;
  if (!state || !currentLog) return <div className="h-screen bg-zinc-950 flex items-center justify-center"><div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  const actualNutrition = currentLog.meals.reduce((acc, m) => {
    m.ingredients.forEach(ing => {
      if (ing.macros) { acc.calories += ing.macros.calories; acc.protein += ing.macros.protein; acc.carbs += ing.macros.carbs; acc.fats += ing.macros.fats; }
    });
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fats: 0 });

  const currentTotalExpenditure = calculateDailyBurn(currentLog);
  const memberSinceFormatted = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'New User';

  return (
    <div className="flex h-screen bg-zinc-950 font-sans overflow-hidden text-zinc-100 flex-col lg:flex-row">
      <aside className="hidden lg:flex w-72 border-r border-zinc-900 flex-col p-6 bg-zinc-950/50 backdrop-blur-xl shrink-0">
        <div className="mb-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <svg className="w-6 h-6 text-zinc-950" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" /></svg>
          </div>
          <h1 className="text-lg font-bold uppercase tracking-widest text-white">Life OS</h1>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {NavItems.map(nav => (
            <button key={nav.id} onClick={() => setState(prev => prev ? ({ ...prev, view: nav.id as ViewType }) : null)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${state.view === nav.id ? 'bg-zinc-900 text-zinc-100 border border-zinc-800 shadow-xl' : 'text-zinc-500 hover:text-zinc-300'}`}>
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={nav.icon} /></svg>
              <span className="text-xs font-bold uppercase tracking-widest">{nav.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto px-4 md:px-8 lg:px-10 pt-6 sm:pt-8 pb-32 lg:pb-12 bg-zinc-950 relative">
        {state.view === 'today' && (
          <div className="animate-in fade-in duration-500 space-y-6">
            <header className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
              <div className="flex items-center gap-4 sm:gap-6 justify-between sm:justify-start">
                <button onClick={() => { const d = new Date(state.currentDate); d.setDate(d.getDate() - 1); setState(prev => prev ? ({ ...prev, currentDate: d.toISOString().split('T')[0] }) : null); }}
                  className="text-zinc-700 hover:text-indigo-400 active:scale-75 transition-transform"><svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg></button>
                <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold text-zinc-100 uppercase tracking-tight tabular-nums">{formatDate(state.currentDate)}</h1>
                <button onClick={() => { const d = new Date(state.currentDate); d.setDate(d.getDate() + 1); setState(prev => prev ? ({ ...prev, currentDate: d.toISOString().split('T')[0] }) : null); }}
                  className="text-zinc-700 hover:text-indigo-400 active:scale-75 transition-transform"><svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg></button>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setState(prev => prev ? ({ ...prev, currentDate: getTodayDateStr() }) : null)}
                  className="text-[9px] font-black uppercase bg-zinc-900 border border-zinc-800 px-4 py-2.5 rounded-full text-zinc-500">Today</button>
                <button onClick={handleManualSave} className={`px-4 py-2.5 rounded-full border transition-all duration-500 font-black text-[9px] uppercase tracking-widest ${saveStatus === 'saved' ? 'bg-emerald-500 text-zinc-950' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                  {saveStatus === 'saved' ? 'Synced' : 'Sync'}
                </button>
              </div>
            </header>

            <BiometricStrip log={currentLog} profile={state.userProfile} onChange={updateLog} />

            <QuickActions log={currentLog} previousLog={previousLog} mealLibrary={state.mealLibrary} onUpdateLog={updateLog} />

            <AIInsights logs={state.logs} currentDate={state.currentDate} profile={state.userProfile} wealth={state.wealth} goals={state.goals} burnFn={calculateDailyBurn} />

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <DailyIntent intent={currentLog.intent} onChange={(intent) => updateLog({ ...currentLog, intent })} />
              <EveningReview review={currentLog.review} onChange={(review) => updateLog({ ...currentLog, review })} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <section className="lg:col-span-4">
                <div className="glass p-6 rounded-[2rem] h-full border border-zinc-800/50">
                  <HabitList habits={currentLog.habits} onToggle={(id) => updateLog({ ...currentLog, habits: currentLog.habits.map(h => h.id === id ? { ...h, completed: !h.completed } : h) })} onAdd={(name) => updateLog({ ...currentLog, habits: [...currentLog.habits, { id: Date.now().toString(), name, category: HabitCategory.PRODUCTIVITY, completed: false }] })} onDelete={(id) => updateLog({ ...currentLog, habits: currentLog.habits.filter(h => h.id !== id) })} />
                </div>
              </section>

              <section className="lg:col-span-4 flex flex-col gap-6">
                <div className="glass p-6 rounded-[2rem] flex-1 border border-zinc-800/50">
                  <NutritionalTargetEditor calories={currentLog.targetCalories} protein={currentLog.targetProtein} carbs={currentLog.targetCarbs} fats={currentLog.targetFats} onSave={(c, p, cb, f) => updateLog({ ...currentLog, targetCalories: c, targetProtein: p, targetCarbs: cb, targetFats: f })} />
                  <div className="mt-6 space-y-3">
                    {[{ l: 'Protein', v: actualNutrition.protein, t: currentLog.targetProtein, c: 'bg-indigo-500' },
                      { l: 'Carbs', v: actualNutrition.carbs, t: currentLog.targetCarbs, c: 'bg-emerald-500' },
                      { l: 'Fats', v: actualNutrition.fats, t: currentLog.targetFats, c: 'bg-amber-500' }].map(macro => (
                      <div key={macro.l}>
                        <div className="flex justify-between items-end mb-1"><span className="text-[9px] font-bold text-zinc-600 uppercase">{macro.l}</span><span className="text-[9px] font-mono text-zinc-500 tabular-nums">{roundTo2(macro.v)} / {macro.t}g</span></div>
                        <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden"><div style={{ width: `${Math.min((macro.v / (macro.t || 1)) * 100, 100)}%` }} className={`h-full ${macro.c} transition-all duration-700`} /></div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8"><MealTracker meals={currentLog.meals} onToggle={(id) => updateLog({ ...currentLog, meals: currentLog.meals.map(m => m.id === id ? { ...m, completed: !m.completed } : m) })} onAdd={(name, type, supp) => updateLog({ ...currentLog, meals: [...currentLog.meals, { id: Date.now().toString(), name, type, completed: false, ingredients: [], isSupplemental: supp }] })} onUpdate={(m) => updateLog({ ...currentLog, meals: currentLog.meals.map(xm => xm.id === m.id ? m : xm) })} onDelete={(id) => updateLog({ ...currentLog, meals: currentLog.meals.filter(m => m.id !== id) })} /></div>
                </div>
              </section>

              <section className="lg:col-span-4">
                <div className="glass p-6 rounded-[2rem] h-full border border-zinc-800/50">
                  <div className="mb-4 flex items-baseline justify-between">
                    <span className="text-[9px] font-black uppercase text-indigo-400 tracking-widest">TDEE</span>
                    <div className="text-3xl font-black text-white tabular-nums">{currentTotalExpenditure} <span className="text-xs text-zinc-600">KCAL</span></div>
                  </div>
                  <ExerciseTracker exercises={currentLog.exercises} onAdd={(ex) => updateLog({ ...currentLog, exercises: [...currentLog.exercises, { ...ex, id: Date.now().toString() }] })} onDelete={(id) => updateLog({ ...currentLog, exercises: currentLog.exercises.filter(ex => ex.id !== id) })} />
                </div>
              </section>
            </div>
          </div>
        )}

        {state.view === 'weekly' && (
          <WeeklyView
            logs={state.logs}
            currentDate={state.currentDate}
            profile={state.userProfile}
            wealth={state.wealth}
            goals={state.goals}
            burnFn={calculateDailyBurn}
            onNavigateDate={(date) => setState(prev => prev ? ({ ...prev, currentDate: date, view: 'today' }) : null)}
            onChangeWeek={(date) => setState(prev => prev ? ({ ...prev, currentDate: date }) : null)}
          />
        )}

        {state.view === 'monthly' && (
          <MonthlyView
            logs={state.logs}
            currentDate={state.currentDate}
            profile={state.userProfile}
            wealth={state.wealth}
            goals={state.goals}
            burnFn={calculateDailyBurn}
            onNavigateDate={(date) => setState(prev => prev ? ({ ...prev, currentDate: date, view: 'today' }) : null)}
            onChangeMonth={(date) => setState(prev => prev ? ({ ...prev, currentDate: date }) : null)}
          />
        )}

        {state.view === 'meals' && (
          <MealLibraryView
            library={state.mealLibrary}
            onUpdateLibrary={(library) => setState(prev => prev ? ({ ...prev, mealLibrary: library }) : null)}
            onAddToToday={(meal) => updateLog({ ...currentLog, meals: [...currentLog.meals, { ...meal, id: Date.now().toString() }] })}
          />
        )}

        {state.view === 'journal' && (
          <JournalManager
            logs={state.logs}
            currentDate={state.currentDate}
            onDateSelect={(date) => setState(prev => prev ? ({ ...prev, currentDate: date }) : null)}
            onJournalChange={(date, text) => {
              const base = state.logs[date] || (date === state.currentDate ? currentLog : createEmptyLog(date, state.masterHabits, state.masterMeals, state.userProfile));
              if (base) updateLog({ ...base, journal: text }, date);
            }}
            onMoodChange={(date, mood) => {
              const base = state.logs[date] || (date === state.currentDate ? currentLog : createEmptyLog(date, state.masterHabits, state.masterMeals, state.userProfile));
              if (base) updateLog({ ...base, mood }, date);
            }}
          />
        )}

        {state.view === 'analytics' && (
          <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h3 className="text-[10px] font-black uppercase text-zinc-600 mb-2">Metrics Engine</h3>
                <h2 className="text-3xl lg:text-5xl font-bold uppercase text-white">Advanced Data</h2>
              </div>
              <div className="text-[9px] font-black uppercase text-zinc-500 tracking-widest bg-zinc-900 px-4 py-2 rounded-lg border border-zinc-800">Range: {state.userProfile.trackingStartDate} — Today</div>
            </header>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
              {[{ l: 'Execution', v: `${extendedMetrics.consistency}%`, c: 'text-indigo-400' },
                { l: 'Net Balance', v: `${extendedMetrics.netBalance > 0 ? '+' : ''}${extendedMetrics.netBalance}`, c: extendedMetrics.netBalance > 0 ? 'text-amber-500' : 'text-emerald-400' },
                { l: 'Avg Intake', v: extendedMetrics.intake, c: 'text-zinc-100' },
                { l: 'Avg Burn', v: extendedMetrics.burn, c: 'text-zinc-100' },
                { l: 'Avg Steps', v: extendedMetrics.steps.toLocaleString(), c: 'text-indigo-400' },
                { l: 'Avg Mood', v: extendedMetrics.mood, c: 'text-emerald-400' }].map((s, i) => (
                <div key={i} className="glass p-5 rounded-2xl border border-zinc-800">
                  <span className="text-[8px] font-black uppercase text-zinc-600 mb-1 tracking-widest">{s.l}</span>
                  <div className={`text-xl font-black ${s.c} tabular-nums`}>{s.v}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
              <div className="xl:col-span-8 glass p-6 lg:p-10 rounded-[2.5rem] border border-zinc-800">
                <header className="flex justify-between items-center mb-8 border-b border-zinc-800 pb-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Weight Trajectory</h4>
                </header>
                <div className="h-[300px] sm:h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weightDynamicsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                      <XAxis dataKey="date" stroke="#3f3f46" fontSize={9} tickLine={false} axisLine={false} />
                      <YAxis domain={['auto', 'auto']} stroke="#3f3f46" fontSize={9} tickLine={false} axisLine={false} orientation="right" />
                      <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px', fontSize: '10px', color: '#fff' }} />
                      <Line type="monotone" dataKey="projected" stroke="#6366f1" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                      <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={3} dot={{ r: 3, fill: '#10b981' }} activeDot={{ r: 6 }} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="xl:col-span-4">
                <Heatmap logs={state.logs} currentDate={state.currentDate} trackingStartDate={state.userProfile.trackingStartDate} onDateClick={(date) => setState(prev => prev ? ({ ...prev, currentDate: date, view: 'today' }) : null)} />
              </div>
            </div>
          </div>
        )}

        {state.view === 'protocols' && (
          <div className="space-y-12 animate-in fade-in duration-500">
            {selectedMasterMeal && <MealDetailModal meal={selectedMasterMeal} onClose={() => setSelectedMasterMeal(null)} onUpdate={(m) => setState(prev => prev ? ({ ...prev, masterMeals: prev.masterMeals.map(xm => xm.id === m.id ? m : xm) }) : null)} />}
            <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div><h3 className="text-[10px] font-black uppercase text-zinc-600 mb-2">Blueprint</h3><h2 className="text-3xl lg:text-5xl font-bold uppercase text-white">Master Protocols</h2></div>
              <button onClick={handleDeployProtocols} className={`px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 ${protocolsSaveStatus === 'saved' ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-100 text-zinc-950 hover:bg-white active:scale-95'}`}>{protocolsSaveStatus === 'saving' ? 'Processing...' : protocolsSaveStatus === 'saved' ? 'Synced' : 'Push to Timeline'}</button>
            </header>
            <div className="glass p-8 rounded-[2.5rem] border border-zinc-800">
              <NutritionalTargetEditor title="Master Nutritional Baseline" calories={state.userProfile.defaultTargetCalories} protein={roundTo2((state.userProfile.defaultTargetCalories * (state.userProfile.defaultProteinRatio / 100)) / 4)} carbs={roundTo2((state.userProfile.defaultTargetCalories * (state.userProfile.defaultCarbsRatio / 100)) / 4)} fats={roundTo2((state.userProfile.defaultTargetCalories * (state.userProfile.defaultFatsRatio / 100)) / 9)}
                onSave={(c, p, cb, f) => { const pR = (p * 4 / c) * 100; const cR = (cb * 4 / c) * 100; const fR = (f * 9 / c) * 100; setState(prev => prev ? ({ ...prev, userProfile: { ...prev.userProfile, defaultTargetCalories: c, defaultProteinRatio: pR, defaultCarbsRatio: cR, defaultFatsRatio: fR } }) : null); }} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="glass p-6 rounded-[2rem] border border-zinc-800">
                <h3 className="text-[10px] font-black uppercase text-zinc-600 mb-4 border-b border-zinc-800 pb-2">Habit Baseline</h3>
                <div className="space-y-2 mb-4 max-h-60 overflow-y-auto pr-2">
                  {state.masterHabits.map(h => (<div key={h.id} className="flex justify-between p-3 bg-zinc-900 rounded-xl border border-zinc-800"><span className="text-sm">{h.name}</span><button onClick={() => setState(prev => prev ? ({ ...prev, masterHabits: prev.masterHabits.filter(xh => xh.id !== h.id) }) : null)} className="text-red-400 text-[10px] font-black uppercase tracking-widest">Remove</button></div>))}
                </div>
                <input type="text" placeholder="Add to master baseline..." className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 font-bold text-sm focus:ring-1 focus:ring-indigo-500 outline-none" onKeyDown={(e) => { if (e.key === 'Enter') { const val = (e.target as HTMLInputElement).value; if (val) { setState(p => p ? ({ ...p, masterHabits: [...p.masterHabits, { id: Date.now().toString(), name: val, category: HabitCategory.PRODUCTIVITY, completed: false }] }) : null); (e.target as HTMLInputElement).value = ''; } } }} />
              </div>
              <div className="glass p-6 rounded-[2rem] border border-zinc-800">
                <h3 className="text-[10px] font-black uppercase text-zinc-600 mb-4 border-b border-zinc-800 pb-2">Meal Blueprint</h3>
                <div className="space-y-2 mb-4 max-h-80 overflow-y-auto pr-2">
                  {state.masterMeals.map(m => (<div key={m.id} onClick={() => setSelectedMasterMeal(m)} className="flex justify-between p-3 bg-zinc-900 rounded-xl cursor-pointer border border-zinc-800 hover:border-zinc-700"><div><span className="block font-bold text-sm">{m.name}</span><span className="text-[8px] uppercase text-zinc-600">Edit ingredients</span></div><button onClick={(e) => { e.stopPropagation(); setState(p => p ? ({ ...p, masterMeals: p.masterMeals.filter(xm => xm.id !== m.id) }) : null); }} className="text-red-400 text-[10px] font-black uppercase">×</button></div>))}
                </div>
                <div className="flex gap-2">
                  <input id="new-mm-name" className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 font-bold text-sm" placeholder="Meal name" />
                  <button onClick={() => { const n = document.getElementById('new-mm-name') as HTMLInputElement; if (n.value) { setState(p => p ? ({ ...p, masterMeals: [...p.masterMeals, { id: Date.now().toString(), name: n.value, type: 'Snack' as const, ingredients: [], completed: false }] }) : null); n.value = ''; } }} className="bg-zinc-800 text-zinc-400 px-5 rounded-xl font-black text-[10px] uppercase tracking-widest">Add</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {state.view === 'wealth' && (
          <WealthView wealth={state.wealth} onUpdate={(wealth) => setState(prev => prev ? ({ ...prev, wealth }) : null)} />
        )}

        {state.view === 'goals' && (
          <GoalsView goals={state.goals} wealth={state.wealth} masterHabits={state.masterHabits} logs={state.logs} onUpdate={(goals) => setState(prev => prev ? ({ ...prev, goals }) : null)} />
        )}

        {state.view === 'account' && (
          <div className="space-y-8">
            <AccountView user={user} profile={state.userProfile} stats={{ totalLogs: filteredLogs.length, memberSince: memberSinceFormatted }} onSaveProfile={handleProfileSave} onLogout={handleLogout} saveStatus={profileSaveStatus} />
            <DataManagement
              state={state}
              onImport={(s) => setState({ ...s, currentDate: getTodayDateStr() })}
              onReset={() => { if (user) { localStorage.removeItem(`life_dashboard_v2_${user.id}`); localStorage.removeItem(`life_dashboard_v1_${user.id}`); setState(null); setNeedsOnboarding(true); } }}
              onRestartOnboarding={() => setNeedsOnboarding(true)}
            />
          </div>
        )}
      </main>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-zinc-950/80 backdrop-blur-2xl border-t border-zinc-900 flex justify-around items-center h-20 z-[110] pb-safe overflow-x-auto">
        {NavItems.slice(0, 5).map(nav => (
          <button key={nav.id} onClick={() => setState(prev => prev ? ({ ...prev, view: nav.id as ViewType }) : null)}
            className={`flex flex-col items-center gap-1 transition-all px-3 py-2 rounded-2xl active:scale-90 ${state.view === nav.id ? 'text-indigo-400 bg-indigo-500/10' : 'text-zinc-600'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={nav.icon} /></svg>
            <span className="text-[9px] font-black uppercase tracking-widest">{nav.label}</span>
          </button>
        ))}
      </nav>

      <AIAssistant currentLog={currentLog} />
      <InstallPrompt />
    </div>
  );
};

export default App;
