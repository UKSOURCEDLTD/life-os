import React, { useState, useEffect, useRef } from 'react';
import { Meal, Ingredient } from '../types';
import { analyzeMealNutrition, getIngredientSuggestions } from '../services/geminiService';
import { roundTo2 } from '../utils/storage';

interface MealDetailModalProps {
  meal: Meal;
  onClose: () => void;
  onUpdate: (updatedMeal: Meal) => void;
}

const MealDetailModal: React.FC<MealDetailModalProps> = ({ meal, onClose, onUpdate }) => {
  const [mealName, setMealName] = useState(meal.name);
  const [ingredients, setIngredients] = useState<Ingredient[]>(meal.ingredients || []);
  const [newIngredient, setNewIngredient] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Ingredient[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (newIngredient.trim().length >= 2) {
        setIsFetchingSuggestions(true);
        const results = await getIngredientSuggestions(newIngredient.trim());
        setSuggestions(results);
        setIsFetchingSuggestions(false);
      } else {
        setSuggestions([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [newIngredient]);

  const handleAddIngredient = async (overrideIngredient?: Ingredient) => {
    if (overrideIngredient) {
      setIngredients([...ingredients, overrideIngredient]);
      setNewIngredient('');
      setSuggestions([]);
      inputRef.current?.focus();
      return;
    }

    if (newIngredient.trim()) {
      const rawName = newIngredient.trim();
      // Optimistic add
      const tempItem: Ingredient = { name: rawName };
      setIngredients(prev => [...prev, tempItem]);
      setNewIngredient('');
      setSuggestions([]);

      // Auto-analyze specific new item
      setIsAnalyzing(true);
      const results = await analyzeMealNutrition([rawName]);
      if (results.length > 0) {
        setIngredients(prev => 
          prev.map(item => item === tempItem ? results[0] : item)
        );
      }
      setIsAnalyzing(false);
      inputRef.current?.focus();
    }
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleAnalyzeAll = async () => {
    if (ingredients.length === 0) return;
    setIsAnalyzing(true);
    const names = ingredients.map(i => i.name);
    const results = await analyzeMealNutrition(names);
    if (results.length > 0) setIngredients(results);
    setIsAnalyzing(false);
  };

  const handleSave = () => {
    onUpdate({ ...meal, name: mealName, ingredients });
    onClose();
  };

  const rawMacros = ingredients.reduce((acc, curr) => {
    if (!curr.macros) return acc;
    return {
      calories: acc.calories + curr.macros.calories,
      protein: acc.protein + curr.macros.protein,
      carbs: acc.carbs + curr.macros.carbs,
      fats: acc.fats + curr.macros.fats,
    };
  }, { calories: 0, protein: 0, carbs: 0, fats: 0 });

  const totalMacros = {
    calories: roundTo2(rawMacros.calories),
    protein: roundTo2(rawMacros.protein),
    carbs: roundTo2(rawMacros.carbs),
    fats: roundTo2(rawMacros.fats)
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-zinc-950/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="w-full max-w-2xl glass h-[94vh] sm:h-auto sm:max-h-[90vh] rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl border border-zinc-800 overflow-hidden flex flex-col relative">
        
        {/* Handle for mobile visual cue */}
        <div className="sm:hidden w-12 h-1 bg-zinc-800 rounded-full mx-auto mt-4 mb-2 shrink-0" />

        <div className="p-6 lg:p-8 border-b border-zinc-800 flex justify-between items-start gap-4 bg-zinc-900/50">
          <div className="flex-1">
            <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-1">Editor</h3>
            <input type="text" value={mealName} onChange={(e) => setMealName(e.target.value)}
              className="w-full bg-transparent text-xl lg:text-3xl font-bold text-zinc-100 focus:outline-none placeholder-zinc-800" placeholder="Label..." />
          </div>
          <button onClick={onClose} className="p-3 text-zinc-500 hover:text-white transition-all bg-zinc-950/50 rounded-2xl border border-zinc-800 active:scale-90">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8 lg:space-y-10 custom-scrollbar">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Macros</h4>
              <span className="text-sm font-mono text-indigo-400 font-bold tracking-tighter">{totalMacros.calories} KCAL</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[ {l:'Pro', v:totalMacros.protein, c:'text-indigo-400'}, {l:'Car', v:totalMacros.carbs, c:'text-emerald-400'}, {l:'Fat', v:totalMacros.fats, c:'text-amber-400'} ].map(macro => (
                <div key={macro.l} className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800/50 text-center">
                  <div className={`text-[9px] font-black ${macro.c} uppercase mb-1`}>{macro.l}</div>
                  <div className="text-lg font-black">{macro.v}g</div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Ingredients</h4>
            <div className="space-y-2">
              {ingredients.map((ing, i) => (
                <div key={i} className="flex items-center gap-4 bg-zinc-900/30 border border-zinc-800/30 p-4 rounded-2xl group transition-all">
                  <div className="flex-1">
                    <div className="text-sm font-bold text-zinc-100">{ing.name}</div>
                    {ing.macros && (
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                        <span className="text-[10px] text-indigo-400 font-bold uppercase">P:{roundTo2(ing.macros.protein)}g</span>
                        <span className="text-[10px] text-emerald-400 font-bold uppercase">C:{roundTo2(ing.macros.carbs)}g</span>
                        <span className="text-[10px] text-amber-400 font-bold uppercase">F:{roundTo2(ing.macros.fats)}g</span>
                        <span className="text-[10px] text-zinc-600 font-bold ml-auto uppercase">{roundTo2(ing.macros.calories)} kcal</span>
                      </div>
                    )}
                  </div>
                  <button onClick={() => handleRemoveIngredient(i)} className="text-zinc-700 hover:text-red-400 p-2 active:scale-90">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
            </div>
            
            <div className="relative pt-4">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input 
                    ref={inputRef}
                    type="text" 
                    value={newIngredient} 
                    onChange={(e) => setNewIngredient(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && handleAddIngredient()}
                    placeholder="E.g. 200g Rice..." 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-1 focus:ring-indigo-500 placeholder-zinc-800" 
                  />
                  {isFetchingSuggestions && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <button onClick={() => handleAddIngredient()} className="bg-zinc-100 text-zinc-950 px-5 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95">Add</button>
              </div>

              {suggestions.length > 0 && (
                <div className="absolute bottom-full left-0 right-0 mb-4 glass border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <div className="p-3 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-900/50">
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 px-2">Suggestions</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {suggestions.map((s, idx) => (
                      <button 
                        key={idx} 
                        onClick={() => handleAddIngredient(s)}
                        className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors border-b last:border-0 border-zinc-800/30 text-left group"
                      >
                        <div className="flex-1">
                          <div className="text-xs font-bold text-zinc-100 group-hover:text-indigo-400 transition-colors">{s.name}</div>
                          <div className="flex gap-2 mt-1 text-[10px] font-mono text-zinc-500">
                            <span>P:{s.macros?.protein}g</span>
                            <span>C:{s.macros?.carbs}g</span>
                            <span>F:{s.macros?.fats}g</span>
                          </div>
                        </div>
                        <div className="text-[10px] font-black text-zinc-400">{s.macros?.calories} kcal</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          <button onClick={handleAnalyzeAll} disabled={isAnalyzing || ingredients.length === 0}
            className="w-full flex items-center justify-center gap-3 bg-zinc-900 border border-zinc-800 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-30 transition-all">
            {isAnalyzing ? <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /> : "Re-Sync All Macros"}
          </button>
        </div>

        <div className="p-6 lg:p-8 border-t border-zinc-800 bg-zinc-950/80 backdrop-blur-md flex gap-4 pb-safe-bottom">
          <button onClick={handleSave} className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-500 active:scale-95 shadow-xl transition-all">Commit Changes</button>
        </div>
      </div>
    </div>
  );
};

export default MealDetailModal;