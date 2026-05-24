
import React, { useState } from 'react';
import { getAIAssistance } from '../services/geminiService';
import { DayLog } from '../types';

interface AIAssistantProps {
  currentLog: DayLog;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ currentLog }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'ai', content: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!query.trim()) return;
    const userMsg = query;
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setQuery('');
    setIsLoading(true);
    const response = await getAIAssistance(userMsg, currentLog);
    setMessages(prev => [...prev, { role: 'ai', content: response }]);
    setIsLoading(false);
  };

  return (
    <div className="fixed bottom-24 lg:bottom-10 right-4 sm:right-10 z-[100]">
      {isOpen && (
        <div className="mb-4 sm:mb-6 w-[calc(100vw-2rem)] sm:w-80 md:w-96 h-[60vh] sm:h-[500px] glass rounded-2xl shadow-2xl border border-zinc-800 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-500">
          <div className="p-4 sm:p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-100">AI Stack Assistant</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white transition-colors p-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 sm:space-y-5 bg-zinc-950/20">
            {messages.length === 0 && (
              <div className="mt-6 sm:mt-10 space-y-6">
                <p className="text-sm font-medium text-zinc-400 leading-relaxed text-center px-4">
                  How can I help optimize your performance today?
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {["Morning routine", "Meal ideas", "Sleep hygiene"].map(tip => (
                    <button key={tip} onClick={() => setQuery(tip)}
                      className="text-[10px] uppercase font-bold tracking-tight bg-zinc-900 border border-zinc-800 text-zinc-400 px-4 py-2 rounded-full hover:text-white transition-all">
                      {tip}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] p-3 sm:p-4 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed ${m.role === 'user' ? 'bg-zinc-100 text-zinc-950' : 'bg-zinc-900 text-zinc-300 border border-zinc-800'}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl flex gap-1.5">
                  <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
          </div>

          <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-950/40">
            <div className="flex gap-3">
              <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Ask anything..."
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
              <button onClick={handleSend} disabled={isLoading} className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-500 disabled:opacity-50 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
              </button>
            </div>
          </div>
        </div>
      )}
      
      <button onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-zinc-100 text-zinc-950 rounded-full shadow-2xl flex items-center justify-center hover:bg-white transition-all hover:scale-110 active:scale-90 group border-4 border-zinc-950">
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
        )}
      </button>
    </div>
  );
};

export default AIAssistant;
