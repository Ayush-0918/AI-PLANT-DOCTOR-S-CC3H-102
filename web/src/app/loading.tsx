import { Activity } from 'lucide-react';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 bg-[#F7F6EF] flex flex-col items-center justify-center">
       <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
          <div className="absolute inset-0 border-4 border-slate-200 rounded-[1.5rem]" />
          <div className="absolute inset-0 border-4 border-emerald-500 rounded-[1.5rem] border-t-transparent animate-spin" />
          <Activity size={32} className="text-emerald-500 animate-pulse" />
       </div>
       <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">Loading neural network...</p>
    </div>
  );
}
