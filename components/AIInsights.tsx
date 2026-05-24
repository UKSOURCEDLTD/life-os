import React, { useState, useMemo } from 'react';
import { DayLog, UserProfile, WealthData, GoalsData } from '../types';
import { aggregateRange } from '../utils/aggregations';
import { getWeekRange } from '../utils/storage';

interface Props {
  logs: Record<string, DayLog>;
  currentDate: string;
  profile: UserProfile;
  wealth: WealthData;
  goals: GoalsData;
  burnFn: (log: DayLog) => number;
}

interface Insight {
  kind: 'positive' | 'warning' | 'info' | 'opportunity';
  icon: string;
  title: string;
  detail: string;
}

const AIInsights: React.FC<Props> = ({ logs, currentDate, profile, wealth, goals, burnFn }) => {
  const insights = useMemo(() => generateInsights(logs, currentDate, profile, wealth, goals, burnFn), [logs, currentDate, profile, wealth, goals, burnFn]);

  if (insights.length === 0) return null;

  return (
    <div className="glass p-5 rounded-3xl border border-indigo-500/30 bg-indigo-500/5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-black">◆</div>
        <div>
          <div className="text-[9px] font-black uppercase text-indigo-400 tracking-widest">Performance Engine</div>
          <div className="text-sm font-bold text-white">Pattern Detection</div>
        </div>
      </div>
      <div className="space-y-2">
        {insights.map((i, ix) => {
          const colorClass = {
            positive: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400',
            warning: 'border-amber-500/30 bg-amber-500/5 text-amber-400',
            info: 'border-zinc-700/50 bg-zinc-900/30 text-zinc-300',
            opportunity: 'border-indigo-500/30 bg-indigo-500/5 text-indigo-400',
          }[i.kind];
          return (
            <div key={ix} className={`flex gap-3 p-3 rounded-xl border ${colorClass}`}>
              <div className="text-lg">{i.icon}</div>
              <div className="flex-1">
                <div className="text-xs font-bold">{i.title}</div>
                <div className="text-[11px] text-zinc-400 mt-0.5">{i.detail}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

function generateInsights(
  logs: Record<string, DayLog>, currentDate: string, profile: UserProfile, wealth: WealthData, goals: GoalsData, burnFn: (log: DayLog) => number
): Insight[] {
  const insights: Insight[] = [];
  const week = getWeekRange(currentDate);
  const agg = aggregateRange(logs, week.days, burnFn);

  if (agg.loggedCount >= 3) {
    if (agg.avg.habitPct >= 80) {
      insights.push({ kind: 'positive', icon: '🔥', title: `${agg.avg.habitPct}% habit consistency this week`, detail: `You're executing — keep the pattern.` });
    } else if (agg.avg.habitPct < 40) {
      insights.push({ kind: 'warning', icon: '⚠', title: `Habit consistency dropped to ${agg.avg.habitPct}%`, detail: `Pick 1-2 keystone habits to anchor the day.` });
    }

    if (agg.avg.sleep > 0 && agg.avg.sleep < profile.sleepTarget - 1) {
      insights.push({ kind: 'warning', icon: '😴', title: `Sleep avg ${agg.avg.sleep}h vs ${profile.sleepTarget}h target`, detail: `Sleep debt compounds — biggest single lever on mood/training.` });
    } else if (agg.avg.sleep >= profile.sleepTarget) {
      insights.push({ kind: 'positive', icon: '💤', title: `Sleep on target at ${agg.avg.sleep}h avg`, detail: `Recovery dialed in.` });
    }

    if (agg.avg.protein > 0 && agg.avg.protein < profile.weight * 1.6) {
      insights.push({ kind: 'opportunity', icon: '🥩', title: `Protein under-target (${Math.round(agg.avg.protein)}g/day)`, detail: `Aim for ${Math.round(profile.weight * 1.6)}-${Math.round(profile.weight * 2.2)}g to support muscle + satiety.` });
    }

    if (agg.weightDelta < -0.5) {
      insights.push({ kind: 'positive', icon: '📉', title: `Down ${Math.abs(agg.weightDelta)}kg this week`, detail: `Net deficit ${Math.abs(agg.avg.net)} kcal/day — sustainable rate.` });
    } else if (agg.weightDelta > 0.5) {
      insights.push({ kind: 'info', icon: '📈', title: `Up ${agg.weightDelta}kg this week`, detail: `If unintended: avg surplus ${agg.avg.net} kcal/day.` });
    }

    if (agg.avg.mood > 0 && agg.avg.mood < 3) {
      insights.push({ kind: 'warning', icon: '🌧', title: `Mood averaging ${agg.avg.mood}/5`, detail: `Check sleep, sunlight, training, social contact this week.` });
    }
  }

  // Wealth insights
  const monthEntries = wealth.financeEntries.filter(e => e.date.startsWith(new Date().toISOString().slice(0, 7)));
  const recurringIncome = wealth.recurringTransactions.filter(r => r.active && r.type === 'income' && r.frequency === 'monthly').reduce((s, r) => s + r.amount, 0);
  const recurringExpense = wealth.recurringTransactions.filter(r => r.active && r.type === 'expense' && r.frequency === 'monthly').reduce((s, r) => s + r.amount, 0);
  const fixedSurplus = recurringIncome - recurringExpense;
  if (fixedSurplus < 0) {
    insights.push({ kind: 'warning', icon: '💸', title: `Recurring spend (£${recurringExpense}) exceeds recurring income (£${recurringIncome})`, detail: `Need to plug £${Math.abs(fixedSurplus)}/mo gap.` });
  } else if (fixedSurplus > 200) {
    insights.push({ kind: 'opportunity', icon: '💰', title: `£${fixedSurplus}/mo fixed surplus`, detail: `Channel into highest-priority savings goal.` });
  }

  // Trading insights
  const closedTrades = wealth.trades.filter(t => t.outcome !== 'open');
  if (closedTrades.length >= 5) {
    const winRate = (closedTrades.filter(t => t.outcome === 'win').length / closedTrades.length) * 100;
    if (winRate < 40) {
      insights.push({ kind: 'warning', icon: '📊', title: `Trading win rate at ${Math.round(winRate)}%`, detail: `Pause and review setups — are you taking valid entries?` });
    } else if (winRate >= 60) {
      insights.push({ kind: 'positive', icon: '📈', title: `Win rate ${Math.round(winRate)}% over ${closedTrades.length} trades`, detail: `Edge is showing. Don't change variables.` });
    }
  }

  // Goal urgency
  const today = new Date(currentDate);
  goals.goals.filter(g => g.status === 'active' && g.dueDate).forEach(g => {
    const due = new Date(g.dueDate!);
    const daysLeft = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (g.targetValue && daysLeft > 0 && daysLeft <= 30) {
      const pct = ((g.currentValue || 0) / g.targetValue) * 100;
      if (pct < 70) {
        insights.push({ kind: 'warning', icon: '⏰', title: `"${g.title}" — ${daysLeft} days left, ${Math.round(pct)}% done`, detail: `Pace needed: ${Math.round((g.targetValue - (g.currentValue || 0)) / daysLeft * 7)}${g.unit || ''}/week.` });
      }
    }
  });

  return insights.slice(0, 6);
}

export default AIInsights;
