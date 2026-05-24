import React, { useState, useEffect, useRef } from 'react';
import { Meal, Ingredient } from '../types';
import MealDetailModal from './MealDetailModal';
import { roundTo2 } from '../utils/storage';
import { getIngredientSuggestions, analyzeMealNutrition } from '../services/geminiService';

interface MealTrackerProps {
  meals: Meal[];
  onToggle: (id: string) => void;
  onAdd: (name: string, type: Meal['type'], isSupplemental: boolean) => void;
  onUpdate: (updatedMeal: Meal) => void;
  onDelete: (id: string) => void;
}

const MealTracker: React.FC<MealTrackerProps> = ({ meals, onToggle, onAdd, onUpdate, onDelete }) => {
  const [newMeal, setNewMeal] = useState('');
  const [mealType, setMealType] = useState<Meal['type']>('Snack');
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [suggestions, setSuggestions] = useState<Ingredient[]>([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const protocolMeals = meals.filter(m => !m.isSupplemental);
  const supplementalMeals = meals.filter(m => m.isSupplemental);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (newMeal.trim().length >= 2) {
        setIsFetchingSuggestions(true);
        const results = await getIngredientSuggestions(newMeal.trim());
        setSuggestions(results);
        setIsFetchingSuggestions(false);
      } else {
        setSuggestions([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [newMeal]);

  const handleSubmit = async (e?: React.FormEvent, overrideIngredient?: Ingredient) => {
    e?.preventDefault();
    const finalName = overrideIngredient ? overrideIngredient.name : newMeal.trim();
    if (!finalName) return;

    onAdd(finalName, mealType, true);
    setNewMeal('');
    setSuggestions([]);

    // Wait for the parent to add the meal, then find it and update with macros
    setTimeout(async () => {
      const target = meals.find(m => m.name === finalName && m.isSupplemental && m.ingredients.length === 0);
      if (target) {
        if (overrideIngredient) {
          onUpdate({ ...target, ingredients: [overrideIngredient], completed: true });
        } else {
          const analysis = await analyzeMealNutrition([finalName]);
          if (analysis.length > 0) {
            onUpdate({ ...target, ingredients: analysis, completed: true });
          }
        }
      }
    }, 100);
  };

  const getMealMacros = (meal: Meal) => {
    const raw = meal.ingredients.reduce((acc, curr) => {
      if (!curr.macros) return acc;
      return {
        calories: acc.calories + curr.macros.calories,
        protein: acc.protein + curr.macros.protein,
        carbs: acc.carbs + curr.macros.carbs,
        fats: acc.fats + curr.macros.fats,
      };
    }, { calories: 0, protein: 0, carbs: 0, fats: 0 });
    return {
      calories: roundTo2(raw.calories),
      protein: roundTo2(raw.protein),
      carbs: roundTo2(raw.carbs),
      fats: roundTo2(raw.fats)
    };
  };

  const renderMealItem = (meal: Meal) => {
    const macros = getMealMacros(meal);
    const hasNutrition = meal.ingredients.some(i => i.macros);
    return (
      <div key={meal.id} className={`group flex items-center p-5 rounded-2xl border transition-all duration-300 relative ${meal.completed ? 'bg-zinc-900/30 border-zinc-800/50 opacity-60' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-600 shadow-lg'}`}>
        <div className="flex-1 cursor-pointer" onClick={() => setSelectedMeal(meal)}>
          <div className="flex flex-col">
            <span className={`text-sm font-bold uppercase ${meal.completed ? 'text-zinc-600' : 'text-zinc-100'}`}>{meal.name}</span>
            <div className="flex items-center gap-2 mt-1"><span className="text-[8px] font-bold uppercase text-zinc-600 px-2 py-0.5 rounded border border-zinc-800">{meal.type.substring(0,2)}</span><span className="text-[9px] text-zinc-500 font-bold hover:text-indigo-400 transition-colors">EDIT</span></div>
          </div>
          {hasNutrition && <div className="flex gap-3 mt-3"><span className="text-[9px] font-mono text-indigo-400">P:{macros.protein}g</span><span className="text-[9px] font-mono text-emerald-400">C:{macros.carbs}g</span><span className="text-[9px] font-mono text-amber-400">F:{macros.fats}g</span><span className="text-[9px] font-mono text-zinc-400 ml-auto">{macros.calories} kcal</span></div>}
        </div>
        <div className="flex items-center gap-4 ml-6 border-l border-zinc-800 pl-6">
          <button onClick={() => onToggle(meal.id)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${meal.completed ? 'bg-zinc-800 text-zinc-500 border border-zinc-700' : 'bg-zinc-950 border border-zinc-700 text-zinc-400 hover:text-white'}`}>{meal.completed ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg> : <div className="w-2 h-2 rounded-sm border-2 border-zinc-700" />}</button>
          <button onClick={() => onDelete(meal.id)} className="opacity-0 group-hover:opacity-100 text-zinc-700 hover:text-red-400 p-2 transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-10">
      {selectedMeal && <MealDetailModal meal={selectedMeal} onClose={() => setSelectedMeal(null)} onUpdate={onUpdate} />}
      <div><h2 className="text-xl font-bold text-zinc-100 mb-4 px-1">Blueprint Meals</h2><div className="space-y-3">{protocolMeals.map(renderMealItem)}</div></div>
      <div>
        <h2 className="text-xl font-bold text-zinc-100 mb-4 px-1">Extra Intake</h2>
        <div className="space-y-3 mb-8">{supplementalMeals.map(renderMealItem)}</div>
        <div className="relative">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input ref={inputRef} type="text" value={newMeal} onChange={(e) => setNewMeal(e.target.value)} placeholder="Eaten lately?" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-1 focus:ring-indigo-500 placeholder-zinc-800" />
                {isFetchingSuggestions && <div className="absolute right-4 top-1/2 -translate-y-1/2"><div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>}
              </div>
              <select value={mealType} onChange={(e) => setMealType(e.target.value as Meal['type'])} className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 text-xs font-bold uppercase text-zinc-500"><option value="Breakfast">AM</option><option value="Lunch">MID</option><option value="Dinner">PM</option><option value="Snack">XTRA</option></select>
            </div>
          </form>
          {suggestions.length > 0 && (
            <div className="absolute bottom-full left-0 right-0 mb-4 glass border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2">
              <div className="p-3 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-900/50"><span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-2">AI Suggestions</span></div>
              <div className="max-h-64 overflow-y-auto">{suggestions.map((s, idx) => (<button key={idx} onClick={() => handleSubmit(undefined, s)} className="w-full flex items-center justify-between p-5 hover:bg-indigo-500/5 border-b last:border-0 border-zinc-800/30 text-left group"><div className="flex-1"><div className="text-xs font-bold text-zinc-100 group-hover:text-indigo-400">{s.name}</div><div className="text-[10px] font-mono text-zinc-600 mt-1">P:{s.macros?.protein}g C:{s.macros?.carbs}g F:{s.macros?.fats}g</div></div><div className="text-xs font-black text-zinc-400">{s.macros?.calories} KCAL</div></button>))}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MealTracker;