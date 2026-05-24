import React, { useState } from 'react';
import { MealLibraryItem, Meal, Ingredient } from '../types';
import { roundTo2 } from '../utils/storage';

interface Props {
  library: MealLibraryItem[];
  onUpdateLibrary: (library: MealLibraryItem[]) => void;
  onAddToToday?: (meal: Omit<Meal, 'id'>) => void;
}

const computeTotals = (ingredients: Ingredient[]) => {
  return ingredients.reduce((acc, i) => {
    if (i.macros) {
      acc.calories += i.macros.calories;
      acc.protein += i.macros.protein;
      acc.carbs += i.macros.carbs;
      acc.fats += i.macros.fats;
    }
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fats: 0 });
};

const MealLibraryView: React.FC<Props> = ({ library, onUpdateLibrary, onAddToToday }) => {
  const [filter, setFilter] = useState<'all' | 'favorites' | 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'>('all');
  const [editing, setEditing] = useState<MealLibraryItem | null>(null);
  const [showNew, setShowNew] = useState(false);

  const filtered = library.filter(m => {
    if (filter === 'all') return true;
    if (filter === 'favorites') return m.isFavorite;
    return m.type === filter;
  });

  const toggleFavorite = (id: string) => {
    onUpdateLibrary(library.map(m => m.id === id ? { ...m, isFavorite: !m.isFavorite } : m));
  };

  const deleteMeal = (id: string) => {
    onUpdateLibrary(library.filter(m => m.id !== id));
  };

  const addNew = (item: Omit<MealLibraryItem, 'id' | 'createdAt'>) => {
    onUpdateLibrary([...library, { ...item, id: `lib-${Date.now()}`, createdAt: new Date().toISOString() }]);
    setShowNew(false);
  };

  const updateItem = (updated: MealLibraryItem) => {
    onUpdateLibrary(library.map(m => m.id === updated.id ? updated : m));
    setEditing(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h3 className="text-[10px] font-black uppercase text-zinc-600 mb-2">Nutritional Catalog</h3>
          <h2 className="text-3xl lg:text-5xl font-bold uppercase text-white">Meal Library</h2>
          <p className="text-[10px] font-bold text-zinc-500 uppercase mt-2 tracking-widest">{library.length} meals · {library.filter(m=>m.isFavorite).length} favorites</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-indigo-500/20"
        >+ New Meal</button>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {(['all', 'favorites', 'Breakfast', 'Lunch', 'Dinner', 'Snack'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
              filter === f ? 'bg-indigo-500 text-zinc-950' : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300 border border-zinc-800'
            }`}
          >{f}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(m => {
          const totals = computeTotals(m.ingredients);
          return (
            <div key={m.id} className="glass p-5 rounded-2xl border border-zinc-800/50 hover:border-zinc-700 transition-all">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="text-[9px] font-black uppercase text-zinc-600 tracking-widest mb-1">{m.type}</div>
                  <h4 className="font-bold text-white text-base leading-tight">{m.name}</h4>
                </div>
                <button onClick={() => toggleFavorite(m.id)} className="text-2xl transition-all active:scale-90">
                  <span className={m.isFavorite ? 'text-amber-400' : 'text-zinc-700'}>★</span>
                </button>
              </div>

              <div className="grid grid-cols-4 gap-1 mb-4 bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-800/50">
                <div className="text-center">
                  <div className="text-[8px] font-black text-zinc-600 uppercase">Cal</div>
                  <div className="text-sm font-bold text-white">{Math.round(totals.calories)}</div>
                </div>
                <div className="text-center">
                  <div className="text-[8px] font-black text-zinc-600 uppercase">P</div>
                  <div className="text-sm font-bold text-indigo-400">{Math.round(totals.protein)}g</div>
                </div>
                <div className="text-center">
                  <div className="text-[8px] font-black text-zinc-600 uppercase">C</div>
                  <div className="text-sm font-bold text-emerald-400">{Math.round(totals.carbs)}g</div>
                </div>
                <div className="text-center">
                  <div className="text-[8px] font-black text-zinc-600 uppercase">F</div>
                  <div className="text-sm font-bold text-amber-400">{Math.round(totals.fats)}g</div>
                </div>
              </div>

              <div className="space-y-1 mb-3 max-h-24 overflow-y-auto">
                {m.ingredients.map((i, ix) => (
                  <div key={ix} className="text-[10px] text-zinc-500 truncate">• {i.name}</div>
                ))}
              </div>

              <div className="flex gap-2">
                {onAddToToday && (
                  <button
                    onClick={() => onAddToToday({ name: m.name, type: m.type, ingredients: m.ingredients, completed: false, fromLibraryId: m.id })}
                    className="flex-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/20 active:scale-95 transition-all"
                  >+ Today</button>
                )}
                <button
                  onClick={() => setEditing(m)}
                  className="bg-zinc-900 border border-zinc-800 text-zinc-400 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:text-white active:scale-95 transition-all"
                >Edit</button>
                <button
                  onClick={() => deleteMeal(m.id)}
                  className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 active:scale-95 transition-all"
                >×</button>
              </div>
            </div>
          );
        })}
      </div>

      {(showNew || editing) && (
        <MealEditor
          initial={editing}
          onSave={(item) => editing ? updateItem({ ...editing, ...item }) : addNew(item)}
          onCancel={() => { setShowNew(false); setEditing(null); }}
        />
      )}
    </div>
  );
};

interface EditorProps {
  initial: MealLibraryItem | null;
  onSave: (item: Omit<MealLibraryItem, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

const MealEditor: React.FC<EditorProps> = ({ initial, onSave, onCancel }) => {
  const [name, setName] = useState(initial?.name || '');
  const [type, setType] = useState<MealLibraryItem['type']>(initial?.type || 'Lunch');
  const [isFavorite, setIsFavorite] = useState(initial?.isFavorite || false);
  const [tags, setTags] = useState(initial?.tags.join(', ') || '');
  const [ingredients, setIngredients] = useState<Ingredient[]>(initial?.ingredients || [{ name: '', macros: { calories: 0, protein: 0, carbs: 0, fats: 0 } }]);

  const updateIng = (ix: number, patch: Partial<Ingredient>) => {
    setIngredients(prev => prev.map((i, idx) => idx === ix ? { ...i, ...patch, macros: { ...i.macros, ...patch.macros } as any } : i));
  };
  const updateMacro = (ix: number, k: keyof typeof ingredients[0]['macros'], v: number) => {
    setIngredients(prev => prev.map((i, idx) => idx === ix ? { ...i, macros: { ...(i.macros || { calories: 0, protein: 0, carbs: 0, fats: 0 }), [k]: v } } : i));
  };

  const totals = computeTotals(ingredients);

  return (
    <div className="fixed inset-0 z-[200] bg-zinc-950/90 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto" onClick={onCancel}>
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 my-8" onClick={e => e.stopPropagation()}>
        <h3 className="text-[10px] font-black uppercase text-zinc-600 tracking-widest mb-1">{initial ? 'Edit' : 'New'} Meal</h3>
        <div className="flex gap-3 mb-6">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Meal name" className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-lg font-bold text-white" />
          <select value={type} onChange={e => setType(e.target.value as any)} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold text-white">
            <option>Breakfast</option><option>Lunch</option><option>Dinner</option><option>Snack</option>
          </select>
        </div>

        <input value={tags} onChange={e => setTags(e.target.value)} placeholder="Tags (comma separated)" className="w-full mb-4 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-300" />

        <label className="flex items-center gap-3 mb-4 cursor-pointer">
          <input type="checkbox" checked={isFavorite} onChange={e => setIsFavorite(e.target.checked)} className="w-4 h-4 rounded" />
          <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Favorite</span>
        </label>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">Ingredients</h4>
            <button onClick={() => setIngredients([...ingredients, { name: '', macros: { calories: 0, protein: 0, carbs: 0, fats: 0 } }])}
              className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">+ Add</button>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {ingredients.map((ing, ix) => (
              <div key={ix} className="grid grid-cols-12 gap-1.5 items-center">
                <input value={ing.name} onChange={e => updateIng(ix, { name: e.target.value })} placeholder="Name" className="col-span-12 sm:col-span-4 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-white" />
                <input type="number" value={ing.macros?.calories || ''} onChange={e => updateMacro(ix, 'calories', Number(e.target.value))} placeholder="kcal" className="col-span-3 sm:col-span-2 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-white" />
                <input type="number" value={ing.macros?.protein || ''} onChange={e => updateMacro(ix, 'protein', Number(e.target.value))} placeholder="P" className="col-span-3 sm:col-span-2 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-indigo-400" />
                <input type="number" value={ing.macros?.carbs || ''} onChange={e => updateMacro(ix, 'carbs', Number(e.target.value))} placeholder="C" className="col-span-3 sm:col-span-2 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-emerald-400" />
                <input type="number" value={ing.macros?.fats || ''} onChange={e => updateMacro(ix, 'fats', Number(e.target.value))} placeholder="F" className="col-span-2 sm:col-span-1 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-amber-400" />
                <button onClick={() => setIngredients(ingredients.filter((_, i) => i !== ix))} className="col-span-1 text-red-400 text-sm">×</button>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-6 bg-zinc-900/50 p-3 rounded-xl border border-zinc-800">
          <div className="text-center"><div className="text-[8px] font-black text-zinc-600 uppercase">Total Cal</div><div className="text-base font-bold text-white">{Math.round(totals.calories)}</div></div>
          <div className="text-center"><div className="text-[8px] font-black text-zinc-600 uppercase">Protein</div><div className="text-base font-bold text-indigo-400">{Math.round(totals.protein)}g</div></div>
          <div className="text-center"><div className="text-[8px] font-black text-zinc-600 uppercase">Carbs</div><div className="text-base font-bold text-emerald-400">{Math.round(totals.carbs)}g</div></div>
          <div className="text-center"><div className="text-[8px] font-black text-zinc-600 uppercase">Fats</div><div className="text-base font-bold text-amber-400">{Math.round(totals.fats)}g</div></div>
        </div>

        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 bg-zinc-900 border border-zinc-800 text-zinc-400 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest">Cancel</button>
          <button
            onClick={() => name && onSave({ name, type, isFavorite, tags: tags.split(',').map(t => t.trim()).filter(Boolean), ingredients })}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest"
          >{initial ? 'Save' : 'Create'}</button>
        </div>
      </div>
    </div>
  );
};

export default MealLibraryView;
