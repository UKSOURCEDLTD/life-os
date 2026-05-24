import React, { useEffect, useState } from 'react';
import { roundTo2 } from '../utils/storage';

interface NutritionalTargetEditorProps {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  onSave: (c: number, p: number, cb: number, f: number) => void;
  title?: string;
}

const NutritionalTargetEditor: React.FC<NutritionalTargetEditorProps> = ({ 
  calories, protein, carbs, fats, onSave, title = "Daily Targets" 
}) => {
  const [localCals, setLocalCals] = useState(calories);
  const [localP, setLocalP] = useState(protein);
  const [localC, setLocalC] = useState(carbs);
  const [localF, setLocalF] = useState(fats);

  // Calculate percentages
  const totalKcal = (localP * 4) + (localC * 4) + (localF * 9);
  const pPct = roundTo2(((localP * 4) / (totalKcal || 1)) * 100);
  const cPct = roundTo2(((localC * 4) / (totalKcal || 1)) * 100);
  const fPct = roundTo2(100 - pPct - cPct);

  useEffect(() => {
    setLocalCals(calories);
    setLocalP(protein);
    setLocalC(carbs);
    setLocalF(fats);
  }, [calories, protein, carbs, fats]);

  const updateByCals = (newCals: number) => {
    const pGrams = roundTo2((newCals * (pPct / 100)) / 4);
    const cGrams = roundTo2((newCals * (cPct / 100)) / 4);
    const fGrams = roundTo2((newCals * (fPct / 100)) / 9);
    setLocalCals(newCals);
    setLocalP(pGrams);
    setLocalC(cGrams);
    setLocalF(fGrams);
    onSave(newCals, pGrams, cGrams, fGrams);
  };

  const updateByGrams = (p: number, c: number, f: number) => {
    const newCals = roundTo2((p * 4) + (c * 4) + (f * 9));
    setLocalCals(newCals);
    setLocalP(p);
    setLocalC(c);
    setLocalF(f);
    onSave(newCals, p, c, f);
  };

  const updateRatio = (type: 'P' | 'C' | 'F', val: number) => {
    let newP = pPct, newC = cPct, newF = fPct;
    if (type === 'P') {
      newP = val;
      const remaining = 100 - newP;
      const ratio = newC / (newC + newF || 1);
      newC = roundTo2(remaining * ratio);
      newF = roundTo2(100 - newP - newC);
    } else if (type === 'C') {
      newC = val;
      const remaining = 100 - newC;
      const ratio = newP / (newP + newF || 1);
      newP = roundTo2(remaining * ratio);
      newF = roundTo2(100 - newP - newC);
    } else {
      newF = val;
      const remaining = 100 - newF;
      const ratio = newP / (newP + newC || 1);
      newP = roundTo2(remaining * ratio);
      newC = roundTo2(100 - newP - newF);
    }

    const pGrams = roundTo2((localCals * (newP / 100)) / 4);
    const cGrams = roundTo2((localCals * (newC / 100)) / 4);
    const fGrams = roundTo2((localCals * (newF / 100)) / 9);
    setLocalP(pGrams);
    setLocalC(cGrams);
    setLocalF(fGrams);
    onSave(localCals, pGrams, cGrams, fGrams);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">{title}</h4>
        <div className="text-xl font-bold text-indigo-400 tabular-nums">{localCals} <span className="text-[10px] text-zinc-600">KCAL</span></div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="group">
          <label className="text-[9px] font-black uppercase text-zinc-600 block mb-2 group-hover:text-zinc-400 transition-colors">Target Energy Baseline</label>
          <input 
            type="range" min="1000" max="5000" step="50"
            value={localCals}
            onChange={(e) => updateByCals(Number(e.target.value))}
            className="w-full h-2 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-indigo-500 active:scale-[1.01] transition-transform"
          />
        </div>

        <div className="grid grid-cols-3 gap-4 pt-2">
           <div className="space-y-3">
              <label className="text-[9px] font-black uppercase text-indigo-400/80 block">Protein {pPct}%</label>
              <input 
                type="range" min="0" max="100"
                value={pPct}
                onChange={(e) => updateRatio('P', Number(e.target.value))}
                className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex items-center gap-1">
                <input type="number" step="0.1" value={localP || ''} 
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => updateByGrams(e.target.value === '' ? 0 : Number(e.target.value), localC, localF)} 
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-2 text-xs text-center font-bold focus:border-indigo-500 focus:outline-none" />
                <span className="text-[9px] text-zinc-600 font-bold">G</span>
              </div>
           </div>
           <div className="space-y-3">
              <label className="text-[9px] font-black uppercase text-emerald-400/80 block">Carbs {cPct}%</label>
              <input 
                type="range" min="0" max="100"
                value={cPct}
                onChange={(e) => updateRatio('C', Number(e.target.value))}
                className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex items-center gap-1">
                <input type="number" step="0.1" value={localC || ''} 
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => updateByGrams(localP, e.target.value === '' ? 0 : Number(e.target.value), localF)} 
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-2 text-xs text-center font-bold focus:border-emerald-500 focus:outline-none" />
                <span className="text-[9px] text-zinc-600 font-bold">G</span>
              </div>
           </div>
           <div className="space-y-3">
              <label className="text-[9px] font-black uppercase text-amber-400/80 block">Fats {fPct}%</label>
              <input 
                type="range" min="0" max="100"
                value={fPct}
                onChange={(e) => updateRatio('F', Number(e.target.value))}
                className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex items-center gap-1">
                <input type="number" step="0.1" value={localF || ''} 
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => updateByGrams(localP, localC, e.target.value === '' ? 0 : Number(e.target.value))} 
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-2 text-xs text-center font-bold focus:border-amber-500 focus:outline-none" />
                <span className="text-[9px] text-zinc-600 font-bold">G</span>
              </div>
           </div>
        </div>
      </div>
      
      <div className="flex h-3 w-full rounded-full overflow-hidden bg-zinc-900 shadow-inner border border-zinc-800">
        <div style={{ width: `${pPct}%` }} className="bg-indigo-500 h-full transition-all duration-700 shadow-[0_0_15px_rgba(99,102,241,0.3)]" />
        <div style={{ width: `${cPct}%` }} className="bg-emerald-500 h-full transition-all duration-700 shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
        <div style={{ width: `${fPct}%` }} className="bg-amber-500 h-full transition-all duration-700 shadow-[0_0_15px_rgba(245,158,11,0.3)]" />
      </div>
    </div>
  );
};

export default NutritionalTargetEditor;