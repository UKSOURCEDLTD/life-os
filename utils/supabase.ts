import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppState } from '../types';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseEnabled = !!(url && anonKey);

let _client: SupabaseClient | null = null;
export const getSupabase = (): SupabaseClient | null => {
  if (!supabaseEnabled) return null;
  if (!_client) _client = createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true } });
  return _client;
};

export async function loadStateFromCloud(userId: string): Promise<AppState | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.from('life_os_state').select('payload').eq('user_id', userId).maybeSingle();
  if (error || !data) return null;
  try { return JSON.parse(data.payload); } catch { return null; }
}

export async function saveStateToCloud(userId: string, state: AppState): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from('life_os_state').upsert({
    user_id: userId,
    payload: JSON.stringify(state),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
}

export async function signIn(email: string, password: string) {
  const sb = getSupabase();
  if (!sb) return { error: 'Supabase not configured' };
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  return error ? { error: error.message } : { user: data.user };
}

export async function signUp(email: string, password: string, name: string) {
  const sb = getSupabase();
  if (!sb) return { error: 'Supabase not configured' };
  const { data, error } = await sb.auth.signUp({ email, password, options: { data: { name } } });
  return error ? { error: error.message } : { user: data.user };
}

export async function signOut() {
  const sb = getSupabase();
  if (!sb) return;
  await sb.auth.signOut();
}

export async function getCurrentUser() {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getUser();
  return data.user;
}

export const SUPABASE_SCHEMA_SQL = `
-- Run this in Supabase SQL Editor once to set up Life OS:
create table if not exists public.life_os_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload text not null,
  updated_at timestamptz not null default now()
);

alter table public.life_os_state enable row level security;

create policy "Users can read their own state"
  on public.life_os_state for select
  using (auth.uid() = user_id);

create policy "Users can insert their own state"
  on public.life_os_state for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own state"
  on public.life_os_state for update
  using (auth.uid() = user_id);
`;
