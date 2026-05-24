
import { DayLog, Habit, Meal, UserProfile, WealthData, GoalsData, AppState, MealLibraryItem, DailyIntent, EveningReview } from '../types';
import { INITIAL_MEAL_LIBRARY } from '../constants';

export const getTodayDateStr = () => new Date().toISOString().split('T')[0];

export const roundTo2 = (num: number): number => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

export const calculateAge = (dob: string): number => {
  if (!dob) return 30;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const EMPTY_INTENT: DailyIntent = { mit1: '', mit2: '', mit3: '', focus: '' };
const EMPTY_REVIEW: EveningReview = { rating: 0, win: '', lesson: '', gratitude: '' };

export const createEmptyLog = (date: string, masterHabits: Habit[], masterMeals: Meal[], profile: UserProfile, previousLog?: DayLog): DayLog => {
  const targetCalories = previousLog ? previousLog.targetCalories : profile.defaultTargetCalories;
  const targetProtein = previousLog ? previousLog.targetProtein : roundTo2((targetCalories * (profile.defaultProteinRatio / 100)) / 4);
  const targetCarbs = previousLog ? previousLog.targetCarbs : roundTo2((targetCalories * (profile.defaultCarbsRatio / 100)) / 4);
  const targetFats = previousLog ? previousLog.targetFats : roundTo2((targetCalories * (profile.defaultFatsRatio / 100)) / 9);

  return {
    date,
    habits: masterHabits.map(h => ({ ...h, completed: false })),
    meals: masterMeals.map(m => ({ ...m, id: `${m.id}-${date}`, completed: false })),
    exercises: [],
    journal: '',
    mood: 0,
    energy: 0,
    targetCalories,
    targetProtein,
    targetCarbs,
    targetFats,
    weight: previousLog ? previousLog.weight : profile.weight,
    steps: 0,
    sleepHours: 0,
    sleepQuality: 0,
    waterLiters: 0,
    intent: { ...EMPTY_INTENT },
    review: { ...EMPTY_REVIEW },
  };
};

export const DEFAULT_WEALTH: WealthData = {
  financeEntries: [],
  recurringTransactions: [
    {
      id: 'rec-salary',
      type: 'income',
      category: 'Salary',
      description: 'Porter Salary',
      amount: 2300,
      frequency: 'monthly',
      dayOfMonth: 28,
      startDate: '2025-01-01',
      active: true,
    },
    {
      id: 'rec-iva',
      type: 'expense',
      category: 'Debt',
      description: 'IVA Payment',
      amount: 110,
      frequency: 'monthly',
      dayOfMonth: 1,
      startDate: '2025-01-01',
      active: true,
    },
    {
      id: 'rec-rent',
      type: 'expense',
      category: 'Housing',
      description: 'Rent',
      amount: 550,
      frequency: 'monthly',
      dayOfMonth: 1,
      startDate: '2025-01-01',
      active: true,
    },
  ],
  assets: [
    { id: 'a-cash', name: 'Bank Account', type: 'cash', value: 0, lastUpdated: getTodayDateStr() },
    { id: 'a-trading', name: 'Trading Account', type: 'investment', value: 0, lastUpdated: getTodayDateStr() },
  ],
  liabilities: [
    { id: 'l-iva', name: 'IVA', type: 'iva', balance: 6000, monthlyPayment: 110, lastUpdated: getTodayDateStr() },
  ],
  netWorthHistory: [],
  savingsGoals: [
    {
      id: 'sg-thailand',
      name: 'Thailand Trip',
      targetAmount: 2500,
      currentAmount: 0,
      deadline: '2026-10-31',
      monthlyContribution: 360,
      color: 'bg-emerald-500',
    },
    {
      id: 'sg-trading',
      name: 'Trading Deposit',
      targetAmount: 300,
      currentAmount: 0,
      deadline: '2026-06-28',
      monthlyContribution: 150,
      color: 'bg-indigo-500',
    },
  ],
  trades: [],
  monthlyBudget: {
    income: 2300,
    fixedExpenses: 825,
    variableExpenses: 1152,
  },
  tradingRules: {
    maxRiskPerTrade: 5,
    maxTradesPerDay: 1,
    maxRiskPerDay: 5,
  },
  taxRate: 20,
};

export const DEFAULT_GOALS: GoalsData = {
  goals: [
    {
      id: 'g-thailand',
      lifeArea: 'fun',
      timeframe: 'yearly',
      period: '2026',
      title: 'Thailand Trip Funded',
      description: 'Save £2,500 by October 2026 for the trip.',
      targetValue: 2500,
      currentValue: 0,
      unit: '£',
      status: 'active',
      dueDate: '2026-10-31',
      createdAt: new Date().toISOString(),
      milestones: [
        { id: 'm-1', title: '£500 saved', completed: false },
        { id: 'm-2', title: '£1,000 saved', completed: false },
        { id: 'm-3', title: '£1,500 saved', completed: false },
        { id: 'm-4', title: '£2,000 saved', completed: false },
        { id: 'm-5', title: '£2,500 saved + flights booked', completed: false },
      ],
      linkedHabitIds: [],
      linkedSavingsGoalId: 'sg-thailand',
      trackingMode: 'auto-wealth',
    },
    {
      id: 'g-trading-deposit',
      lifeArea: 'wealth',
      timeframe: 'quarterly',
      period: '2026-Q2',
      title: 'Trading Account Deposit',
      description: 'Save £300 by end of June 2026 to fund first prop firm challenge.',
      targetValue: 300,
      currentValue: 0,
      unit: '£',
      status: 'active',
      dueDate: '2026-06-28',
      createdAt: new Date().toISOString(),
      milestones: [],
      linkedHabitIds: [],
      linkedSavingsGoalId: 'sg-trading',
      trackingMode: 'auto-wealth',
    },
  ],
  headlineGoal: 'Off the porter job by end of 2026 — replaced by consistent income from forex trading + UK Sourced + Quantum Flow.',
  visionStatement: '',
};

export const DEFAULT_PROFILE: UserProfile = {
  tdee: 2500,
  weight: 80,
  targetWeight: 75,
  dob: '1994-01-01',
  height: 180,
  gender: 'male',
  activityLevel: 1.1,
  defaultTargetCalories: 2200,
  defaultProteinRatio: 35,
  defaultCarbsRatio: 40,
  defaultFatsRatio: 25,
  trackingStartDate: getTodayDateStr(),
  sleepTarget: 8,
  waterTarget: 3,
};

const EMPTY_DAYLOG_ADDITIONS = {
  energy: 0,
  sleepHours: 0,
  sleepQuality: 0,
  waterLiters: 0,
  intent: { ...EMPTY_INTENT },
  review: { ...EMPTY_REVIEW },
};

const migrateLog = (log: any): DayLog => ({
  ...log,
  energy: log.energy ?? 0,
  sleepHours: log.sleepHours ?? 0,
  sleepQuality: log.sleepQuality ?? 0,
  waterLiters: log.waterLiters ?? 0,
  intent: log.intent ?? { ...EMPTY_INTENT },
  review: log.review ?? { ...EMPTY_REVIEW },
});

export const loadState = (userId: string): AppState | null => {
  const saved = localStorage.getItem(`life_dashboard_v2_${userId}`);
  if (saved) {
    const parsed = JSON.parse(saved);
    return ensureStateShape(parsed);
  }

  const legacyV1 = localStorage.getItem(`life_dashboard_v1_${userId}`);
  if (legacyV1) {
    const parsed = JSON.parse(legacyV1);
    return ensureStateShape(parsed);
  }

  const legacy = localStorage.getItem(`habit_stack_v4_${userId}`);
  if (legacy) {
    const parsed = JSON.parse(legacy);
    parsed.wealth = DEFAULT_WEALTH;
    parsed.goals = DEFAULT_GOALS;
    return ensureStateShape(parsed);
  }

  return null;
};

function ensureStateShape(parsed: any): AppState {
  if (!parsed.userProfile) parsed.userProfile = { ...DEFAULT_PROFILE };
  if (!parsed.userProfile.trackingStartDate) parsed.userProfile.trackingStartDate = getTodayDateStr();
  if (parsed.userProfile.sleepTarget === undefined) parsed.userProfile.sleepTarget = 8;
  if (parsed.userProfile.waterTarget === undefined) parsed.userProfile.waterTarget = 3;

  if (!parsed.wealth) parsed.wealth = DEFAULT_WEALTH;
  else {
    if (!parsed.wealth.recurringTransactions) parsed.wealth.recurringTransactions = DEFAULT_WEALTH.recurringTransactions;
    if (!parsed.wealth.assets) parsed.wealth.assets = DEFAULT_WEALTH.assets;
    if (!parsed.wealth.liabilities) parsed.wealth.liabilities = DEFAULT_WEALTH.liabilities;
    if (!parsed.wealth.netWorthHistory) parsed.wealth.netWorthHistory = [];
    if (!parsed.wealth.tradingRules) parsed.wealth.tradingRules = DEFAULT_WEALTH.tradingRules;
    if (parsed.wealth.taxRate === undefined) parsed.wealth.taxRate = 20;
    parsed.wealth.trades = (parsed.wealth.trades || []).map((t: any) => ({
      ...t,
      setup: t.setup ?? '',
      checklist: t.checklist ?? {
        structureConfirmed: false, rangeIdentified: false, smsConfirmed: false,
        riskUnder5: false, notRevenge: false, firstTradeOfDay: false,
      },
    }));
  }

  if (!parsed.goals) parsed.goals = DEFAULT_GOALS;
  else {
    parsed.goals.goals = (parsed.goals.goals || []).map((g: any) => ({
      ...g,
      milestones: g.milestones ?? [],
      linkedHabitIds: g.linkedHabitIds ?? [],
      trackingMode: g.trackingMode ?? 'manual',
    }));
  }

  if (!parsed.mealLibrary) parsed.mealLibrary = INITIAL_MEAL_LIBRARY;

  if (parsed.logs) {
    Object.keys(parsed.logs).forEach(d => {
      parsed.logs[d] = migrateLog(parsed.logs[d]);
    });
  }

  return parsed as AppState;
}

export const saveState = (userId: string, state: AppState) => {
  localStorage.setItem(`life_dashboard_v2_${userId}`, JSON.stringify(state));
};

export const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

export const getWeekRange = (dateStr: string): { start: string; end: string; days: string[] } => {
  const date = new Date(dateStr);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d.toISOString().split('T')[0]);
  }
  return { start: monday.toISOString().split('T')[0], end: sunday.toISOString().split('T')[0], days };
};

export const getMonthRange = (dateStr: string): { start: string; end: string; days: string[]; label: string } => {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days: string[] = [];
  for (let i = 1; i <= last.getDate(); i++) {
    const d = new Date(year, month, i);
    days.push(d.toISOString().split('T')[0]);
  }
  return {
    start: first.toISOString().split('T')[0],
    end: last.toISOString().split('T')[0],
    days,
    label: first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
  };
};
