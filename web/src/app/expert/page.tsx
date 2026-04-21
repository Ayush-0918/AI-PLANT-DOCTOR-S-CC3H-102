'use client';

import { useLanguage } from '@/context/LanguageContext';
import { useExpertCall } from '@/context/ExpertCallContext';
import { getBackendAssetUrl } from '@/lib/api';
import { getSpeechLangCode } from '@/lib/languages';
import {
  getSpeechRecognitionCtor,
  type SpeechRecognitionEventLike,
  type SpeechRecognitionLike,
} from '@/lib/speech';
import { Brain, Camera, Mic, MicOff, Phone, Send, User, Loader2, Volume2, VolumeX } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  voiceUrl?: string | null;
};

type ChatApiResponse = {
  success: boolean;
  response: string;
  voice_url?: string | null;
};

export default function ExpertPage() {
  const { t, language } = useLanguage();
  const { openCallModal } = useExpertCall();
  const speechLang = getSpeechLangCode(language);

  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: t('assistant_greeting') || 'Hello, I am your digital agronomist. How is your field looking today?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceError, setVoiceError] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const speakingAudioRef = useRef<HTMLAudioElement | null>(null);

  const speechSupported = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(getSpeechRecognitionCtor());
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (speakingAudioRef.current) {
      speakingAudioRef.current.pause();
      speakingAudioRef.current.currentTime = 0;
      speakingAudioRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  const speakResponse = useCallback(
    (text: string, voiceUrl?: string | null) => {
      if (!text.trim()) return;
      stopSpeaking();

      if (voiceUrl) {
        try {
          const audio = new Audio(getBackendAssetUrl(voiceUrl));
          speakingAudioRef.current = audio;
          setIsSpeaking(true);
          audio.onended = () => setIsSpeaking(false);
          audio.onerror = () => setIsSpeaking(false);
          void audio.play().catch(() => {
            setIsSpeaking(false);
          });
          return;
        } catch {
          setIsSpeaking(false);
        }
      }

      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = speechLang;
        utterance.rate = 0.95;
        utterance.pitch = 1;
        setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      }
    },
    [speechLang, stopSpeaking]
  );

  const sendMessage = useCallback(
    async (forcedMessage?: string) => {
      if (loading) return;
      const userMsg = (forcedMessage ?? input).trim();
      if (!userMsg) return;

      setInput('');
      setVoiceError('');

      const historyPayload = messages.slice(-10).map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
      setLoading(true);

      try {
        const res = await fetch(`${API_BASE}/api/v1/ai/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userMsg,
            history: historyPayload,
            voice_mode: true,
            language,
          }),
        });

        const data = (await res.json().catch(() => null)) as ChatApiResponse | null;
        if (!res.ok || !data) {
          throw new Error('chat_request_failed');
        }

        if (data.success) {
          const assistant = {
            role: 'assistant' as const,
            content: data.response,
            voiceUrl: data.voice_url || null,
          };
          setMessages((prev) => [...prev, assistant]);
          speakResponse(assistant.content, assistant.voiceUrl);
        } else {
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: data.response || "I'm sorry, I encountered an issue. Please try again." },
          ]);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Connection error. Please check your internet or backend server.' },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [input, language, loading, messages, speakResponse]
  );

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    setVoiceError('');
    const SpeechRecognitionCtor = getSpeechRecognitionCtor();
    if (!SpeechRecognitionCtor) {
      setVoiceError('Voice input not supported in this browser. Try Chrome/Edge.');
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = speechLang;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      const heard = event.results[0]?.[0]?.transcript?.trim() || '';
      setIsListening(false);
      if (heard) {
        setInput(heard);
        void sendMessage(heard);
      }
    };
    recognition.onerror = () => {
      setIsListening(false);
      setVoiceError('Could not capture your voice clearly. Please try again.');
    };
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  }, [sendMessage, speechLang]);

  useEffect(() => {
    return () => {
      stopListening();
      stopSpeaking();
    };
  }, [stopListening, stopSpeaking]);

  return (
    <div className="flex flex-col min-h-[100dvh] text-white">
      <div
        className="sticky top-0 z-50 px-5 pt-4 pb-4 space-y-1"
        style={{
          background: 'linear-gradient(180deg, rgba(8,17,31,0.92), rgba(8,17,31,0.78))',
          backdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="glass-pill rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-100/85">
                AI + Human Sync
              </div>
              <div className="glass-pill rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-100/90">
                {speechSupported ? 'Voice Enabled' : 'Text Mode'}
              </div>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">{t('btn_talk_human') || 'Digital Assistant'}</h1>
            <p className="mt-0.5 text-xs text-white/48">Llama 3 assistant with live mandi context + voice replies</p>
          </div>

          <button
            onClick={openCallModal}
            className="h-12 w-12 rounded-[1.25rem] flex items-center justify-center relative haptic-btn"
            style={{ background: 'linear-gradient(135deg, #fecdd3, #fda4af)', boxShadow: '0 4px 24px rgba(253,164,175,0.2)' }}
          >
            <div className="absolute inset-0 rounded-[1.25rem] animate-ping opacity-30" style={{ background: '#fda4af' }} />
            <Phone size={18} fill="#be123c" className="text-rose-700 relative z-10" />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-6 pb-44 scroll-smooth">
        {messages.map((msg, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`h-10 w-10 shrink-0 rounded-[1rem] flex items-center justify-center shadow-lg ${
                msg.role === 'assistant'
                  ? 'bg-[linear-gradient(135deg,rgba(125,211,252,0.2),rgba(125,211,252,0.05))] border border-[rgba(125,211,252,0.3)]'
                  : 'bg-[linear-gradient(135deg,rgba(255,255,255,0.1),rgba(255,255,255,0.02))] border border-[rgba(255,255,255,0.15)]'
              }`}
            >
              {msg.role === 'assistant' ? <Brain size={18} className="text-sky-200" /> : <User size={18} className="text-white/70" />}
            </div>
            <div
              className={`p-4 rounded-3xl text-sm max-w-[85%] font-medium shadow-xl ${
                msg.role === 'assistant'
                  ? 'glass-panel text-white/90 rounded-tl-sm'
                  : 'bg-[linear-gradient(135deg,#dbeafe,#7dd3fc)] text-slate-900 rounded-tr-sm font-bold'
              }`}
            >
              {msg.content}
              {msg.role === 'assistant' && (
                <button
                  onClick={() => speakResponse(msg.content, msg.voiceUrl)}
                  className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-100"
                >
                  <Volume2 size={11} />
                  Speak
                </button>
              )}
            </div>
          </motion.div>
        ))}

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="h-10 w-10 shrink-0 rounded-[1rem] flex items-center justify-center bg-[rgba(125,211,252,0.1)]">
              <Loader2 size={18} className="text-sky-200 animate-spin" />
            </div>
            <div className="glass-panel p-4 rounded-3xl rounded-tl-sm text-sm text-white/40">AI is thinking...</div>
          </motion.div>
        )}
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 w-full px-4 pt-4 pb-8 z-40"
        style={{ background: 'linear-gradient(to top, rgba(8,12,20,0.98) 60%, transparent)' }}
      >
        {voiceError && (
          <div className="mb-2 rounded-xl border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">{voiceError}</div>
        )}

        <div className="glass-panel rounded-full p-2 flex items-center backdrop-blur-3xl shadow-[0_-8px_32px_rgba(0,0,0,0.4)] border border-white/10">
          <button className="h-10 w-10 shrink-0 rounded-full flex items-center justify-center haptic-btn" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <Camera size={18} className="text-white/60" />
          </button>

          <input
            type="text"
            placeholder={t('input_placeholder') || 'Ask your AI Doctor...'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void sendMessage()}
            className="flex-1 px-4 bg-transparent border-none focus:outline-none text-sm text-white placeholder-white/30 font-medium"
          />

          <button
            onClick={isListening ? stopListening : startListening}
            disabled={!speechSupported || loading}
            className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center haptic-btn mr-1 ${
              isListening ? 'bg-rose-500/90' : 'bg-white/10'
            } disabled:opacity-40`}
          >
            {isListening ? <MicOff size={18} className="text-white" /> : <Mic size={18} className="text-white/80" />}
          </button>

          <button
            onClick={isSpeaking ? stopSpeaking : undefined}
            disabled={!isSpeaking}
            className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center haptic-btn mr-1 ${
              isSpeaking ? 'bg-emerald-500/90' : 'bg-white/10'
            } disabled:opacity-40`}
          >
            {isSpeaking ? <VolumeX size={18} className="text-white" /> : <Volume2 size={18} className="text-white/80" />}
          </button>

          <button
            onClick={() => void sendMessage()}
            disabled={!input.trim() || loading}
            className="h-10 w-10 shrink-0 bg-[linear-gradient(135deg,#dbeafe,#7dd3fc)] rounded-full text-slate-900 flex items-center justify-center shadow-lg haptic-btn disabled:opacity-40"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
