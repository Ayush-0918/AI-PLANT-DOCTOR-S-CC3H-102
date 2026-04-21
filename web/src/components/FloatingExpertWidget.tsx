'use client';

import { PhoneCall, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useExpertCall } from '@/context/ExpertCallContext';
import { useLanguage } from '@/context/LanguageContext';

export default function FloatingExpertWidget() {
  const { isOpen, openCallModal, closeCallModal } = useExpertCall();
  const { t } = useLanguage();
  const hotlineText = t('247_hotline') || '24/7 Expert Doctor Hotline';

  return (
    <div className={`absolute pointer-events-none transition-all duration-300 ${isOpen ? 'z-[110]' : 'z-50'}`} style={{ bottom: '168px', right: '16px' }}>
      <style>{`
        .child-pointer-events-auto > * { pointer-events: auto; }
        @keyframes wiggle {
           0%, 100% { transform: rotate(-10deg); }
           50% { transform: rotate(10deg); }
        }
      `}</style>

      <div className="relative flex flex-col items-end gap-3 child-pointer-events-auto">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative group rounded-full p-1 h-fit w-fit"
          onClick={() => isOpen ? closeCallModal() : openCallModal()}
        >
          {/* Pulsing ring */}
          <div className="absolute inset-0 rounded-full bg-rose-300 opacity-20 animate-ping" style={{ animationDuration: '2.2s' }} />
          <div className="absolute inset-0 rounded-full bg-rose-300 opacity-30 blur-md animate-pulse" />

          {/* Glass pill */}
          <div className={`relative flex items-center gap-3 rounded-full border border-slate-200/80 bg-white/95 backdrop-blur-[60px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] pl-2 py-2 transition-all duration-500 ${isOpen ? 'pr-2' : 'pr-4'}`}>
            <div className={`h-10 w-10 flex items-center justify-center rounded-full text-white shadow-inner transition-colors duration-500 ${isOpen ? 'bg-slate-100/50 text-slate-500' : 'bg-[linear-gradient(135deg,#fda4af,#fb7185)]'}`}>
              {isOpen
                ? <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                : <PhoneCall size={20} className="animate-[wiggle_2s_ease-in-out_infinite] origin-center" />
              }
            </div>
            {!isOpen && (
              <div className="flex flex-col text-left">
                <span className="w-fit rounded-full border border-rose-200 bg-rose-50 px-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-rose-600">24/7</span>
                <span className="mt-0.5 text-[11px] font-black leading-tight tracking-tight text-slate-800 max-w-[160px]">
                  {hotlineText}
                </span>
              </div>
            )}
          </div>
        </motion.button>
      </div>
    </div>
  );
}
