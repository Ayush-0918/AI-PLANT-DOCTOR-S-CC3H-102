'use client';

import { Mic, Loader2, Volume2, X } from 'lucide-react';
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { useFarmerProfile } from '@/context/FarmerProfileContext';
import { fetchJson } from '@/lib/api';
import { getSpeechLangCode } from '@/lib/languages';
import {
  getSpeechRecognitionCtor,
  type SpeechRecognitionEventLike,
  type SpeechRecognitionLike,
} from '@/lib/speech';

export default function VoiceAIFAB() {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const { language } = useLanguage();
  const { profile } = useFarmerProfile();

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const startListening = () => {
    const SpeechRecognitionCtor = getSpeechRecognitionCtor();
    if (!SpeechRecognitionCtor) {
      alert("Voice AI is not supported in this browser.");
      return;
    }
    
    if (typeof window !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([30, 30]);
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = getSpeechLangCode(language);

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
      setResponse('');
    };

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      const firstResult = event.results[0];
      const text = firstResult?.[0]?.transcript || '';
      if (!text) return;
      setTranscript(text);
      if (firstResult?.isFinal) {
        setIsListening(false);
        processCommand(text);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const processCommand = async (text: string) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('text', text);
      formData.append('lang', language);
      
      const data = await fetchJson<{ assistant_response: string }>(`/api/v1/voice/intent`, {
        method: 'POST',
        body: formData
      });
      
      setResponse(data.assistant_response);
      
      if ('speechSynthesis' in window) {
         window.speechSynthesis.cancel();
         const utterance = new SpeechSynthesisUtterance(data.assistant_response);
         utterance.lang = getSpeechLangCode(language);
         utterance.pitch = 1.1;
         utterance.rate = 1;
         window.speechSynthesis.speak(utterance);
      }
    } catch {
      setResponse("AI currently offline. Please try typing.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        { (isListening || isProcessing || response) && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-32 left-4 right-4 z-[60] ml-auto max-w-sm rounded-[2rem] border border-white/60 bg-white/92 p-6 shadow-[0_25px_60px_rgba(0,0,0,0.2)] backdrop-blur-2xl"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isListening ? 'bg-rose-50' : 'bg-emerald-50'}`}>
                   {isListening ? <div className="w-3 h-3 bg-rose-500 rounded-full animate-ping" /> : <Volume2 className="text-emerald-500" size={20} />}
                </div>
                <div>
                   <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                     {isListening ? 'Listening' : isProcessing ? 'Processing' : 'AI Assistant'}
                   </h4>
                   <p className="text-sm font-bold text-slate-800 tracking-tight">
                     {isListening ? 'Speak now...' : isProcessing ? 'Thinking...' : 'Response Ready'}
                   </p>
                </div>
              </div>
              <button onClick={() => setResponse('')} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={16} className="text-slate-400" />
              </button>
            </div>
            
            <div className="bg-slate-50/50 rounded-2xl p-4 mb-3 border border-slate-100">
               <p className="text-sm font-bold text-slate-600 italic">
                 &quot;{transcript || '...'}&quot;
               </p>
            </div>
            
            {response && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 p-4 bg-emerald-500 rounded-2xl text-white shadow-lg shadow-emerald-500/20">
                <p className="text-sm font-bold leading-relaxed">{response}</p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-28 right-5 z-[60]">
        <motion.div className="relative group/voice">
          {!isListening && !response && (
             <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="absolute -top-14 right-0 rounded-[1.1rem] bg-slate-900 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap text-white shadow-xl"
             >
                {profile.name.split(' ')[0]}, tap & speak
                <div className="absolute -bottom-1 right-6 w-2 h-2 bg-slate-900 rotate-45" />
             </motion.div>
          )}
          {isListening && (
            <>
              <motion.div 
                animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
                className="absolute inset-0 bg-rose-500 rounded-full"
              />
              <motion.div 
                animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut", delay: 0.5 }}
                className="absolute inset-0 bg-rose-500 rounded-full"
              />
            </>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => (isListening ? recognitionRef.current?.stop() : startListening())}
            className={`relative z-10 group flex items-center justify-center w-16 h-16 rounded-[2rem] shadow-[0_15px_40px_rgba(16,185,129,0.3)] transition-all duration-500 ${
              isListening ? 'bg-rose-500 border-rose-400 shadow-rose-500/30' : 'bg-gradient-to-tr from-emerald-500 to-teal-400 border-white/20'
            } border-2`}
          >
            {isProcessing ? (
              <Loader2 size={26} className="animate-spin text-white" strokeWidth={3} />
            ) : (
              <Mic size={28} className="text-white" strokeWidth={3} />
            )}
          </motion.button>
        </motion.div>
      </div>
    </>
  );
}
