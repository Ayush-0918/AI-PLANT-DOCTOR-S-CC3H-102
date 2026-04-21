'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, MicOff, Volume2, Wifi, WifiOff } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { getSpeechLangCode } from '@/lib/languages';
import { useRouter } from 'next/navigation';

/* ─── Static multilingual UI labels ─────────────────────────────── */
const UI: Record<string, {
  title: string; hint: string; greeting: string; listening: string; error: string;
  thinking: string; navMsg: string; speak: string; stop: string; offline: string;
  chips: string[];
}> = {
  English: {
    title: 'AI Farm Assistant', hint: 'Say "open scan" or ask anything about your crop…',
    greeting: 'Namaste Kisan Ji! I am your AI farm assistant powered by Google Gemini. Say "open scan" to diagnose your crop, or ask me anything.',
    listening: 'Listening… speak clearly', error: 'Could not hear you. Please try again.',
    thinking: 'Thinking with AI…', navMsg: 'Opening', speak: '🎤 Tap to Speak', stop: '⏹ Stop Speaking',
    offline: 'AI offline. Using local knowledge.',
    chips: ['📷 Open Scan', '🌤️ Weather today', '💰 Market prices', '🌱 Fertilizer tips', '🐛 Pest control'],
  },
  'हिंदी': {
    title: 'AI किसान सहायक', hint: '"स्कैन खोलो" बोलें या फसल के बारे में कुछ भी पूछें…',
    greeting: 'नमस्ते किसान जी! मैं Google Gemini से चलने वाला AI किसान सहायक हूँ। "स्कैन खोलो" बोलें या फसल की कोई भी समस्या पूछें।',
    listening: 'सुन रहा हूँ… साफ़ बोलें', error: 'आवाज़ नहीं सुनी। दोबारा बोलें।',
    thinking: 'AI सोच रहा है…', navMsg: 'खुल रहा है', speak: '🎤 बोलें', stop: '⏹ रोकें',
    offline: 'AI ऑफलाइन है। स्थानीय जानकारी से जवाब।',
    chips: ['📷 स्कैन खोलो', '🌤️ आज का मौसम', '💰 मंडी भाव', '🌱 खाद सलाह', '🐛 कीट नियंत्रण'],
  },
  'भोजपुरी': {
    title: 'AI किसान सहायक', hint: '"स्कैन खोलीं" बोलीं या फसल के बारे में पूछीं…',
    greeting: 'प्रणाम किसान जी! हम Google Gemini से चलने वाला AI किसान सहायक बानी। "स्कैन खोलीं" बोलीं या फसल के कवनो समस्या पूछीं।',
    listening: 'सुनत बानी… साफ़ बोलीं', error: 'आवाज़ नइखे सुनाइल। फिर बोलीं।',
    thinking: 'AI सोचत बा…', navMsg: 'खुलत बा', speak: '🎤 बोलीं', stop: '⏹ रोकीं',
    offline: 'AI ऑफलाइन बा। स्थानीय जानकारी से जवाब।',
    chips: ['📷 स्कैन खोलीं', '🌤️ आज के मौसम', '💰 मंडी भाव', '🌱 खाद सलाह', '🐛 कीड़ा नियंत्रण'],
  },
  'ਪੰਜਾਬੀ': {
    title: 'AI ਕਿਸਾਨ ਸਹਾਇਕ', hint: '"ਸਕੈਨ ਖੋਲੋ" ਕਹੋ ਜਾਂ ਫਸਲ ਬਾਰੇ ਕੁਝ ਵੀ ਪੁੱਛੋ…',
    greeting: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਕਿਸਾਨ ਜੀ! ਮੈਂ Google Gemini ਨਾਲ ਚੱਲਣ ਵਾਲਾ AI ਸਹਾਇਕ ਹਾਂ। "ਸਕੈਨ ਖੋਲੋ" ਕਹੋ ਜਾਂ ਕੁਝ ਵੀ ਪੁੱਛੋ।',
    listening: 'ਸੁਣ ਰਿਹਾ ਹਾਂ… ਸਾਫ਼ ਬੋਲੋ', error: 'ਆਵਾਜ਼ ਨਹੀਂ ਸੁਣੀ। ਫਿਰ ਕਹੋ।',
    thinking: 'AI ਸੋਚ ਰਿਹਾ ਹੈ…', navMsg: 'ਖੁੱਲ੍ਹ ਰਿਹਾ ਹੈ', speak: '🎤 ਬੋਲੋ', stop: '⏹ ਰੋਕੋ',
    offline: 'AI ਔਫਲਾਈਨ ਹੈ। ਸਥਾਨਕ ਜਾਣਕਾਰੀ ਤੋਂ ਜਵਾਬ।',
    chips: ['📷 ਸਕੈਨ ਖੋਲੋ', '🌤️ ਅੱਜ ਦਾ ਮੌਸਮ', '💰 ਮੰਡੀ ਭਾਅ', '🌱 ਖਾਦ ਸਲਾਹ', '🐛 ਕੀਟ ਨਿਯੰਤਰਣ'],
  },
};

/* ─── Offline fallback keywords ──────────────────────────────────── */
const OFFLINE_KB: Record<string, Record<string, string>> = {
  English: {
    disease: 'Take a clear photo of affected leaf and use the Scan feature for AI diagnosis.',
    yellow: 'Yellow leaves = Nitrogen deficiency. Apply Urea 30 kg/acre.',
    blight: 'Blight: Spray Mancozeb 75% WP at 2g/litre. Remove infected leaves first.',
    weather: '28°C today, mild breeze. Good for spraying. Rain likely tomorrow.',
    price: 'Wheat ₹2,350/q · Tomato ₹800/q · Rice ₹1,900/q',
    fertilizer: 'DAP at sowing → Urea at 3 weeks → MOP before flowering.',
    pest: 'Pest: Chlorpyrifos 20% EC 2ml/litre. Spray at evening.',
    water: 'Water every 4–5 days. Check 2-inch soil depth.',
  },
  'हिंदी': {
    रोग: 'प्रभावित पत्ती की फोटो लें और Scan करें।',
    पीला: 'पीली पत्तियाँ = नाइट्रोजन कमी। 30 किलो यूरिया/एकड़।',
    मौसम: 'आज 28°C। कल बारिश संभव।',
    भाव: 'गेहूँ ₹2,350 · टमाटर ₹800 · धान ₹1,900 प्रति क्विंटल।',
    खाद: 'DAP बुवाई पर → यूरिया 3 हफ्ते बाद → MOP फूल से पहले।',
    कीट: 'Chlorpyrifos 20% EC 2ml/लीटर। शाम को स्प्रे।',
  },
  'भोजपुरी': {
    रोग: 'पतई के फोटो खींची आउर Scan करीं।',
    मौसम: 'आज 28°C। कल बरखा संभव।',
    भाव: 'गेहूँ ₹2,350 · टमाटर ₹800 · धान ₹1,900।',
  },
  'ਪੰਜਾਬੀ': {
    ਰੋਗ: 'ਪੱਤੇ ਦੀ ਫੋਟੋ ਲਓ ਅਤੇ Scan ਕਰੋ।',
    ਮੌਸਮ: 'ਅੱਜ 28°C। ਕੱਲ੍ਹ ਮੀਂਹ ਸੰਭਵ।',
    ਭਾਅ: 'ਕਣਕ ₹2,350 · ਟਮਾਟਰ ₹800 · ਝੋਨਾ ₹1,900।',
  },
};

const NAV_WORDS: Record<string, string> = {
  scan: '/scanner', scanner: '/scanner', camera: '/scanner', photo: '/scanner',
  shop: '/marketplace', market: '/marketplace', buy: '/marketplace', bazaar: '/marketplace',
  community: '/community', profile: '/profile', home: '/dashboard', dashboard: '/dashboard',
  'स्कैन': '/scanner', 'कैमरा': '/scanner', 'दुकान': '/marketplace', 'बाज़ार': '/marketplace',
  'बाजार': '/marketplace', 'समुदाय': '/community', 'घर': '/dashboard',
  'ਸਕੈਨ': '/scanner', 'ਦੁਕਾਨ': '/marketplace', 'ਘਰ': '/dashboard',
};

function checkNavIntent(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [kw, route] of Object.entries(NAV_WORDS)) {
    if (lower.includes(kw.toLowerCase())) return route;
  }
  return null;
}

function offlineAnswer(text: string, lang: string): string {
  const lower = text.toLowerCase();
  const kb = { ...OFFLINE_KB['English'], ...(OFFLINE_KB[lang] || {}) };
  for (const [kw, reply] of Object.entries(kb)) {
    if (lower.includes(kw.toLowerCase())) return reply;
  }
  const ui = UI[lang] || UI['English'];
  return `${ui.offline} "${text}"`;
}

/* ─── Types ──────────────────────────────────────────────────────── */
interface FarmerVoiceAssistantProps { onClose: () => void; }

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
  interface SpeechRecognition extends EventTarget {
    lang: string; interimResults: boolean; maxAlternatives: number;
    start(): void; stop(): void;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: Event) => void) | null;
    onend: (() => void) | null;
  }
  interface SpeechRecognitionEvent extends Event { results: SpeechRecognitionResultList; }
}

/* ─── Component ──────────────────────────────────────────────────── */
export default function FarmerVoiceAssistant({ onClose }: FarmerVoiceAssistantProps) {
  const { language } = useLanguage();
  const router = useRouter();
  const ui = UI[language] || UI['English'];
  const speechLang = getSpeechLangCode(language);

  const [phase, setPhase] = useState<'greeting' | 'idle' | 'listening' | 'thinking' | 'speaking' | 'navigating' | 'error'>('greeting');
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAIOnline, setIsAIOnline] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (typeof window === 'undefined') return;
    const synth = window.speechSynthesis;
    synthRef.current = synth;
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = speechLang;
    utter.rate = 0.88;
    utter.volume = 1;
    setIsSpeaking(true);
    utter.onend = () => { setIsSpeaking(false); onEnd?.(); };
    utter.onerror = () => { setIsSpeaking(false); onEnd?.(); };
    synth.speak(utter);
  }, [speechLang]);

  useEffect(() => {
    const t = setTimeout(() => speak(ui.greeting, () => setPhase('idle')), 350);
    return () => {
      clearTimeout(t);
      synthRef.current?.cancel();
      try { recognitionRef.current?.stop(); } catch {}
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Ask Gemini ─────────────────────────────────────────────── */
  const askAI = useCallback(async (query: string) => {
    setPhase('thinking');
    try {
      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, language }),
      });

      if (!res.ok) {
        if (res.status === 503) setIsAIOnline(false);
        throw new Error('AI error');
      }

      const data = await res.json();
      setIsAIOnline(true);

      if (data.navigate) {
        const label = data.navigate.replace('/', '').replace('scanner', 'Scanner') || 'Page';
        const navReply = `${ui.navMsg} ${label}…`;
        setResponse(navReply);
        setPhase('navigating');
        speak(navReply, () => { onClose(); router.push(data.navigate); });
        return;
      }

      const reply = data.text || offlineAnswer(query, language);
      setResponse(reply);
      setPhase('speaking');
      speak(reply, () => setPhase('idle'));
    } catch {
      setIsAIOnline(false);
      const reply = offlineAnswer(query, language);
      setResponse(reply);
      setPhase('speaking');
      speak(reply, () => setPhase('idle'));
    }
  }, [language, ui, onClose, router, speak]);

  /* ── Voice recognition ──────────────────────────────────────── */
  const startListening = useCallback(() => {
    const SpeechRec = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SpeechRec) {
      setPhase('error'); setResponse('Voice recognition needs Chrome browser.'); return;
    }
    const rec = new SpeechRec();
    rec.lang = speechLang;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    recognitionRef.current = rec;
    setPhase('listening'); setTranscript(''); setResponse('');

    rec.onresult = (e: SpeechRecognitionEvent) => {
      const heard = e.results[0][0].transcript;
      setTranscript(heard);

      // Fast nav check before hitting AI
      const navRoute = checkNavIntent(heard);
      if (navRoute) {
        const label = navRoute.replace('/', '').replace('scanner', 'Scanner') || 'Page';
        const navReply = `${ui.navMsg} ${label}…`;
        setResponse(navReply);
        setPhase('navigating');
        speak(navReply, () => { onClose(); router.push(navRoute); });
        return;
      }
      askAI(heard);
    };

    rec.onerror = () => {
      setPhase('error'); setResponse(ui.error);
      setTimeout(() => setPhase('idle'), 2500);
    };
    rec.start();
  }, [speechLang, ui, onClose, router, speak, askAI]);

  /* ── Chip tap handler ───────────────────────────────────────── */
  const handleChip = useCallback((chip: string) => {
    const navRoute = checkNavIntent(chip);
    if (navRoute) {
      const label = navRoute.replace('/', '').replace('scanner', 'Scanner') || 'Page';
      const navReply = `${ui.navMsg} ${label}…`;
      setTranscript(chip);
      setResponse(navReply);
      setPhase('navigating');
      speak(navReply, () => { onClose(); router.push(navRoute); });
    } else {
      setTranscript(chip);
      askAI(chip);
    }
  }, [ui, onClose, router, speak, askAI]);

  const stopSpeaking = () => {
    synthRef.current?.cancel();
    setIsSpeaking(false);
    setPhase('idle');
  };

  /* ─── Orb color ─────────────────────────────────────────────── */
  const orbGrad =
    phase === 'listening' ? 'linear-gradient(135deg,#34d399,#10b981)'
    : phase === 'speaking' || phase === 'greeting' ? 'linear-gradient(135deg,#7dd3fc,#38bdf8)'
    : phase === 'navigating' ? 'linear-gradient(135deg,#a78bfa,#7c3aed)'
    : phase === 'error' ? 'linear-gradient(135deg,#f87171,#ef4444)'
    : phase === 'thinking' ? 'linear-gradient(135deg,#fbbf24,#f59e0b)'
    : 'linear-gradient(135deg,#43a047,#2e7d32)';

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-end justify-center p-4 bg-slate-900/30 backdrop-blur-md"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: 130, scale: 0.93, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 130, scale: 0.93, opacity: 0 }}
        transition={{ type: 'spring', damping: 22, stiffness: 210 }}
        className="w-full max-w-sm rounded-[2.4rem] p-6 pb-8 bg-white/95 backdrop-blur-xl border border-slate-200/60 shadow-[0_48px_120px_rgb(0,0,0,0.1),0_0_0_1px_rgb(255,255,255,0.4)_inset]"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-lg shadow-sm">🌿</div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-600">{ui.title}</p>
              <div className="flex items-center gap-1 mt-0.5">
                {isAIOnline
                  ? <><Wifi size={9} className="text-emerald-500" /><p className="text-[9px] text-slate-500 font-semibold">Gemini AI • Online</p></>
                  : <><WifiOff size={9} className="text-amber-500" /><p className="text-[9px] text-amber-600/80 font-semibold">Offline mode</p></>
                }
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors shadow-sm">
            <X size={14} className="text-slate-500" />
          </button>
        </div>

        {/* Orb */}
        <div className="flex justify-center mb-7">
          <div className="relative flex items-center justify-center">
            <AnimatePresence>
              {phase === 'listening' && (
                <motion.div key="ring-l" initial={{ opacity: 0 }} animate={{ scale: [1, 1.55, 1], opacity: [0.4, 0.1, 0.4] }}
                  exit={{ opacity: 0 }} transition={{ repeat: Infinity, duration: 1.4 }}
                  className="absolute w-20 h-20 rounded-full bg-emerald-400" style={{ filter: 'blur(10px)' }} />
              )}
              {(phase === 'speaking' || phase === 'greeting') && (
                <motion.div key="ring-s" initial={{ opacity: 0 }} animate={{ scale: [1, 1.4, 1], opacity: [0.35, 0.08, 0.35] }}
                  exit={{ opacity: 0 }} transition={{ repeat: Infinity, duration: 1.2 }}
                  className="absolute w-20 h-20 rounded-full bg-sky-400" style={{ filter: 'blur(10px)' }} />
              )}
              {phase === 'thinking' && (
                <motion.div key="ring-t" initial={{ opacity: 0 }} animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.07, 0.3] }}
                  exit={{ opacity: 0 }} transition={{ repeat: Infinity, duration: 0.9 }}
                  className="absolute w-20 h-20 rounded-full bg-amber-400" style={{ filter: 'blur(10px)' }} />
              )}
              {phase === 'navigating' && (
                <motion.div key="ring-n" initial={{ opacity: 0 }} animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0.1, 0.4] }}
                  exit={{ opacity: 0 }} transition={{ repeat: Infinity, duration: 1 }}
                  className="absolute w-20 h-20 rounded-full bg-violet-400" style={{ filter: 'blur(10px)' }} />
              )}
            </AnimatePresence>

            <motion.button
              onClick={phase === 'idle' || phase === 'error' ? startListening : phase === 'speaking' ? stopSpeaking : undefined}
              animate={{ scale: phase === 'listening' ? [1, 1.08, 1] : 1 }}
              transition={{ repeat: phase === 'listening' ? Infinity : 0, duration: 1.1 }}
              whileTap={{ scale: 0.91 }}
              className="relative w-[4.8rem] h-[4.8rem] rounded-full flex items-center justify-center cursor-pointer"
              style={{ background: orbGrad, boxShadow: '0 10px 36px rgba(0,0,0,0.45)' }}
            >
              {phase === 'listening' ? <Mic size={27} className="text-white" />
                : phase === 'speaking' || phase === 'greeting' ? <Volume2 size={27} className="text-white" />
                : phase === 'error' ? <MicOff size={27} className="text-white" />
                : phase === 'navigating' ? <span className="text-white text-2xl">→</span>
                : phase === 'thinking'
                  ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.85, ease: 'linear' }}
                      className="w-6 h-6 border-[2.5px] border-white/35 border-t-white rounded-full" />
                  : <Mic size={27} className="text-white" />
              }
            </motion.button>
          </div>
        </div>

        {/* Status */}
        <div className="text-center mb-4 min-h-10">
          <AnimatePresence mode="wait">
            {phase === 'greeting' && <motion.p key="g" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-[11px] font-semibold text-sky-600 leading-relaxed px-2">{ui.greeting.slice(0, 80)}…</motion.p>}
            {phase === 'idle' && <motion.p key="i" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-[11px] text-slate-400 font-medium">{ui.hint}</motion.p>}
            {phase === 'listening' && <motion.p key="l" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-sm font-bold text-emerald-500 animate-pulse">{ui.listening}</motion.p>}
            {phase === 'thinking' && <motion.p key="t" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-xs font-semibold text-amber-500">{ui.thinking}</motion.p>}
            {phase === 'navigating' && <motion.p key="n" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-xs font-bold text-violet-500">🚀 {language === 'हिंदी' ? 'पेज खुल रहा है…' : language === 'भोजपुरी' ? 'पेज खुलत बा…' : language === 'ਪੰਜਾਬੀ' ? 'ਪੇਜ ਖੁੱਲ੍ਹ ਰਿਹਾ ਹੈ…' : 'Opening page…'}</motion.p>}
            {phase === 'error' && <motion.p key="e" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-xs font-semibold text-rose-500">{ui.error}</motion.p>}
          </AnimatePresence>
        </div>

        {/* Conversation bubbles */}
        {transcript && (
          <motion.div key={`tr-${transcript.slice(0,10)}`} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="flex justify-end mb-2">
            <div className="max-w-[80%] rounded-2xl rounded-br-sm px-3 py-2 bg-emerald-100 border border-emerald-200">
              <p className="text-xs text-emerald-800 font-medium">"{transcript}"</p>
            </div>
          </motion.div>
        )}
        {response && (
          <motion.div key={`r-${response.slice(0,12)}`} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} className="flex justify-start mb-4">
            <div className="max-w-[88%] rounded-2xl rounded-bl-sm px-3 py-2.5 bg-slate-50 border border-slate-200 shadow-sm">
              <p className="text-[11.5px] text-slate-700 leading-relaxed font-medium">{response}</p>
              {isSpeaking && (
                <div className="flex gap-0.5 mt-1.5 items-end h-3">
                  {[0.1, 0.22, 0.34, 0.46].map((d, i) => (
                    <motion.div key={i} animate={{ height: [3, 11, 3] }} transition={{ repeat: Infinity, duration: 0.6, delay: d }}
                      className="w-0.5 rounded-full bg-sky-500" />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Quick chips */}
        {phase === 'idle' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div className="flex flex-wrap gap-1.5 mb-3 justify-center">
              {ui.chips.map((chip) => (
                <button key={chip} onClick={() => handleChip(chip)}
                  className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-all active:scale-95 shadow-sm">
                  {chip}
                </button>
              ))}
            </div>
            <motion.button onClick={startListening} whileTap={{ scale: 0.96 }}
              className="w-full py-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-sm font-black text-emerald-600 hover:bg-emerald-100 transition-all shadow-sm">
              {ui.speak}
            </motion.button>
          </motion.div>
        )}

        {phase === 'speaking' && (
          <motion.button onClick={stopSpeaking} initial={{ opacity: 0 }} animate={{ opacity: 1 }} whileTap={{ scale: 0.96 }}
            className="w-full py-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-sm font-black text-rose-600 shadow-sm">
            {ui.stop}
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  );
}
