import React, { useState } from 'react';
import { DayLog, MealLibraryItem, Meal } from '../types';

interface Props {
  log: DayLog;
  previousLog: DayLog | null;
  mealLibrary: MealLibraryItem[];
  onUpdateLog: (log: DayLog) => void;
}

const QuickActions: React.FC<Props> = ({ log, previousLog, mealLibrary, onUpdateLog }) => {
  const [showPicker, setShowPicker] = useState(false);
  const favorites = mealLibrary.filter(m => m.isFavorite);

  const copyYesterdayMeals = () => {
    if (!previousLog) return;
    const copied: Meal[] = previousLog.meals.map(m => ({ ...m, id: `${m.id}-${Date.now()}`, completed: false }));
    onUpdateLog({ ...log, meals: copied });
  };

  const copyYesterdayHabits = () => {
    if (!previousLog) return;
    onUpdateLog({ ...log, habits: previousLog.habits.map(h => ({ ...h, completed: false })) });
  };

  const completeAll = () => {
    onUpdateLog({
      ...log,
      habits: log.habits.map(h => ({ ...h, completed: true })),
      meals: log.meals.map(m => ({ ...m, completed: true })),
    });
  };

  const addFromLibrary = (item: MealLibraryItem) => {
    const meal: Meal = {
      id: `${item.id}-${Date.now()}`,
      name: item.name,
      type: item.type,
      ingredients: item.ingredients,
      completed: false,
      fromLibraryId: item.id,
    };
    onUpdateLog({ ...log, meals: [...log.meals, meal] });
    setShowPicker(false);
  };

  return (
    <div className="glass p-4 rounded-2xl border border-zinc-800/50">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[9px] font-black uppercase tracking-[0.25em] text-zinc-500">Quick Actions</div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={copyYesterdayMeals}
          disabled={!previousLog}
          className="bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-indigo-500/50 disabled:opacity-30 disabled:cursor-not-allowed px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
        >📋 Copy Yesterday Meals</button>
        <button
          onClick={copyYesterdayHabits}
          disabled={!previousLog}
          className="bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-indigo-500/50 disabled:opacity-30 disabled:cursor-not-allowed px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
        >🔄 Copy Yesterday Habits</button>
        <button
          onClick={() => setShowPicker(true)}
          className="bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
        >⭐ Add From Library</button>
        <button
          onClick={completeAll}
          className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
        >✓ Mark All Done</button>
      </div>

      {showPicker && (
        <div className="fixed inset-0 z-[200] bg-zinc-950/90 backdrop-blur-xl flex items-center justify-center p-4" onClick={() => setShowPicker(false)}>
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-md w-full max-h-[80vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">Pick a meal</div>
            <div className="space-y-2">
              {(favorites.length > 0 ? favorites : mealLibrary).map(item => (
                <button
                  key={item.id}
                  onClick={() => addFromLibrary(item)}
                  className="w-full text-left bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl p-3 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-[9px] font-black text-zinc-600 uppercase">{item.type}</div>
                      <div className="font-bold text-white">{item.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-indigo-400">
                        {Math.round(item.ingredients.reduce((s, i) => s + (i.macros?.calories || 0), 0))} kcal
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickActions;
