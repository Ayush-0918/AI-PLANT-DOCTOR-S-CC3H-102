'use client';

import { Languages, Check, Mic } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { APP_LANGUAGES } from '@/lib/languages';
import dynamic from 'next/dynamic';

const FarmerVoiceAssistant = dynamic(() => import('@/components/FarmerVoiceAssistant'), { ssr: false });

export default function LanguageSelector({ className }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);
  const { language, setLanguage } = useLanguage();
  const currentLang =
    APP_LANGUAGES.find((entry) => entry.name === language) ?? APP_LANGUAGES[0];

  const triggerHaptic = () => { if (typeof window !== 'undefined' && navigator.vibrate) navigator.vibrate(10); };

  return (
    <div className={`relative z-[100] flex items-center gap-2 ${className}`}>
      {/* Mic / Voice Assistant button */}
      <button
        onClick={() => { triggerHaptic(); setShowAssistant(true); }}
        className="flex h-[46px] w-[46px] items-center justify-center rounded-full border border-white/70 bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-[0_10px_30px_rgba(16,185,129,0.3)] active:scale-95 transition-all"
      >
        <Mic size={20} className="animate-pulse" />
      </button>

      {/* Language selector pill */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 rounded-[1.5rem] border border-white/70 bg-white/75 px-4 py-3 text-slate-800 shadow-[0_20px_40px_rgba(10,36,22,0.12)] backdrop-blur-2xl transition-all active:scale-95"
      >
        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
          <Languages size={14} className="text-emerald-600" />
        </div>
        <span className="text-sm font-bold tracking-tight">{currentLang.label}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 -z-10 bg-black/5 backdrop-blur-[2px]"
            />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="absolute right-0 top-16 min-w-[240px] rounded-[1.8rem] border border-white/70 bg-white/95 p-3 shadow-2xl"
            >
              <div className="grid gap-1.5">
                {APP_LANGUAGES.map((lang) => (
                  <button 
                    key={lang.name}
                    onClick={() => { 
                      setLanguage(lang.name); 
                      setIsOpen(false); 
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                      language === lang.name 
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                        : 'hover:bg-slate-50 text-slate-700 font-bold'
                    }`}
                  >
                    <div className="text-left">
                      <p className="text-sm font-bold tracking-tight">{lang.label}</p>
                      <p
                        className={`text-xs ${
                          language === lang.name ? 'text-white/70' : 'text-slate-400'
                        }`}
                      >
                        {lang.subtitle}
                      </p>
                    </div>
                    {language === lang.name && <Check size={16} strokeWidth={3} />}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Voice Assistant Modal */}
      <AnimatePresence>
        {showAssistant && (
          <FarmerVoiceAssistant onClose={() => setShowAssistant(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
