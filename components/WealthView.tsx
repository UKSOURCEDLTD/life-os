import React, { useState, useMemo } from 'react';
import { WealthData, FinanceEntry, SavingsGoal, Trade, RecurringTransaction, Asset, Liability } from '../types';
import { roundTo2 } from '../utils/storage';
import { computeNetWorth, computeTradeStats, computeTaxEstimate, expandRecurringForMonth } from '../utils/aggregations';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine } from 'recharts';

interface Props {
  wealth: WealthData;
  onUpdate: (wealth: WealthData) => void;
}

type Tab = 'overview' | 'networth' | 'transactions' | 'recurring' | 'trading' | 'savings' | 'tax';

const EXPENSE_CATEGORIES = ['Rent', 'IVA', 'Food', 'Transport', 'Subscriptions', 'Phone', 'Gym', 'Coach', 'Supplements', 'Entertainment', 'Other'];
const INCOME_CATEGORIES = ['Salary', 'UK Sourced', 'Quantum Flow', 'Trading', 'Other'];

const WealthView: React.FC<Props> = ({ wealth, onUpdate }) => {
  const [tab, setTab] = useState<Tab>('overview');

  const currentMonth = new Date().toISOString().slice(0, 7);
  const recurringForMonth = useMemo(() => expandRecurringForMonth(wealth.recurringTransactions, `${currentMonth}-01`), [wealth.recurringTransactions, currentMonth]);

  const allMonthEntries = useMemo(() => [
    ...wealth.financeEntries.filter(e => e.date.startsWith(currentMonth)),
    ...recurringForMonth.filter(e => e.date <= new Date().toISOString().split('T')[0]),
  ], [wealth.financeEntries, recurringForMonth, currentMonth]);

  const totalIncome = allMonthEntries.filter(e => e.type === 'income').reduce((a, e) => a + e.amount, 0);
  const totalExpenses = allMonthEntries.filter(e => e.type === 'expense').reduce((a, e) => a + e.amount, 0);
  const netSurplus = totalIncome - totalExpenses;
  const netWorth = computeNetWorth(wealth);
  const tradeStats = computeTradeStats(wealth.trades);
  const taxEstimate = computeTaxEstimate(wealth);

  const todayStr = new Date().toISOString().split('T')[0];
  const tradesToday = wealth.trades.filter(t => t.date === todayStr);
  const riskedToday = tradesToday.reduce((s, t) => s + (t.outcome === 'open' || t.outcome === 'loss' ? t.riskAmount : 0), 0);
  const remainingRisk = Math.max(0, wealth.tradingRules.maxRiskPerDay - riskedToday);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h3 className="text-[10px] font-black uppercase text-zinc-600 mb-2">Financial Engine</h3>
          <h2 className="text-3xl lg:text-5xl font-bold uppercase text-white">Wealth</h2>
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['overview', 'networth', 'transactions', 'recurring', 'trading', 'savings', 'tax'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${tab === t ? 'bg-indigo-500 text-zinc-950' : 'bg-zinc-900 text-zinc-500 border border-zinc-800 hover:text-zinc-300'}`}>
              {t === 'networth' ? 'Net Worth' : t}
            </button>
          ))}
        </div>
      </header>

      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3">
            <StatCard label="Net Worth" value={`£${netWorth.net.toLocaleString()}`} sub={`${netWorth.assets.toLocaleString()} - ${netWorth.liabilities.toLocaleString()}`} color={netWorth.net >= 0 ? 'text-emerald-400' : 'text-red-400'} />
            <StatCard label="Income MTD" value={`£${Math.round(totalIncome).toLocaleString()}`} color="text-emerald-400" />
            <StatCard label="Spend MTD" value={`£${Math.round(totalExpenses).toLocaleString()}`} color="text-red-400" />
            <StatCard label="Surplus" value={`${netSurplus >= 0 ? '+' : ''}£${Math.round(netSurplus).toLocaleString()}`} color={netSurplus > 0 ? 'text-emerald-400' : 'text-red-400'} />
            <StatCard label="Trade P/L" value={`${tradeStats.totalPnl >= 0 ? '+' : ''}$${tradeStats.totalPnl}`} sub={`${tradeStats.winRate}% WR`} color={tradeStats.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass p-6 rounded-3xl border border-zinc-800">
              <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 border-b border-zinc-900 pb-3">Spend Breakdown</h4>
              {(() => {
                const byCategory = allMonthEntries.filter(e => e.type === 'expense').reduce((acc, e) => {
                  acc[e.category] = (acc[e.category] || 0) + e.amount;
                  return acc;
                }, {} as Record<string, number>);
                const cats = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
                if (cats.length === 0) return <div className="text-center py-8 text-[10px] font-black text-zinc-700 uppercase tracking-widest">No expenses logged</div>;
                const max = cats[0][1];
                return (
                  <div className="space-y-2">
                    {cats.map(([cat, amt]) => (
                      <div key={cat}>
                        <div className="flex justify-between text-xs mb-1"><span className="font-bold text-zinc-300">{cat}</span><span className="text-zinc-500 tabular-nums">£{Math.round(amt)}</span></div>
                        <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden"><div className="h-full bg-red-500/70" style={{ width: `${(amt / max) * 100}%` }} /></div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div className="glass p-6 rounded-3xl border border-zinc-800">
              <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 border-b border-zinc-900 pb-3">Savings Progress</h4>
              <div className="space-y-4">
                {wealth.savingsGoals.map(g => {
                  const pct = Math.min(100, (g.currentAmount / g.targetAmount) * 100);
                  const monthsLeft = Math.max(0, Math.ceil((new Date(g.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)));
                  return (
                    <div key={g.id}>
                      <div className="flex justify-between items-end mb-1">
                        <div><div className="font-bold text-white text-sm">{g.name}</div><div className="text-[9px] font-black text-zinc-600 uppercase">{monthsLeft} months left</div></div>
                        <div className="text-right"><div className="font-bold text-white tabular-nums">£{g.currentAmount} / £{g.targetAmount}</div><div className="text-[9px] font-black text-zinc-600">{Math.round(pct)}%</div></div>
                      </div>
                      <div className="h-2 bg-zinc-900 rounded-full overflow-hidden"><div className={`h-full ${g.color} transition-all duration-700`} style={{ width: `${pct}%` }} /></div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'networth' && <NetWorthTab wealth={wealth} onUpdate={onUpdate} netWorth={netWorth} />}
      {tab === 'transactions' && <TransactionsTab wealth={wealth} onUpdate={onUpdate} monthEntries={allMonthEntries} />}
      {tab === 'recurring' && <RecurringTab wealth={wealth} onUpdate={onUpdate} />}
      {tab === 'trading' && <TradingTab wealth={wealth} onUpdate={onUpdate} stats={tradeStats} remainingRisk={remainingRisk} tradesToday={tradesToday} />}
      {tab === 'savings' && <SavingsTab wealth={wealth} onUpdate={onUpdate} />}
      {tab === 'tax' && <TaxTab wealth={wealth} onUpdate={onUpdate} estimate={taxEstimate} />}
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string; sub?: string; color: string }> = ({ label, value, sub, color }) => (
  <div className="glass p-4 rounded-2xl border border-zinc-800">
    <div className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{label}</div>
    <div className={`text-xl font-black ${color} tabular-nums mt-1`}>{value}</div>
    {sub && <div className="text-[8px] text-zinc-700 uppercase font-bold mt-0.5">{sub}</div>}
  </div>
);

const NetWorthTab: React.FC<{ wealth: WealthData; onUpdate: (w: WealthData) => void; netWorth: ReturnType<typeof computeNetWorth> }> = ({ wealth, onUpdate, netWorth }) => {
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [showAddLiab, setShowAddLiab] = useState(false);
  const [newAsset, setNewAsset] = useState<Partial<Asset>>({ type: 'cash', value: 0 });
  const [newLiab, setNewLiab] = useState<Partial<Liability>>({ type: 'credit', balance: 0, monthlyPayment: 0 });

  const updateAsset = (id: string, value: number) => {
    onUpdate({ ...wealth, assets: wealth.assets.map(a => a.id === id ? { ...a, value, lastUpdated: new Date().toISOString().split('T')[0] } : a) });
  };
  const updateLiab = (id: string, balance: number) => {
    onUpdate({ ...wealth, liabilities: wealth.liabilities.map(l => l.id === id ? { ...l, balance, lastUpdated: new Date().toISOString().split('T')[0] } : l) });
  };

  const snapshot = () => {
    onUpdate({
      ...wealth,
      netWorthHistory: [...wealth.netWorthHistory, { date: new Date().toISOString().split('T')[0], ...netWorth }],
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Assets" value={`£${netWorth.assets.toLocaleString()}`} color="text-emerald-400" />
        <StatCard label="Liabilities" value={`£${netWorth.liabilities.toLocaleString()}`} color="text-red-400" />
        <StatCard label="Net Worth" value={`£${netWorth.net.toLocaleString()}`} color={netWorth.net >= 0 ? 'text-white' : 'text-red-400'} />
      </div>

      {wealth.netWorthHistory.length > 1 && (
        <div className="glass p-6 rounded-3xl border border-zinc-800">
          <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 border-b border-zinc-900 pb-3">Net Worth History</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={wealth.netWorthHistory}>
                <defs><linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} /><stop offset="100%" stopColor="#6366f1" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                <XAxis dataKey="date" stroke="#3f3f46" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#3f3f46" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px', fontSize: '11px' }} />
                <Area type="monotone" dataKey="net" stroke="#6366f1" strokeWidth={2.5} fill="url(#nwGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="flex justify-end"><button onClick={snapshot} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95">📸 Save Snapshot</button></div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass p-6 rounded-3xl border border-zinc-800">
          <div className="flex justify-between items-center mb-4 border-b border-zinc-900 pb-3">
            <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Assets</h4>
            <button onClick={() => setShowAddAsset(!showAddAsset)} className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{showAddAsset ? '× Cancel' : '+ Add'}</button>
          </div>
          {showAddAsset && (
            <div className="space-y-2 mb-4 p-3 bg-zinc-900/50 rounded-xl border border-zinc-800">
              <input value={newAsset.name || ''} onChange={e => setNewAsset({ ...newAsset, name: e.target.value })} placeholder="Asset name" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white" />
              <select value={newAsset.type} onChange={e => setNewAsset({ ...newAsset, type: e.target.value as Asset['type'] })} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white">
                <option value="cash">Cash</option><option value="investment">Investment</option><option value="property">Property</option><option value="crypto">Crypto</option><option value="other">Other</option>
              </select>
              <input type="number" value={newAsset.value || ''} onChange={e => setNewAsset({ ...newAsset, value: Number(e.target.value) })} placeholder="Value (£)" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white" />
              <button onClick={() => { if (newAsset.name) { onUpdate({ ...wealth, assets: [...wealth.assets, { id: `a-${Date.now()}`, name: newAsset.name!, type: newAsset.type!, value: newAsset.value || 0, lastUpdated: new Date().toISOString().split('T')[0] }] }); setNewAsset({ type: 'cash', value: 0 }); setShowAddAsset(false); } }} className="w-full bg-emerald-500 text-zinc-950 px-3 py-2 rounded-lg text-[10px] font-black uppercase">Add Asset</button>
            </div>
          )}
          <div className="space-y-2">
            {wealth.assets.map(a => (
              <div key={a.id} className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/50 flex items-center gap-3">
                <div className="flex-1">
                  <div className="font-bold text-white text-sm">{a.name}</div>
                  <div className="text-[9px] font-black text-zinc-600 uppercase">{a.type}</div>
                </div>
                <input type="number" value={a.value} onChange={e => updateAsset(a.id, Number(e.target.value))} className="w-28 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm font-bold text-emerald-400 text-right" />
                <button onClick={() => onUpdate({ ...wealth, assets: wealth.assets.filter(x => x.id !== a.id) })} className="text-red-400 text-xs">×</button>
              </div>
            ))}
          </div>
        </div>

        <div className="glass p-6 rounded-3xl border border-zinc-800">
          <div className="flex justify-between items-center mb-4 border-b border-zinc-900 pb-3">
            <h4 className="text-[10px] font-black text-red-400 uppercase tracking-widest">Liabilities</h4>
            <button onClick={() => setShowAddLiab(!showAddLiab)} className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{showAddLiab ? '× Cancel' : '+ Add'}</button>
          </div>
          {showAddLiab && (
            <div className="space-y-2 mb-4 p-3 bg-zinc-900/50 rounded-xl border border-zinc-800">
              <input value={newLiab.name || ''} onChange={e => setNewLiab({ ...newLiab, name: e.target.value })} placeholder="Liability name" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white" />
              <select value={newLiab.type} onChange={e => setNewLiab({ ...newLiab, type: e.target.value as Liability['type'] })} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white">
                <option value="iva">IVA</option><option value="credit">Credit Card</option><option value="loan">Loan</option><option value="other">Other</option>
              </select>
              <input type="number" value={newLiab.balance || ''} onChange={e => setNewLiab({ ...newLiab, balance: Number(e.target.value) })} placeholder="Balance (£)" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white" />
              <input type="number" value={newLiab.monthlyPayment || ''} onChange={e => setNewLiab({ ...newLiab, monthlyPayment: Number(e.target.value) })} placeholder="Monthly payment (£)" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white" />
              <button onClick={() => { if (newLiab.name) { onUpdate({ ...wealth, liabilities: [...wealth.liabilities, { id: `l-${Date.now()}`, name: newLiab.name!, type: newLiab.type!, balance: newLiab.balance || 0, monthlyPayment: newLiab.monthlyPayment || 0, lastUpdated: new Date().toISOString().split('T')[0] }] }); setNewLiab({ type: 'credit', balance: 0, monthlyPayment: 0 }); setShowAddLiab(false); } }} className="w-full bg-red-500 text-zinc-950 px-3 py-2 rounded-lg text-[10px] font-black uppercase">Add Liability</button>
            </div>
          )}
          <div className="space-y-2">
            {wealth.liabilities.map(l => (
              <div key={l.id} className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/50 flex items-center gap-3">
                <div className="flex-1">
                  <div className="font-bold text-white text-sm">{l.name}</div>
                  <div className="text-[9px] font-black text-zinc-600 uppercase">{l.type} · £{l.monthlyPayment}/mo</div>
                </div>
                <input type="number" value={l.balance} onChange={e => updateLiab(l.id, Number(e.target.value))} className="w-28 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm font-bold text-red-400 text-right" />
                <button onClick={() => onUpdate({ ...wealth, liabilities: wealth.liabilities.filter(x => x.id !== l.id) })} className="text-red-400 text-xs">×</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const TransactionsTab: React.FC<{ wealth: WealthData; onUpdate: (w: WealthData) => void; monthEntries: FinanceEntry[] }> = ({ wealth, onUpdate, monthEntries }) => {
  const [show, setShow] = useState(false);
  const [entry, setEntry] = useState<Partial<FinanceEntry>>({ type: 'expense', category: 'Food', amount: 0, description: '', isRecurring: false, date: new Date().toISOString().split('T')[0] });

  const add = () => {
    if (!entry.amount) return;
    onUpdate({ ...wealth, financeEntries: [...wealth.financeEntries, { id: Date.now().toString(), date: entry.date!, type: entry.type!, category: entry.category!, description: entry.description || entry.category!, amount: entry.amount, isRecurring: false }] });
    setEntry({ type: 'expense', category: 'Food', amount: 0, description: '', isRecurring: false, date: new Date().toISOString().split('T')[0] });
    setShow(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end"><button onClick={() => setShow(!show)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest">{show ? '× Cancel' : '+ Log Transaction'}</button></div>

      {show && (
        <div className="glass p-5 rounded-2xl border border-indigo-500/30 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <select value={entry.type} onChange={e => setEntry({ ...entry, type: e.target.value as 'income' | 'expense', category: e.target.value === 'income' ? 'Salary' : 'Food' })} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white font-bold">
              <option value="expense">Expense</option><option value="income">Income</option>
            </select>
            <select value={entry.category} onChange={e => setEntry({ ...entry, category: e.target.value })} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white font-bold">
              {(entry.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <input type="number" value={entry.amount || ''} onChange={e => setEntry({ ...entry, amount: Number(e.target.value) })} placeholder="Amount" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-lg font-bold text-white" />
          <input value={entry.description} onChange={e => setEntry({ ...entry, description: e.target.value })} placeholder="Description (optional)" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white" />
          <input type="date" value={entry.date} onChange={e => setEntry({ ...entry, date: e.target.value })} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white" />
          <button onClick={add} className="w-full bg-emerald-500 text-zinc-950 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest">Save</button>
        </div>
      )}

      <div className="glass p-6 rounded-3xl border border-zinc-800">
        <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 border-b border-zinc-900 pb-3">This Month — {monthEntries.length} entries</h4>
        <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
          {monthEntries.sort((a, b) => b.date.localeCompare(a.date)).map(e => (
            <div key={e.id} className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
              <div className={`w-1 h-10 rounded-full ${e.type === 'income' ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-bold text-white text-sm">{e.description}</div>
                  {e.isRecurring && <span className="text-[8px] font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full uppercase">Recurring</span>}
                </div>
                <div className="text-[9px] font-black text-zinc-600 uppercase">{e.category} · {e.date}</div>
              </div>
              <div className={`text-lg font-black tabular-nums ${e.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>{e.type === 'income' ? '+' : '-'}£{e.amount}</div>
              {!e.isRecurring && <button onClick={() => onUpdate({ ...wealth, financeEntries: wealth.financeEntries.filter(x => x.id !== e.id) })} className="text-red-400 text-sm">×</button>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const RecurringTab: React.FC<{ wealth: WealthData; onUpdate: (w: WealthData) => void }> = ({ wealth, onUpdate }) => {
  const [show, setShow] = useState(false);
  const [r, setR] = useState<Partial<RecurringTransaction>>({ type: 'expense', frequency: 'monthly', dayOfMonth: 1, amount: 0, active: true, startDate: new Date().toISOString().split('T')[0] });

  const add = () => {
    if (!r.amount || !r.description) return;
    onUpdate({ ...wealth, recurringTransactions: [...wealth.recurringTransactions, { ...r, id: `rec-${Date.now()}` } as RecurringTransaction] });
    setR({ type: 'expense', frequency: 'monthly', dayOfMonth: 1, amount: 0, active: true, startDate: new Date().toISOString().split('T')[0] });
    setShow(false);
  };

  const toggle = (id: string) => onUpdate({ ...wealth, recurringTransactions: wealth.recurringTransactions.map(rt => rt.id === id ? { ...rt, active: !rt.active } : rt) });

  return (
    <div className="space-y-6">
      <div className="flex justify-end"><button onClick={() => setShow(!show)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest">{show ? '× Cancel' : '+ Add Recurring'}</button></div>

      {show && (
        <div className="glass p-5 rounded-2xl border border-indigo-500/30 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <select value={r.type} onChange={e => setR({ ...r, type: e.target.value as any })} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white font-bold"><option value="expense">Expense</option><option value="income">Income</option></select>
            <select value={r.frequency} onChange={e => setR({ ...r, frequency: e.target.value as any })} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white font-bold"><option value="weekly">Weekly</option><option value="biweekly">Biweekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select>
          </div>
          <input value={r.description || ''} onChange={e => setR({ ...r, description: e.target.value })} placeholder="Description" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white" />
          <input value={r.category || ''} onChange={e => setR({ ...r, category: e.target.value })} placeholder="Category" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white" />
          <input type="number" value={r.amount || ''} onChange={e => setR({ ...r, amount: Number(e.target.value) })} placeholder="Amount" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white" />
          {(r.frequency === 'monthly' || r.frequency === 'yearly') && (
            <input type="number" value={r.dayOfMonth || ''} onChange={e => setR({ ...r, dayOfMonth: Number(e.target.value) })} placeholder="Day of month (1-31)" min={1} max={31} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white" />
          )}
          {(r.frequency === 'weekly' || r.frequency === 'biweekly') && (
            <select value={r.dayOfWeek ?? ''} onChange={e => setR({ ...r, dayOfWeek: Number(e.target.value) })} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white"><option value="">Day of week</option><option value="0">Sunday</option><option value="1">Monday</option><option value="2">Tuesday</option><option value="3">Wednesday</option><option value="4">Thursday</option><option value="5">Friday</option><option value="6">Saturday</option></select>
          )}
          <button onClick={add} className="w-full bg-emerald-500 text-zinc-950 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest">Save Recurring</button>
        </div>
      )}

      <div className="space-y-2">
        {wealth.recurringTransactions.map(rt => (
          <div key={rt.id} className={`glass p-4 rounded-2xl border flex items-center gap-3 ${rt.active ? 'border-zinc-800' : 'border-zinc-900 opacity-50'}`}>
            <button onClick={() => toggle(rt.id)} className={`w-10 h-6 rounded-full transition-all ${rt.active ? 'bg-indigo-500' : 'bg-zinc-800'} relative`}><div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${rt.active ? 'left-4' : 'left-0.5'}`} /></button>
            <div className="flex-1">
              <div className="font-bold text-white text-sm">{rt.description}</div>
              <div className="text-[9px] font-black text-zinc-600 uppercase">{rt.frequency} · {rt.category}</div>
            </div>
            <div className={`text-base font-black tabular-nums ${rt.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>{rt.type === 'income' ? '+' : '-'}£{rt.amount}</div>
            <button onClick={() => onUpdate({ ...wealth, recurringTransactions: wealth.recurringTransactions.filter(x => x.id !== rt.id) })} className="text-red-400 text-sm">×</button>
          </div>
        ))}
      </div>
    </div>
  );
};

const TradingTab: React.FC<{ wealth: WealthData; onUpdate: (w: WealthData) => void; stats: ReturnType<typeof computeTradeStats>; remainingRisk: number; tradesToday: Trade[] }> = ({ wealth, onUpdate, stats, remainingRisk, tradesToday }) => {
  const [show, setShow] = useState(false);
  const [trade, setTrade] = useState<Partial<Trade>>({
    pair: 'GBPUSD', direction: 'long', setup: 'Current Range SMS', riskAmount: 5, outcome: 'open', pnl: 0, rGained: 0, notes: '',
    checklist: { structureConfirmed: false, rangeIdentified: false, smsConfirmed: false, riskUnder5: true, notRevenge: false, firstTradeOfDay: true },
  });

  const checklistComplete = trade.checklist && Object.values(trade.checklist).every(Boolean);

  const add = () => {
    if (!trade.pair || !trade.entryPrice) return;
    onUpdate({ ...wealth, trades: [...wealth.trades, { ...trade, id: `t-${Date.now()}`, date: new Date().toISOString().split('T')[0], rrRatio: trade.rrRatio || '1:2' } as Trade] });
    setTrade({ pair: 'GBPUSD', direction: 'long', setup: 'Current Range SMS', riskAmount: 5, outcome: 'open', pnl: 0, rGained: 0, notes: '', checklist: { structureConfirmed: false, rangeIdentified: false, smsConfirmed: false, riskUnder5: true, notRevenge: false, firstTradeOfDay: false } });
    setShow(false);
  };

  const setOutcome = (id: string, outcome: Trade['outcome']) => {
    onUpdate({
      ...wealth,
      trades: wealth.trades.map(t => {
        if (t.id !== id) return t;
        const r = outcome === 'win' ? 2 : outcome === 'loss' ? -1 : 0;
        const pnl = outcome === 'win' ? t.riskAmount * 2 : outcome === 'loss' ? -t.riskAmount : 0;
        return { ...t, outcome, rGained: r, pnl };
      }),
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Total P/L" value={`${stats.totalPnl >= 0 ? '+' : ''}$${stats.totalPnl}`} color={stats.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'} />
        <StatCard label="Win Rate" value={`${stats.winRate}%`} sub={`${stats.wins}W/${stats.losses}L`} color="text-indigo-400" />
        <StatCard label="Total R" value={`${stats.totalR >= 0 ? '+' : ''}${stats.totalR}R`} color="text-amber-400" />
        <StatCard label="Profit Factor" value={`${stats.profitFactor}`} color="text-white" />
        <StatCard label="Max Drawdown" value={`$${stats.maxDrawdown}`} color="text-red-400" />
      </div>

      <div className="glass p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Today's Risk Budget</div>
            <div className="text-2xl font-black text-white mt-1">${remainingRisk} <span className="text-sm text-zinc-500">/ ${wealth.tradingRules.maxRiskPerDay} remaining</span></div>
          </div>
          <div className="text-right text-[9px] font-black uppercase tracking-widest text-zinc-500">{tradesToday.length} / {wealth.tradingRules.maxTradesPerDay} trades today</div>
        </div>
        <div className="h-2 bg-zinc-900 rounded-full overflow-hidden mt-3"><div className={`h-full transition-all duration-700 ${remainingRisk > 0 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${((wealth.tradingRules.maxRiskPerDay - remainingRisk) / wealth.tradingRules.maxRiskPerDay) * 100}%` }} /></div>
      </div>

      {stats.equityCurve.length > 1 && (
        <div className="glass p-6 rounded-3xl border border-zinc-800">
          <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 border-b border-zinc-900 pb-3">Equity Curve</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.equityCurve}>
                <defs><linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.5} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                <XAxis dataKey="trade" stroke="#3f3f46" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#3f3f46" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px', fontSize: '11px' }} />
                <ReferenceLine y={0} stroke="#52525b" strokeDasharray="3 3" />
                <Area type="monotone" dataKey="equity" stroke="#10b981" strokeWidth={2.5} fill="url(#eqGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="flex justify-end"><button onClick={() => setShow(!show)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest">{show ? '× Cancel' : '+ Log Trade'}</button></div>

      {show && (
        <div className="glass p-5 rounded-2xl border border-indigo-500/30 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <input value={trade.pair} onChange={e => setTrade({ ...trade, pair: e.target.value })} placeholder="Pair" className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white font-bold" />
            <select value={trade.direction} onChange={e => setTrade({ ...trade, direction: e.target.value as any })} className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white font-bold"><option value="long">Long</option><option value="short">Short</option></select>
            <input value={trade.setup} onChange={e => setTrade({ ...trade, setup: e.target.value })} placeholder="Setup" className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white font-bold" />
            <input type="number" value={trade.riskAmount} onChange={e => setTrade({ ...trade, riskAmount: Number(e.target.value) })} placeholder="Risk $" className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white font-bold" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <input type="number" step="0.00001" value={trade.entryPrice || ''} onChange={e => setTrade({ ...trade, entryPrice: Number(e.target.value) })} placeholder="Entry" className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white" />
            <input type="number" step="0.00001" value={trade.stopPrice || ''} onChange={e => setTrade({ ...trade, stopPrice: Number(e.target.value) })} placeholder="Stop" className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white" />
            <input type="number" step="0.00001" value={trade.targetPrice || ''} onChange={e => setTrade({ ...trade, targetPrice: Number(e.target.value) })} placeholder="Target" className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white" />
          </div>

          <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">Pre-Trade Checklist (all required)</div>
            <div className="space-y-2">
              {[
                { k: 'structureConfirmed', label: 'Market structure confirmed' },
                { k: 'rangeIdentified', label: 'Current range identified' },
                { k: 'smsConfirmed', label: 'SMS confirmation' },
                { k: 'riskUnder5', label: 'Risk ≤ $5' },
                { k: 'notRevenge', label: 'Not revenge trading' },
                { k: 'firstTradeOfDay', label: 'First trade of day' },
              ].map(({ k, label }) => (
                <label key={k} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={trade.checklist?.[k as keyof typeof trade.checklist]} onChange={e => setTrade({ ...trade, checklist: { ...(trade.checklist!), [k]: e.target.checked } })} className="w-4 h-4 rounded" />
                  <span className={`text-xs ${trade.checklist?.[k as keyof typeof trade.checklist] ? 'text-emerald-400 font-bold' : 'text-zinc-500'}`}>{label}</span>
                </label>
              ))}
            </div>
          </div>

          <textarea value={trade.notes} onChange={e => setTrade({ ...trade, notes: e.target.value })} placeholder="Notes" rows={2} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white" />

          <button onClick={add} disabled={!checklistComplete} className={`w-full px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest ${checklistComplete ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-800 text-zinc-500'}`}>{checklistComplete ? 'Save Trade' : 'Complete Checklist First'}</button>
        </div>
      )}

      <div className="glass p-6 rounded-3xl border border-zinc-800">
        <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 border-b border-zinc-900 pb-3">Trade Log</h4>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {wealth.trades.sort((a, b) => b.date.localeCompare(a.date)).map(t => (
            <div key={t.id} className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/50">
              <div className="flex items-center gap-3">
                <div className={`w-1.5 h-12 rounded-full ${t.outcome === 'win' ? 'bg-emerald-500' : t.outcome === 'loss' ? 'bg-red-500' : t.outcome === 'breakeven' ? 'bg-zinc-500' : 'bg-amber-500 animate-pulse'}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{t.pair}</span>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${t.direction === 'long' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{t.direction}</span>
                  </div>
                  <div className="text-[9px] font-black text-zinc-600 uppercase">{t.setup} · {t.date} · Risk ${t.riskAmount}</div>
                </div>
                <div className="text-right">
                  <div className={`text-base font-black tabular-nums ${t.pnl > 0 ? 'text-emerald-400' : t.pnl < 0 ? 'text-red-400' : 'text-zinc-500'}`}>{t.pnl > 0 ? '+' : ''}${t.pnl}</div>
                  <div className="text-[9px] font-black text-zinc-600">{t.rGained > 0 ? '+' : ''}{t.rGained}R</div>
                </div>
              </div>
              {t.outcome === 'open' && (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => setOutcome(t.id, 'win')} className="flex-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-1.5 rounded-lg text-[9px] font-black uppercase">TP Hit</button>
                  <button onClick={() => setOutcome(t.id, 'loss')} className="flex-1 bg-red-500/10 border border-red-500/30 text-red-400 px-2 py-1.5 rounded-lg text-[9px] font-black uppercase">SL Hit</button>
                  <button onClick={() => setOutcome(t.id, 'breakeven')} className="flex-1 bg-zinc-800 border border-zinc-700 text-zinc-400 px-2 py-1.5 rounded-lg text-[9px] font-black uppercase">BE</button>
                </div>
              )}
            </div>
          ))}
          {wealth.trades.length === 0 && <div className="text-center py-8 text-[10px] font-black text-zinc-700 uppercase tracking-widest">No trades logged</div>}
        </div>
      </div>
    </div>
  );
};

const SavingsTab: React.FC<{ wealth: WealthData; onUpdate: (w: WealthData) => void }> = ({ wealth, onUpdate }) => {
  const [show, setShow] = useState(false);
  const [g, setG] = useState<Partial<SavingsGoal>>({ name: '', targetAmount: 1000, currentAmount: 0, monthlyContribution: 100, color: 'bg-indigo-500', deadline: '' });

  const contribute = (id: string, amt: number) => {
    onUpdate({ ...wealth, savingsGoals: wealth.savingsGoals.map(sg => sg.id === id ? { ...sg, currentAmount: Math.max(0, sg.currentAmount + amt) } : sg) });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end"><button onClick={() => setShow(!show)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest">{show ? '× Cancel' : '+ New Goal'}</button></div>

      {show && (
        <div className="glass p-5 rounded-2xl border border-indigo-500/30 space-y-3">
          <input value={g.name} onChange={e => setG({ ...g, name: e.target.value })} placeholder="Goal name" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-lg font-bold text-white" />
          <div className="grid grid-cols-2 gap-3">
            <input type="number" value={g.targetAmount} onChange={e => setG({ ...g, targetAmount: Number(e.target.value) })} placeholder="Target (£)" className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white" />
            <input type="number" value={g.monthlyContribution} onChange={e => setG({ ...g, monthlyContribution: Number(e.target.value) })} placeholder="Monthly (£)" className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white" />
          </div>
          <input type="date" value={g.deadline} onChange={e => setG({ ...g, deadline: e.target.value })} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white" />
          <button onClick={() => { if (g.name && g.targetAmount) { onUpdate({ ...wealth, savingsGoals: [...wealth.savingsGoals, { ...g, id: `sg-${Date.now()}` } as SavingsGoal] }); setG({ name: '', targetAmount: 1000, currentAmount: 0, monthlyContribution: 100, color: 'bg-indigo-500', deadline: '' }); setShow(false); } }} className="w-full bg-emerald-500 text-zinc-950 px-4 py-3 rounded-xl text-[10px] font-black uppercase">Create Goal</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {wealth.savingsGoals.map(sg => {
          const pct = Math.min(100, (sg.currentAmount / sg.targetAmount) * 100);
          const monthsLeft = Math.max(0, Math.ceil((new Date(sg.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)));
          const onTrack = sg.currentAmount + (sg.monthlyContribution * monthsLeft) >= sg.targetAmount;
          return (
            <div key={sg.id} className="glass p-6 rounded-3xl border border-zinc-800">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-bold text-white">{sg.name}</h4>
                  <div className="text-[9px] font-black text-zinc-600 uppercase">Due {sg.deadline} · {monthsLeft} months left</div>
                </div>
                <div className={`text-[9px] font-black px-2 py-1 rounded-full ${onTrack ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{onTrack ? 'ON TRACK' : 'OFF TRACK'}</div>
              </div>
              <div className="flex justify-between items-end mb-2">
                <div className="text-3xl font-black text-white tabular-nums">£{sg.currentAmount}</div>
                <div className="text-sm font-bold text-zinc-500">/ £{sg.targetAmount}</div>
              </div>
              <div className="h-2 bg-zinc-900 rounded-full overflow-hidden mb-4"><div className={`h-full ${sg.color} transition-all duration-700`} style={{ width: `${pct}%` }} /></div>
              <div className="flex gap-2">
                <button onClick={() => contribute(sg.id, 50)} className="flex-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-2 rounded-lg text-[10px] font-black uppercase">+£50</button>
                <button onClick={() => contribute(sg.id, 100)} className="flex-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-2 rounded-lg text-[10px] font-black uppercase">+£100</button>
                <button onClick={() => contribute(sg.id, sg.monthlyContribution)} className="flex-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 px-3 py-2 rounded-lg text-[10px] font-black uppercase">+£{sg.monthlyContribution}</button>
                <button onClick={() => contribute(sg.id, -50)} className="bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-2 rounded-lg text-[10px] font-black uppercase">-£50</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TaxTab: React.FC<{ wealth: WealthData; onUpdate: (w: WealthData) => void; estimate: number }> = ({ wealth, onUpdate, estimate }) => {
  const year = new Date().getFullYear();
  const ytdIncome = wealth.financeEntries.filter(e => e.type === 'income' && e.date.startsWith(`${year}`)).reduce((s, e) => s + e.amount, 0);
  const recurringMonthly = wealth.recurringTransactions.filter(r => r.active && r.type === 'income' && r.frequency === 'monthly').reduce((s, r) => s + r.amount, 0);
  const projectedAnnual = recurringMonthly * 12 + ytdIncome;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="YTD Income" value={`£${Math.round(ytdIncome).toLocaleString()}`} color="text-emerald-400" />
        <StatCard label="Projected Annual" value={`£${Math.round(projectedAnnual).toLocaleString()}`} color="text-white" />
        <StatCard label="Tax Rate" value={`${wealth.taxRate}%`} color="text-amber-400" />
        <StatCard label="Tax Owed (est.)" value={`£${Math.round(estimate).toLocaleString()}`} color="text-red-400" />
      </div>

      <div className="glass p-6 rounded-3xl border border-amber-500/20 bg-amber-500/5">
        <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-3">Tax Set-Aside Recommendation</h4>
        <p className="text-sm text-zinc-300 leading-relaxed">Based on your YTD income and {wealth.taxRate}% tax rate, set aside <span className="text-amber-400 font-bold">£{Math.round(estimate).toLocaleString()}</span> for tax obligations. Consider creating a "Tax Reserve" savings goal.</p>
      </div>

      <div className="glass p-6 rounded-3xl border border-zinc-800">
        <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 border-b border-zinc-900 pb-3">Settings</h4>
        <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-2 block">Tax Rate (%)</label>
        <input type="number" value={wealth.taxRate} onChange={e => onUpdate({ ...wealth, taxRate: Number(e.target.value) })} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-lg font-bold text-white" />
        <p className="text-[10px] text-zinc-600 mt-2">UK basic rate: 20% · Higher: 40% · Set based on your income bracket.</p>
      </div>
    </div>
  );
};

export default WealthView;
