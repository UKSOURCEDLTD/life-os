
export enum HabitCategory {
  HEALTH = 'Health',
  PRODUCTIVITY = 'Productivity',
  MINDFULNESS = 'Mindfulness',
  SOCIAL = 'Social',
  WEALTH = 'Wealth',
  GROWTH = 'Growth',
}

export interface User {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
  isGuest?: boolean;
  createdAt: string;
}

export interface Habit {
  id: string;
  name: string;
  category: HabitCategory;
  completed: boolean;
  linkedGoalId?: string;
}

export interface Macros {
  protein: number;
  carbs: number;
  fats: number;
  calories: number;
}

export interface Ingredient {
  name: string;
  macros?: Macros;
  serving?: string;
}

export interface Meal {
  id: string;
  name: string;
  type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  ingredients: Ingredient[];
  completed: boolean;
  isSupplemental?: boolean;
  fromLibraryId?: string;
}

export interface MealLibraryItem {
  id: string;
  name: string;
  type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  ingredients: Ingredient[];
  isFavorite: boolean;
  tags: string[];
  createdAt: string;
}

export interface Exercise {
  id: string;
  name: string;
  durationMinutes: number;
  caloriesBurned: number;
}

export interface DailyIntent {
  mit1: string;
  mit2: string;
  mit3: string;
  focus: string;
}

export interface EveningReview {
  rating: number;
  win: string;
  lesson: string;
  gratitude: string;
}

export interface DayLog {
  date: string;
  habits: Habit[];
  meals: Meal[];
  exercises: Exercise[];
  journal: string;
  mood: number;
  energy: number;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFats: number;
  weight: number;
  steps: number;
  sleepHours: number;
  sleepQuality: number;
  waterLiters: number;
  intent: DailyIntent;
  review: EveningReview;
}

export type ViewType = 'today' | 'analytics' | 'protocols' | 'journal' | 'account' | 'wealth' | 'goals' | 'weekly' | 'monthly' | 'meals';

export interface UserProfile {
  tdee: number;
  weight: number;
  targetWeight: number;
  dob: string;
  height: number;
  gender: 'male' | 'female';
  activityLevel: number;
  defaultTargetCalories: number;
  defaultProteinRatio: number;
  defaultCarbsRatio: number;
  defaultFatsRatio: number;
  trackingStartDate: string;
  sleepTarget: number;
  waterTarget: number;
}

export interface FinanceEntry {
  id: string;
  date: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  isRecurring: boolean;
  recurringId?: string;
}

export interface RecurringTransaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'yearly';
  dayOfMonth?: number;
  dayOfWeek?: number;
  startDate: string;
  endDate?: string;
  active: boolean;
}

export interface Asset {
  id: string;
  name: string;
  type: 'cash' | 'investment' | 'property' | 'crypto' | 'other';
  value: number;
  lastUpdated: string;
}

export interface Liability {
  id: string;
  name: string;
  type: 'iva' | 'credit' | 'loan' | 'other';
  balance: number;
  monthlyPayment: number;
  lastUpdated: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  monthlyContribution: number;
  color: string;
  linkedGoalId?: string;
}

export interface Trade {
  id: string;
  date: string;
  pair: string;
  setup: string;
  direction: 'long' | 'short';
  entryPrice: number;
  stopPrice: number;
  targetPrice: number;
  riskAmount: number;
  rrRatio: string;
  outcome: 'win' | 'loss' | 'breakeven' | 'open';
  pnl: number;
  rGained: number;
  notes: string;
  checklist: {
    structureConfirmed: boolean;
    rangeIdentified: boolean;
    smsConfirmed: boolean;
    riskUnder5: boolean;
    notRevenge: boolean;
    firstTradeOfDay: boolean;
  };
}

export interface NetWorthSnapshot {
  date: string;
  assets: number;
  liabilities: number;
  net: number;
}

export interface WealthData {
  financeEntries: FinanceEntry[];
  savingsGoals: SavingsGoal[];
  trades: Trade[];
  recurringTransactions: RecurringTransaction[];
  assets: Asset[];
  liabilities: Liability[];
  netWorthHistory: NetWorthSnapshot[];
  monthlyBudget: {
    income: number;
    fixedExpenses: number;
    variableExpenses: number;
  };
  tradingRules: {
    maxRiskPerTrade: number;
    maxTradesPerDay: number;
    maxRiskPerDay: number;
  };
  taxRate: number;
}

export type LifeArea = 'health' | 'wealth' | 'relationships' | 'growth' | 'fun' | 'home';
export type GoalTimeframe = 'yearly' | 'quarterly' | 'monthly';

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
}

export interface Goal {
  id: string;
  lifeArea: LifeArea;
  timeframe: GoalTimeframe;
  period: string;
  title: string;
  description: string;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  status: 'active' | 'completed' | 'abandoned';
  dueDate?: string;
  createdAt: string;
  milestones: Milestone[];
  linkedHabitIds: string[];
  linkedSavingsGoalId?: string;
  trackingMode: 'manual' | 'auto-habit' | 'auto-wealth' | 'auto-weight';
}

export interface GoalsData {
  goals: Goal[];
  headlineGoal: string;
  visionStatement: string;
}

export interface AppState {
  logs: Record<string, DayLog>;
  currentDate: string;
  view: ViewType;
  masterHabits: Habit[];
  masterMeals: Meal[];
  mealLibrary: MealLibraryItem[];
  userProfile: UserProfile;
  wealth: WealthData;
  goals: GoalsData;
}
