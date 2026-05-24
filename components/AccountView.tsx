
import React, { useState, useEffect } from 'react';
import { User, UserProfile } from '../types';
import { calculateAge, roundTo2 } from '../utils/storage';

interface AccountViewProps {
  user: User;
  profile: UserProfile;
  stats: {
    totalLogs: number;
    memberSince: string;
  };
  onSaveProfile: (profile: UserProfile) => void;
  onLogout: () => void;
  saveStatus: 'idle' | 'saving' | 'saved';
}

const AccountView: React.FC<AccountViewProps> = ({ user, profile, stats, onSaveProfile, onLogout, saveStatus }) => {
  const [localProfile, setLocalProfile] = useState<UserProfile>(profile);

  useEffect(() => {
    setLocalProfile(profile);
  }, [profile]);

  const age = calculateAge(localProfile.dob);
  let bmr = (10 * localProfile.weight) + (6.25 * localProfile.height) - (5 * age);
  bmr += localProfile.gender === 'male' ? 5 : -161;

  const handleUpdate = (key: keyof UserProfile, value: any) => {
    setLocalProfile(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-8 lg:space-y-12 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-[2rem] overflow-hidden border-2 border-zinc-800 shadow-xl">
            {user.photoUrl ? (
              <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-zinc-600 font-black text-2xl uppercase">
                {user.name.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-1">Identity Profile</h3>
            <h2 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">{user.name}</h2>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">{user.email}</p>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95"
        >
          Terminate Session
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        <section className="lg:col-span-4 space-y-6">
          <div className="glass p-8 rounded-[2.5rem] border border-zinc-800/50">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-6">System Statistics</h4>
            <div className="space-y-6">
              <div>
                <span className="text-[9px] font-bold text-zinc-600 uppercase block mb-1">Service Duration</span>
                <span className="text-xl font-black text-zinc-100 uppercase tracking-tighter">Member Since {stats.memberSince}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-zinc-600 uppercase block mb-1">Active Tracking Sessions</span>
                <span className="text-xl font-black text-indigo-400 tabular-nums">{stats.totalLogs} Entries</span>
              </div>
              <div className="pt-4 border-t border-zinc-800">
                 <button 
                   onClick={() => alert("Data export protocol initiated. Check your downloads.")}
                   className="text-[9px] font-black uppercase text-zinc-500 hover:text-white transition-colors tracking-[0.2em]"
                 >
                   Export CSV Dataset
                 </button>
              </div>
            </div>
          </div>
          
          <div className="bg-zinc-900/40 p-6 rounded-[2rem] border border-zinc-800/50">
            <h4 className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-4">Precision Logic</h4>
            <p className="text-[10px] text-zinc-500 leading-relaxed font-bold uppercase">
              Habit Stack uses an <span className="text-indigo-400">Additive Metabolic Model</span>. We take your BMR (Basal Rate) + 10% Lifestyle Floor, and then add your real-time Steps and Exercise logs. This model is static to ensure reporting accuracy.
            </p>
          </div>
        </section>

        <section className="lg:col-span-8">
          <div className="glass p-8 lg:p-12 rounded-[3rem] border border-zinc-800/50">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-8 border-b border-zinc-800 pb-4">Biometric Calibration</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-600 uppercase">Static Height (cm)</label>
                <input 
                  type="number" 
                  value={localProfile.height} 
                  onChange={(e) => handleUpdate('height', Number(e.target.value))}
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-600 uppercase">Baseline Weight (kg)</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={localProfile.weight} 
                  onChange={(e) => handleUpdate('weight', Number(e.target.value))}
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-600 uppercase">Birth Date</label>
                <input 
                  type="date" 
                  value={localProfile.dob} 
                  onChange={(e) => handleUpdate('dob', e.target.value)}
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-600 uppercase">Tracking Start Date (Genesis)</label>
                <input 
                  type="date" 
                  value={localProfile.trackingStartDate} 
                  onChange={(e) => handleUpdate('trackingStartDate', e.target.value)}
                  className="w-full bg-indigo-500/10 border border-indigo-500/20 rounded-2xl px-6 py-4 text-sm font-bold text-indigo-100 focus:ring-1 focus:ring-indigo-500"
                />
                <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest mt-1">
                  *Analytics and mapping ignore all logs before this date.
                </p>
              </div>
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
                 <h5 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Basal Metabolic Rate (BMR)</h5>
                 <div className="text-2xl font-black text-white tabular-nums">{Math.round(bmr)} <span className="text-[10px] text-zinc-600">KCAL</span></div>
              </div>
              <div className="bg-indigo-500/5 border border-indigo-500/10 p-6 rounded-2xl">
                 <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Additive Lifestyle Floor</h5>
                 <div className="text-2xl font-black text-white tabular-nums">{Math.round(bmr * 1.1)} <span className="text-[10px] text-zinc-600">KCAL</span></div>
                 <p className="text-[8px] text-zinc-500 font-bold uppercase mt-1">Base burn + Thermic Effect of Food (TEF).</p>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-zinc-800 flex justify-end">
               <button 
                 onClick={() => onSaveProfile(localProfile)}
                 disabled={saveStatus === 'saving'}
                 className={`px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-xl ${
                   saveStatus === 'saved' 
                   ? 'bg-emerald-500 text-zinc-950' 
                   : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'
                 }`}
               >
                 {saveStatus === 'saving' ? 'Applying...' : saveStatus === 'saved' ? 'Profile Locked' : 'Commit Biometric Changes'}
               </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AccountView;
