import { DayLog, WealthData, GoalsData, FinanceEntry, RecurringTransaction, NetWorthSnapshot, Goal } from '../types';
import { roundTo2, getTodayDateStr } from './storage';

export interface DayTotals {
  intake: number;
  protein: number;
  carbs: number;
  fats: number;
  burn: number;
  net: number;
  habitsCompleted: number;
  habitsTotal: number;
  habitPct: number;
  sleep: number;
  water: number;
  mood: number;
  energy: number;
  steps: number;
  weight: number | null;
}

export const aggregateDay = (log: DayLog | null, burnFn: (l: DayLog) => number): DayTotals => {
  if (!log) {
    return { intake: 0, protein: 0, carbs: 0, fats: 0, burn: 0, net: 0, habitsCompleted: 0, habitsTotal: 0, habitPct: 0, sleep: 0, water: 0, mood: 0, energy: 0, steps: 0, weight: null };
  }
  const totals = log.meals.reduce((acc, m) => {
    m.ingredients.forEach(ing => {
      if (ing.macros) {
        acc.intake += ing.macros.calories;
        acc.protein += ing.macros.protein;
        acc.carbs += ing.macros.carbs;
        acc.fats += ing.macros.fats;
      }
    });
    return acc;
  }, { intake: 0, protein: 0, carbs: 0, fats: 0 });
  const burn = burnFn(log);
  const habitsCompleted = log.habits.filter(h => h.completed).length;
  const habitsTotal = log.habits.length;
  return {
    intake: roundTo2(totals.intake),
    protein: roundTo2(totals.protein),
    carbs: roundTo2(totals.carbs),
    fats: roundTo2(totals.fats),
    burn: roundTo2(burn),
    net: roundTo2(totals.intake - burn),
    habitsCompleted,
    habitsTotal,
    habitPct: habitsTotal > 0 ? Math.round((habitsCompleted / habitsTotal) * 100) : 0,
    sleep: log.sleepHours || 0,
    water: log.waterLiters || 0,
    mood: log.mood || 0,
    energy: log.energy || 0,
    steps: log.steps || 0,
    weight: log.weight || null,
  };
};

export const aggregateRange = (logs: Record<string, DayLog>, days: string[], burnFn: (l: DayLog) => number) => {
  const dayTotals = days.map(d => ({ date: d, totals: aggregateDay(logs[d] || null, burnFn) }));
  const loggedDays = dayTotals.filter(d => logs[d.date]);
  const count = Math.max(loggedDays.length, 1);
  const sum = loggedDays.reduce((acc, d) => {
    acc.intake += d.totals.intake;
    acc.protein += d.totals.protein;
    acc.carbs += d.totals.carbs;
    acc.fats += d.totals.fats;
    acc.burn += d.totals.burn;
    acc.habitPct += d.totals.habitPct;
    acc.sleep += d.totals.sleep;
    acc.water += d.totals.water;
    acc.mood += d.totals.mood;
    acc.energy += d.totals.energy;
    acc.steps += d.totals.steps;
    return acc;
  }, { intake: 0, protein: 0, carbs: 0, fats: 0, burn: 0, habitPct: 0, sleep: 0, water: 0, mood: 0, energy: 0, steps: 0 });

  const moodCount = loggedDays.filter(d => d.totals.mood > 0).length || 1;
  const energyCount = loggedDays.filter(d => d.totals.energy > 0).length || 1;
  const sleepCount = loggedDays.filter(d => d.totals.sleep > 0).length || 1;
  const weights = loggedDays.map(d => d.totals.weight).filter(w => w !== null) as number[];

  return {
    days: dayTotals,
    loggedCount: loggedDays.length,
    totalDays: days.length,
    avg: {
      intake: roundTo2(sum.intake / count),
      protein: roundTo2(sum.protein / count),
      carbs: roundTo2(sum.carbs / count),
      fats: roundTo2(sum.fats / count),
      burn: roundTo2(sum.burn / count),
      net: roundTo2((sum.intake - sum.burn) / count),
      habitPct: Math.round(sum.habitPct / count),
      sleep: roundTo2(sum.sleep / sleepCount),
      water: roundTo2(sum.water / count),
      mood: roundTo2(sum.mood / moodCount),
      energy: roundTo2(sum.energy / energyCount),
      steps: Math.round(sum.steps / count),
    },
    weightStart: weights[0] ?? null,
    weightEnd: weights[weights.length - 1] ?? null,
    weightDelta: weights.length > 1 ? roundTo2(weights[weights.length - 1] - weights[0]) : 0,
  };
};

export const findBestAndWorstDay = (logs: Record<string, DayLog>, days: string[]) => {
  let best: { date: string; pct: number } | null = null;
  let worst: { date: string; pct: number } | null = null;
  days.forEach(d => {
    const log = logs[d];
    if (!log || log.habits.length === 0) return;
    const pct = (log.habits.filter(h => h.completed).length / log.habits.length) * 100;
    if (!best || pct > best.pct) best = { date: d, pct };
    if (!worst || pct < worst.pct) worst = { date: d, pct };
  });
  return { best, worst };
};

export const computeStreak = (logs: Record<string, DayLog>, habitName: string): number => {
  const dates = Object.keys(logs).sort().reverse();
  let streak = 0;
  for (const date of dates) {
    const log = logs[date];
    const h = log.habits.find(x => x.name === habitName);
    if (h && h.completed) streak++;
    else if (date < getTodayDateStr()) break;
  }
  return streak;
};

export const expandRecurringForMonth = (recurring: RecurringTransaction[], monthStart: string): FinanceEntry[] => {
  const entries: FinanceEntry[] = [];
  const start = new Date(monthStart);
  const year = start.getFullYear();
  const month = start.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();

  recurring.filter(r => r.active).forEach(r => {
    if (r.frequency === 'monthly' && r.dayOfMonth) {
      const day = Math.min(r.dayOfMonth, lastDay);
      const date = new Date(year, month, day).toISOString().split('T')[0];
      if (date >= r.startDate && (!r.endDate || date <= r.endDate)) {
        entries.push({
          id: `${r.id}-${date}`,
          date,
          type: r.type,
          category: r.category,
          description: r.description,
          amount: r.amount,
          isRecurring: true,
          recurringId: r.id,
        });
      }
    } else if (r.frequency === 'weekly' && r.dayOfWeek !== undefined) {
      for (let d = 1; d <= lastDay; d++) {
        const dt = new Date(year, month, d);
        if (dt.getDay() === r.dayOfWeek) {
          const date = dt.toISOString().split('T')[0];
          if (date >= r.startDate && (!r.endDate || date <= r.endDate)) {
            entries.push({
              id: `${r.id}-${date}`,
              date,
              type: r.type,
              category: r.category,
              description: r.description,
              amount: r.amount,
              isRecurring: true,
              recurringId: r.id,
            });
          }
        }
      }
    } else if (r.frequency === 'biweekly' && r.dayOfWeek !== undefined) {
      const refStart = new Date(r.startDate);
      for (let d = 1; d <= lastDay; d++) {
        const dt = new Date(year, month, d);
        if (dt.getDay() === r.dayOfWeek) {
          const diffWeeks = Math.floor((dt.getTime() - refStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
          if (diffWeeks >= 0 && diffWeeks % 2 === 0) {
            const date = dt.toISOString().split('T')[0];
            if (date >= r.startDate && (!r.endDate || date <= r.endDate)) {
              entries.push({
                id: `${r.id}-${date}`,
                date,
                type: r.type,
                category: r.category,
                description: r.description,
                amount: r.amount,
                isRecurring: true,
                recurringId: r.id,
              });
            }
          }
        }
      }
    } else if (r.frequency === 'yearly' && r.dayOfMonth) {
      const yearMonth = new Date(r.startDate).getMonth();
      if (yearMonth === month) {
        const day = Math.min(r.dayOfMonth, lastDay);
        const date = new Date(year, month, day).toISOString().split('T')[0];
        entries.push({
          id: `${r.id}-${date}`,
          date,
          type: r.type,
          category: r.category,
          description: r.description,
          amount: r.amount,
          isRecurring: true,
          recurringId: r.id,
        });
      }
    }
  });
  return entries;
};

export const computeNetWorth = (wealth: WealthData): { assets: number; liabilities: number; net: number } => {
  const assets = wealth.assets.reduce((sum, a) => sum + a.value, 0);
  const liabilities = wealth.liabilities.reduce((sum, l) => sum + l.balance, 0);
  return { assets: roundTo2(assets), liabilities: roundTo2(liabilities), net: roundTo2(assets - liabilities) };
};

export const computeTradeStats = (trades: WealthData['trades']) => {
  const closed = trades.filter(t => t.outcome !== 'open');
  const wins = closed.filter(t => t.outcome === 'win');
  const losses = closed.filter(t => t.outcome === 'loss');
  const totalPnl = closed.reduce((sum, t) => sum + t.pnl, 0);
  const totalR = closed.reduce((sum, t) => sum + (t.rGained || 0), 0);
  const winRate = closed.length > 0 ? roundTo2((wins.length / closed.length) * 100) : 0;
  const avgWin = wins.length > 0 ? roundTo2(wins.reduce((s, t) => s + t.pnl, 0) / wins.length) : 0;
  const avgLoss = losses.length > 0 ? roundTo2(losses.reduce((s, t) => s + t.pnl, 0) / losses.length) : 0;
  const equityCurve: { trade: number; equity: number; date: string }[] = [];
  let running = 0;
  closed.sort((a, b) => a.date.localeCompare(b.date)).forEach((t, i) => {
    running += t.pnl;
    equityCurve.push({ trade: i + 1, equity: roundTo2(running), date: t.date });
  });
  let peak = 0; let maxDrawdown = 0;
  equityCurve.forEach(p => {
    if (p.equity > peak) peak = p.equity;
    const dd = peak - p.equity;
    if (dd > maxDrawdown) maxDrawdown = dd;
  });
  return {
    totalTrades: closed.length,
    openTrades: trades.filter(t => t.outcome === 'open').length,
    wins: wins.length,
    losses: losses.length,
    winRate,
    totalPnl: roundTo2(totalPnl),
    totalR: roundTo2(totalR),
    avgWin,
    avgLoss,
    equityCurve,
    maxDrawdown: roundTo2(maxDrawdown),
    profitFactor: avgLoss !== 0 ? roundTo2(Math.abs((wins.reduce((s, t) => s + t.pnl, 0)) / (losses.reduce((s, t) => s + Math.abs(t.pnl), 0) || 1))) : 0,
  };
};

export const computeTaxEstimate = (wealth: WealthData): number => {
  const ytdEntries = wealth.financeEntries.filter(e => e.date.startsWith(new Date().getFullYear().toString()));
  const ytdIncome = ytdEntries.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
  const recurringYTD = wealth.recurringTransactions
    .filter(r => r.active && r.type === 'income')
    .reduce((s, r) => {
      const monthsElapsed = new Date().getMonth() + 1;
      if (r.frequency === 'monthly') return s + r.amount * monthsElapsed;
      if (r.frequency === 'weekly') return s + r.amount * monthsElapsed * 4.33;
      if (r.frequency === 'biweekly') return s + r.amount * monthsElapsed * 2.17;
      if (r.frequency === 'yearly') return s + r.amount;
      return s;
    }, 0);
  return roundTo2((ytdIncome + recurringYTD) * (wealth.taxRate / 100));
};

export const syncGoalsFromWealth = (goals: Goal[], wealth: WealthData): Goal[] => {
  return goals.map(g => {
    if (g.trackingMode === 'auto-wealth' && g.linkedSavingsGoalId) {
      const sg = wealth.savingsGoals.find(s => s.id === g.linkedSavingsGoalId);
      if (sg) {
        return { ...g, currentValue: sg.currentAmount, targetValue: sg.targetAmount };
      }
    }
    return g;
  });
};

export const syncGoalsFromHabits = (goals: Goal[], logs: Record<string, DayLog>, monthDays: string[]): Goal[] => {
  return goals.map(g => {
    if (g.trackingMode === 'auto-habit' && g.linkedHabitIds.length > 0) {
      let completions = 0;
      monthDays.forEach(d => {
        const log = logs[d];
        if (!log) return;
        log.habits.forEach(h => {
          if (g.linkedHabitIds.includes(h.id) && h.completed) completions++;
        });
      });
      return { ...g, currentValue: completions };
    }
    return g;
  });
};
