import React, { useRef, useState } from 'react';
import { AppState } from '../types';
import { supabaseEnabled } from '../utils/supabase';

interface Props {
  state: AppState;
  onImport: (state: AppState) => void;
  onReset: () => void;
  onRestartOnboarding: () => void;
}

const DataManagement: React.FC<Props> = ({ state, onImport, onReset, onRestartOnboarding }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `life-os-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (parsed.logs && parsed.userProfile) {
          onImport(parsed);
          alert('Backup restored.');
        } else {
          alert('Invalid backup file.');
        }
      } catch {
        alert('Could not parse backup file.');
      }
    };
    reader.readAsText(file);
  };

  const sizeKB = Math.round(JSON.stringify(state).length / 1024);

  return (
    <div className="space-y-6">
      <div className="glass p-6 rounded-3xl border border-zinc-800">
        <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 border-b border-zinc-900 pb-3">Cloud Sync Status</h4>
        {supabaseEnabled ? (
          <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <div className="text-sm font-bold text-emerald-400">Supabase connected — data syncs across devices</div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl mb-3">
              <div className="w-2 h-2 bg-amber-400 rounded-full" />
              <div className="text-sm font-bold text-amber-400">Local-only — data lives in this browser</div>
            </div>
            <details className="text-xs text-zinc-400">
              <summary className="cursor-pointer text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-300">How to enable cloud sync →</summary>
              <ol className="mt-3 space-y-2 pl-4 list-decimal text-zinc-400">
                <li>Sign up free at <span className="text-indigo-400 font-mono text-[11px]">supabase.com</span></li>
                <li>Create a new project (any region near you)</li>
                <li>Go to SQL Editor → run this:
                  <pre className="mt-1 p-2 bg-zinc-950 border border-zinc-800 rounded text-[10px] text-zinc-300 overflow-x-auto">{`create table public.life_os_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload text not null,
  updated_at timestamptz not null default now()
);
alter table public.life_os_state enable row level security;
create policy "own state read" on public.life_os_state for select using (auth.uid() = user_id);
create policy "own state write" on public.life_os_state for insert with check (auth.uid() = user_id);
create policy "own state update" on public.life_os_state for update using (auth.uid() = user_id);`}</pre>
                </li>
                <li>Settings → API → copy <span className="text-indigo-400 font-mono">Project URL</span> + <span className="text-indigo-400 font-mono">anon key</span></li>
                <li>Add to <span className="text-indigo-400 font-mono">.env</span>: <pre className="mt-1 p-2 bg-zinc-950 border border-zinc-800 rounded text-[10px] text-zinc-300">{`VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...`}</pre></li>
                <li>Restart dev server / redeploy to Vercel with the env vars</li>
              </ol>
            </details>
          </div>
        )}
      </div>

      <div className="glass p-6 rounded-3xl border border-zinc-800">
        <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 border-b border-zinc-900 pb-3">Data Backup</h4>
        <div className="flex justify-between items-center mb-4 text-xs text-zinc-500">
          <span>{Object.keys(state.logs).length} day logs · {state.wealth.trades.length} trades · {state.mealLibrary.length} library meals</span>
          <span className="tabular-nums">{sizeKB} KB</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={exportData} className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/20 active:scale-95 transition-all">
            ⬇ Export JSON
          </button>
          <button onClick={() => fileRef.current?.click()} className="bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500/20 active:scale-95 transition-all">
            ⬆ Import JSON
          </button>
        </div>
        <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importData(f); e.target.value = ''; }} />
        <p className="text-[10px] text-zinc-600 mt-3">Tip: Export weekly. Keep backups in iCloud Drive / Google Drive.</p>
      </div>

      <div className="glass p-6 rounded-3xl border border-zinc-800">
        <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 border-b border-zinc-900 pb-3">Setup</h4>
        <button onClick={onRestartOnboarding} className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-indigo-500/50 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest mb-3 active:scale-95 transition-all">
          ↻ Re-run Onboarding
        </button>
        <p className="text-[10px] text-zinc-600">Restart the setup wizard to update your defaults — doesn't delete your logs.</p>
      </div>

      <div className="glass p-6 rounded-3xl border border-red-500/20">
        <h4 className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-4 border-b border-zinc-900 pb-3">Danger Zone</h4>
        {!confirmReset ? (
          <button onClick={() => setConfirmReset(true)} className="w-full bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20">
            Reset All Data
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-red-300 font-bold">This will delete everything. Export a backup first.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmReset(false)} className="flex-1 bg-zinc-900 border border-zinc-800 text-zinc-400 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest">Cancel</button>
              <button onClick={() => { onReset(); setConfirmReset(false); }} className="flex-1 bg-red-500 text-zinc-950 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest">Yes, delete everything</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataManagement;
