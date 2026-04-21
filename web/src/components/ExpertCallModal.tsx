'use client';

import { PhoneCall, Phone, X, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useExpertCall } from '@/context/ExpertCallContext';

export default function ExpertCallModal() {
  const { isOpen, closeCallModal, phoneNumber, setPhoneNumber, status, message, triggerCall } = useExpertCall();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-6 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="glass-panel glass-shine relative w-full max-w-sm overflow-hidden rounded-[2.5rem] p-6"
      >
        <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-rose-300/12 blur-3xl" />
        <div className="absolute -left-16 bottom-0 h-40 w-40 rounded-full bg-sky-300/10 blur-3xl" />
        
        <div className="flex justify-between items-center mb-6">
          <div className="flex flex-col relative z-10">
            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-rose-200/90">🌱 Plant Doctor Helpline</h3>
            <h2 className="text-xl font-black leading-tight text-white">Expert Ko Call Karein</h2>
          </div>
          <button onClick={closeCallModal} className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/40 transition-colors hover:text-white hover:bg-white/20 active:scale-95">
            <X size={20} />
          </button>
        </div>

        {status === 'idle' || status === 'error' ? (
          <>
            <p className="mb-6 rounded-2xl border border-white/8 bg-white/6 p-4 text-xs leading-relaxed text-white/55">
              Apna mobile number confirm karein. Hamare AI Plant Doctor aapko turant call karenge — disease diagnosis aur treatment ke liye.
            </p>
            
            <div className="relative mb-6 group">
               <div className="absolute left-4 top-1/2 mr-3 flex h-6 -translate-y-1/2 items-center gap-2 border-r border-white/10 pr-3 text-xs font-black text-white/30 transition-colors group-focus-within:text-sky-200">
                <span className="opacity-60">🇮🇳</span>
                <span>+91</span>
              </div>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="6207116098"
                className="w-full rounded-2xl border border-white/12 bg-white/7 py-[18px] pl-24 pr-4 font-mono text-base font-bold tracking-tight text-white placeholder:text-white/10 transition-all focus:border-sky-300/50 focus:outline-none"
              />
            </div>

            {status === 'error' && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-300/25 bg-rose-300/10 p-3">
                <div className="h-1.5 w-1.5 rounded-full bg-rose-300 animate-pulse" />
                <p className="text-[11px] font-bold uppercase tracking-tight text-rose-100">{message}</p>
              </div>
            )}

            <button
              onClick={triggerCall}
              className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-[linear-gradient(135deg,#fde6ea,#fda4af)] py-5 text-xs font-black uppercase tracking-[0.15em] text-slate-900 shadow-[0_18px_30px_rgba(253,164,175,0.28)] transition-all active:scale-[0.98]"
            >
              <span>📞 Call Shuru Karein</span>
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-6 py-12 text-center">
            {status === 'loading' ? (
              <>
                <div className="relative flex h-20 w-20 items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-sky-200/10 border-t-sky-300 animate-[spin_0.8s_linear_infinite]" />
                  <PhoneCall size={32} className="animate-pulse text-sky-200" />
                </div>
                <div>
                  <p className="text-lg font-black uppercase tracking-tight text-white">🔄 Connect Ho Raha Hai</p>
                  <p className="mt-1.5 text-xs font-bold uppercase leading-relaxed tracking-widest text-white/40">AI Plant Doctor ko connect kar rahe hain...<br/>Please wait</p>
                </div>
              </>
            ) : (
              <>
                <div className="relative flex h-20 w-20 items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-sky-300/20 animate-ping" />
                  <div className="flex h-full w-full items-center justify-center rounded-full border border-sky-200/20 bg-sky-200/10 text-sky-200">
                    <Phone size={32} className="animate-[bounce_2s_infinite]" />
                  </div>
                </div>
                <div>
                  <p className="text-xl font-black uppercase tracking-tight text-sky-100">✅ Call Ho Rahi Hai!</p>
                  <p className="mt-2 max-w-[200px] text-xs font-bold leading-relaxed text-white/50">Aapke phone par incoming call aa rahi hai. AI Plant Doctor se baat karein aur apni fasal ki problem batayein 🌱</p>
                </div>
              </>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
