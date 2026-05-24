import React, { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPrompt: React.FC = () => {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    const dismissed = localStorage.getItem('life_os_install_dismissed');
    if (dismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    if ('Notification' in window) setNotifPermission(Notification.permission);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    setShow(false);
  };

  const dismiss = () => {
    setShow(false);
    localStorage.setItem('life_os_install_dismissed', '1');
  };

  const requestNotif = async () => {
    if (!('Notification' in window)) return;
    const p = await Notification.requestPermission();
    setNotifPermission(p);
    if (p === 'granted') {
      new Notification('Life OS', { body: 'Notifications enabled — daily reminders active.', icon: '/icon-192.png' });
      scheduleReminders();
    }
  };

  if (!show && notifPermission === 'granted') return null;

  return (
    <div className="fixed bottom-24 lg:bottom-6 right-4 z-[150] max-w-sm">
      {show && (
        <div className="glass rounded-2xl border border-indigo-500/40 bg-zinc-950 p-4 shadow-2xl mb-2">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-zinc-950" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" /></svg>
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-white">Install Life OS</div>
              <div className="text-xs text-zinc-400 mt-0.5">Add to home screen for full-screen experience</div>
              <div className="flex gap-2 mt-3">
                <button onClick={install} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest">Install</button>
                <button onClick={dismiss} className="text-zinc-500 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest">Dismiss</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {notifPermission === 'default' && (
        <div className="glass rounded-2xl border border-amber-500/40 bg-zinc-950 p-4 shadow-2xl">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-400">🔔</div>
            <div className="flex-1">
              <div className="text-sm font-bold text-white">Enable Reminders</div>
              <div className="text-xs text-zinc-400 mt-0.5">Morning intent + evening review pings</div>
              <button onClick={requestNotif} className="mt-2 bg-amber-500 text-zinc-950 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest">Enable</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function scheduleReminders() {
  // Schedules in-tab notifications at 6am (intent) and 9pm (review) when the tab is open.
  const schedule = (hour: number, minute: number, title: string, body: string) => {
    const now = new Date();
    const target = new Date(); target.setHours(hour, minute, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    const ms = target.getTime() - now.getTime();
    setTimeout(() => {
      if (Notification.permission === 'granted') new Notification(title, { body, icon: '/icon-192.png' });
      setInterval(() => {
        if (Notification.permission === 'granted') new Notification(title, { body, icon: '/icon-192.png' });
      }, 24 * 60 * 60 * 1000);
    }, ms);
  };
  schedule(6, 0, 'Life OS — Morning Intent', 'Set your 3 MITs for today.');
  schedule(21, 0, 'Life OS — Evening Review', '60 seconds: rating, win, lesson.');
}

export default InstallPrompt;
