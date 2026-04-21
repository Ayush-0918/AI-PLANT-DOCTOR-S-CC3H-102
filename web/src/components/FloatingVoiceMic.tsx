'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, X, Volume2, Sparkles } from 'lucide-react';
import {
  getSpeechRecognitionCtor,
  type SpeechErrorEventLike,
  type SpeechRecognitionEventLike,
  type SpeechRecognitionLike,
} from '@/lib/speech';

export default function FloatingVoiceMic() {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const completeInteraction = useCallback((response: string, callback?: () => void) => {
    setAiResponse(response);
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(response);
      utterance.lang = 'hi-IN';
      utterance.onend = () => {
        if (callback) callback();
      };
      window.speechSynthesis.speak(utterance);
    } else if (callback) {
      setTimeout(callback, 2000);
    }
  }, []);

  const handleVoiceCommand = useCallback(
    (text: string) => {
      const lower = text.toLowerCase();
      setIsListening(false);

      if (lower.includes('bimari') || lower.includes('rog') || lower.includes('keeda') || lower.includes('disease')) {
        completeInteraction("Maine camera khol diya hai. Apni fasal ki photo kheenchiye...", () => window.location.assign('/scanner'));
      } else if (lower.includes('mausam') || lower.includes('barish') || lower.includes('weather')) {
        completeInteraction("Kal bhari barish ki sambhavna hai. Aaj urea bilkul na dalein.");
      } else if (lower.includes('daam') || lower.includes('bhav') || lower.includes('price') || lower.includes('bazaar')) {
        completeInteraction("Ludhiana mandi mein genhu ka bhav teis so pachas rupaye prati quintal hai. AI kehta hai abhi apna stock bech dein.");
      } else {
        completeInteraction("Main Plant Doctor AI hoon. Kripya fir se bolein.");
      }
    },
    [completeInteraction]
  );

  useEffect(() => {
    const SpeechRecognitionCtor = getSpeechRecognitionCtor();
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'hi-IN'; // Rural first: Hindi natively supported

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      const currentIndex = event.resultIndex ?? 0;
      const current = event.results[currentIndex];
      const text = current?.[0]?.transcript || '';
      if (!text) return;
      setTranscript(text);

      if (current?.isFinal) {
        handleVoiceCommand(text);
      }
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: SpeechErrorEventLike) => {
      console.error("Speech error", event.error);
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [handleVoiceCommand]);

  const toggleListen = () => {
    if (!recognitionRef.current) {
        alert("Microphone API is not fully supported in this browser environment.");
        return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setTranscript('');
      setAiResponse('');
      recognitionRef.current.start();
    }
  };

  const triggerHaptic = (pat: number | number[] = 20) => {
      if (navigator.vibrate) navigator.vibrate(pat);
  };

  return (
    <>
      <button 
        onClick={() => { setIsOpen(true); setTimeout(toggleListen, 500); triggerHaptic(); }}
        className="fixed bottom-32 right-4 z-[60] w-14 h-14 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-[1.5rem] shadow-xl shadow-emerald-500/40 flex items-center justify-center text-white active:scale-95 transition-transform border-[3px] border-white/30 hover:shadow-emerald-500/60"
      >
        <Mic size={24} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            className="fixed inset-x-3 bottom-32 z-[70] bg-[#020a07]/95 backdrop-blur-3xl border border-white/20 rounded-[2rem] p-6 shadow-[0_40px_80px_rgba(0,0,0,0.5)]"
          >
             <div className="flex justify-between items-center border-b border-slate-200/50 pb-4 mb-4">
               <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 flex items-center gap-1.5"><Sparkles size={12} /> Edge AI Voice Module</p>
                  <h3 className="text-xl font-bold text-slate-800 tracking-tight mt-1">Kisan Mitra AI</h3>
               </div>
               <button onClick={() => { setIsOpen(false); recognitionRef.current?.stop(); window.speechSynthesis.cancel(); }} className="w-8 h-8 flex items-center justify-center bg-black/5 rounded-full text-slate-500 hover:bg-black/10 transition-colors">
                 <X size={18} />
               </button>
             </div>

             <div className="flex flex-col items-center justify-center py-4">
                 <button 
                   onClick={() => { triggerHaptic(30); toggleListen(); }}
                   className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-rose-500 text-white shadow-xl shadow-rose-500/30 scale-105' : 'bg-emerald-500/20 text-emerald-400'}`}
                >
                   {isListening && <div className="absolute inset-0 rounded-full border border-rose-400 animate-ping opacity-50" />}
                   {isListening && <div className="absolute inset-[-15px] rounded-full border border-rose-300 animate-ping opacity-20" style={{animationDelay: '0.2s'}} />}
                   <Mic size={36} className={isListening ? 'animate-pulse' : ''} />
                </button>
                
                <p className="mt-6 text-xl font-medium text-white text-center min-h-[60px] leading-snug w-5/6">
                   {isListening ? (transcript || "Sammne bolein (e.g. 'Mandi bhav')...") : (aiResponse || "Mic dabayein aur bolein..")}
                </p>

                {aiResponse && (
                   <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex items-center gap-2 bg-emerald-50 text-emerald-700 px-5 py-2.5 rounded-full text-sm font-bold w-fit shadow-sm">
                      <Volume2 size={16} className="animate-pulse" /> AI Speaking in Hindi...
                   </motion.div>
                )}
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
