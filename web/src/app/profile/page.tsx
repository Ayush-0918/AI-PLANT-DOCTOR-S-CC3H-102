'use client';

import {
  Bell, Camera, Check, ChevronRight, HelpCircle, Languages, Leaf,
  Lock, Mail, MapPin, Mic, Moon, Pencil, PhoneCall, RotateCcw,
  Shield, ShieldCheck, Smartphone, Sun, Tractor, X, CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useState, useCallback, useEffect } from 'react';
import { useFarmerProfile } from '@/context/FarmerProfileContext';
import { useLanguage } from '@/context/LanguageContext';
import { useAtmosphere } from '@/context/AtmosphericContext';
import { APP_LANGUAGES } from '@/lib/languages';
import { formatSoilTypeLabel } from '@/lib/soil';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const CROP_ICONS: Record<string, string> = {
  Wheat: '🌾', Rice: '🌿', Tomato: '🍅', Potato: '🥔',
  Corn: '🌽', Cotton: '☁️', Soybean: '🫘', Sugarcane: '🎋',
};

const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.4, ease: 'easeOut' as const } }),
};

type ActivityHistory = {
  scans: Array<Record<string, unknown>>;
  calls: Array<Record<string, unknown>>;
  feedback: Array<Record<string, unknown>>;
};

// ── TOGGLE SWITCH ──────────────────────────────────────
function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative h-6 w-11 rounded-full transition-colors ${enabled ? 'bg-emerald-500' : 'bg-slate-200'}`}
    >
      <div className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${enabled ? 'left-6' : 'left-1'}`} />
    </button>
  );
}

export default function ProfilePage() {
  const { profile, resetProfile, updateProfile } = useFarmerProfile();
  const { language, setLanguage, t } = useLanguage();
  const { isDark, toggleTheme } = useAtmosphere();

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile.name);
  const [history, setHistory] = useState<ActivityHistory>({ scans: [], calls: [], feedback: [] });
  const [showHelp, setShowHelp] = useState(false);

  // ── Notification preferences (local state, persisted via profile) ──
  const [scanAlerts, setScanAlerts] = useState(true);
  const [diseaseAlerts, setDiseaseAlerts] = useState(true);
  const [marketAlerts, setMarketAlerts] = useState(false);

  // ── Privacy preferences ──
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [crashReports, setCrashReports] = useState(true);

  // ── Show expanded sections ──
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [showPrivacyPanel, setShowPrivacyPanel] = useState(false);
  const [showPrefsPanel, setShowPrefsPanel] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/users/me/history`)
      .then(res => res.json())
      .then(data => {
        if (data && data.scans) {
          setHistory({ scans: data.scans || [], calls: data.calls || [], feedback: data.feedback || [] });
        }
      })
      .catch(() => {});
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = profile.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();

  const handlePhotoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { if (ev.target?.result) updateProfile({ avatarUrl: ev.target.result as string }); };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [updateProfile]);

  const saveName = () => {
    const trimmed = nameInput.trim();
    if (trimmed) updateProfile({ name: trimmed });
    setEditingName(false);
  };

  const stats = [
    { label: t('profile_stats_scans'), value: (history.scans?.length || 0).toString(), icon: Leaf, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', textColor: '#15803d' },
    { label: t('profile_stats_posts'), value: (history.calls?.length || 0).toString(), icon: Mic, color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', textColor: '#1d4ed8' },
    { label: t('profile_stats_orders'), value: (history.feedback?.length || 0).toString(), icon: Tractor, color: '#d97706', bg: '#fffbeb', border: '#fde68a', textColor: '#b45309' },
  ];

  return (
    <div className="min-h-full bg-[#f8fafc] pb-36 px-4 pt-5 space-y-3.5">

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" capture="user" onChange={handlePhotoChange} className="hidden" />

      {/* ── HERO PROFILE CARD ── */}
      <motion.div custom={0} variants={cardVariant} initial="hidden" animate="show"
        className="relative rounded-[2rem] p-5 overflow-hidden bg-white"
        style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)' }}>
        <div className="absolute top-0 left-0 right-0 h-1 rounded-t-[2rem] bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400" />

        <div className="flex items-start justify-between gap-4 mt-1">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <motion.div whileTap={{ scale: 0.96 }} onClick={() => fileInputRef.current?.click()}
                className="h-[72px] w-[72px] rounded-2xl flex items-center justify-center text-[1.5rem] font-black text-white relative overflow-hidden cursor-pointer"
                style={{ background: profile.avatarUrl ? 'transparent' : 'linear-gradient(135deg, #22c55e 0%, #16a34a 60%, #15803d 100%)', boxShadow: '0 8px 24px rgba(34,197,94,0.35)' }}>
                {profile.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatarUrl} alt="Profile" className="h-full w-full object-cover rounded-2xl" />
                ) : (<>{initials}<div className="absolute top-0 left-0 right-0 h-1/2 bg-white/10 rounded-t-2xl" /></>)}
              </motion.div>
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 h-7 w-7 rounded-xl flex items-center justify-center bg-white border border-slate-200 shadow-sm">
                <Camera size={12} className="text-emerald-600" />
              </motion.button>
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.28em] mb-1">{t('prof_heading')}</p>
              <AnimatePresence mode="wait">
                {editingName ? (
                  <motion.div key="editing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                    <input autoFocus value={nameInput} onChange={(e) => setNameInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false); }}
                      className="text-xl font-black text-slate-900 bg-slate-50 border border-emerald-300 rounded-xl px-2 py-0.5 outline-none w-32" />
                    <button onClick={saveName} className="h-7 w-7 rounded-lg bg-emerald-500 flex items-center justify-center"><Check size={13} className="text-white" /></button>
                    <button onClick={() => setEditingName(false)} className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center"><X size={13} className="text-slate-500" /></button>
                  </motion.div>
                ) : (
                  <motion.div key="display" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                    <h1 className="text-2xl font-black text-slate-900">{profile.name}</h1>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setNameInput(profile.name); setEditingName(true); }}
                      className="h-7 w-7 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                      <Pencil size={11} className="text-slate-400" />
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="flex items-center gap-1.5 mt-1">
                <MapPin size={11} className="text-rose-400" />
                <span className="text-xs font-semibold text-slate-400">{profile.locationLabel}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2.5">
          {stats.map(({ label, value, icon: Icon, color, bg, border, textColor }) => (
            <motion.div key={label} whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="rounded-2xl p-3 text-center" style={{ background: bg, border: `1px solid ${border}` }}>
              <div className="h-8 w-8 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: `${color}18` }}>
                <Icon size={15} style={{ color }} />
              </div>
              <p className="text-2xl font-black" style={{ color: textColor }}>{value}</p>
              <p className="text-[9px] font-black uppercase tracking-widest mt-0.5 text-slate-400">{label}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── FARM IDENTITY ── */}
      <motion.div custom={1} variants={cardVariant} initial="hidden" animate="show"
        className="rounded-[2rem] p-5 bg-white" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)' }}>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.28em] mb-3">{t('prof_farm_identity')}</p>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xl font-black text-slate-800">{profile.farmerType}</p>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">{t('prof_farm_type_sub')}</p>
          </div>
          <div className="px-4 py-2.5 rounded-2xl text-right" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-wider">{t('prof_farm_size')}</p>
            <p className="text-lg font-black text-slate-800 mt-0.5">{profile.farmSize || '2 acres'}</p>
          </div>
        </div>
        <div className="h-px bg-slate-100 my-4" />
        <div className="mb-4 rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2.5">
          <p className="text-[9px] font-black uppercase tracking-widest text-amber-600">Soil Profile</p>
          <p className="mt-1 text-sm font-bold text-amber-800">{formatSoilTypeLabel(profile.soilType)}</p>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { icon: Mic, labelKey: 'prof_voice', value: profile.voiceEnabled ? t('prof_enabled') : t('prof_disabled'), active: profile.voiceEnabled },
            { icon: ShieldCheck, labelKey: 'prof_location', value: profile.locationAllowed ? t('prof_allowed') : t('prof_skipped'), active: profile.locationAllowed },
          ].map(({ icon: Icon, labelKey, value, active }) => (
            <div key={labelKey} className="rounded-2xl p-3" style={{ background: active ? '#f0fdf4' : '#f8fafc', border: active ? '1px solid #bbf7d0' : '1px solid #e2e8f0' }}>
              <div className="flex items-center gap-2 mb-1.5">
                <Icon size={12} className={active ? 'text-emerald-500' : 'text-slate-400'} />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t(labelKey)}</span>
              </div>
              <p className="text-sm font-bold" style={{ color: active ? '#16a34a' : '#64748b' }}>{value}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── CROP PROFILE ── */}
      <motion.div custom={2} variants={cardVariant} initial="hidden" animate="show"
        className="rounded-[2rem] p-5 bg-white" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.28em] mb-1">{t('prof_crop_profile')}</p>
            <h2 className="text-lg font-black text-slate-800">{t('prof_selected_crops')}</h2>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {profile.crops.map((crop) => (
            <span key={crop} className="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-700">
              {CROP_ICONS[crop] || '🌱'} {crop}
            </span>
          ))}
        </div>
      </motion.div>

      {/* ── LANGUAGE ── */}
      <motion.div custom={3} variants={cardVariant} initial="hidden" animate="show"
        className="rounded-[2rem] p-5 bg-white" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-emerald-50 border border-emerald-100">
            <Languages size={18} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.28em]">{t('prof_app_language')}</p>
            <h2 className="text-lg font-black text-slate-800 mt-0.5">{language}</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {APP_LANGUAGES.map((entry) => {
            const isActive = language === entry.name;
            return (
              <motion.button key={entry.name} whileTap={{ scale: 0.96 }}
                onClick={() => { if (navigator.vibrate) navigator.vibrate(10); setLanguage(entry.name); }}
                className="rounded-2xl p-3.5 text-left relative overflow-hidden transition-all"
                style={{ background: isActive ? '#f0fdf4' : '#f8fafc', border: isActive ? '1.5px solid #86efac' : '1px solid #e2e8f0', boxShadow: isActive ? '0 4px 12px rgba(34,197,94,0.12)' : 'none' }}>
                {isActive && <CheckCircle2 size={13} className="absolute top-2.5 right-2.5 text-emerald-500" />}
                <p className="text-sm font-black text-slate-800">{entry.label}</p>
                <p className="text-xs mt-0.5 font-semibold" style={{ color: isActive ? '#16a34a' : '#94a3b8' }}>{entry.subtitle}</p>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* ── NOTIFICATIONS ── */}
      <motion.div custom={4} variants={cardVariant} initial="hidden" animate="show"
        className="rounded-[2rem] overflow-hidden bg-white" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)' }}>
        <button onClick={() => setShowNotifPanel(!showNotifPanel)}
          className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-50 transition-colors">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#8b5cf612', border: '1px solid #8b5cf620' }}>
            <Bell size={18} style={{ color: '#8b5cf6' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-800 text-sm">Notifications</p>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">Daily alerts, scan results</p>
          </div>
          <ChevronRight size={16} className={`text-slate-300 shrink-0 transition-transform ${showNotifPanel ? 'rotate-90' : ''}`} />
        </button>

        <AnimatePresence>
          {showNotifPanel && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-slate-100">
              <div className="px-5 py-4 space-y-4 bg-slate-50/50">
                {[
                  { label: 'Scan Alerts', sub: 'Get notified after every AI scan result', val: scanAlerts, set: setScanAlerts },
                  { label: 'Disease Warnings', sub: 'Community disease outbreak alerts nearby', val: diseaseAlerts, set: setDiseaseAlerts },
                  { label: 'Mandi Price Alerts', sub: 'Daily crop price updates from market', val: marketAlerts, set: setMarketAlerts },
                ].map(({ label, sub, val, set }) => (
                  <div key={label} className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800">{label}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
                    </div>
                    <Toggle enabled={val} onToggle={() => { set(!val); if (navigator.vibrate) navigator.vibrate(8); }} />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── PRIVACY & SECURITY ── */}
      <motion.div custom={5} variants={cardVariant} initial="hidden" animate="show"
        className="rounded-[2rem] overflow-hidden bg-white" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)' }}>
        <button onClick={() => setShowPrivacyPanel(!showPrivacyPanel)}
          className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-50 transition-colors">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#05966912', border: '1px solid #05966920' }}>
            <Shield size={18} style={{ color: '#059669' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-800 text-sm">Privacy & Security</p>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">Data stays on your device</p>
          </div>
          <ChevronRight size={16} className={`text-slate-300 shrink-0 transition-transform ${showPrivacyPanel ? 'rotate-90' : ''}`} />
        </button>

        <AnimatePresence>
          {showPrivacyPanel && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-slate-100">
              <div className="px-5 py-4 space-y-4 bg-slate-50/50">
                <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-3 flex items-start gap-3">
                  <Lock size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-xs font-medium text-emerald-800 leading-relaxed">
                    All scan data, profile info and photos are stored <strong>only on your device</strong>. We never upload your personal data without your consent.
                  </p>
                </div>
                {[
                  { label: 'Anonymous Analytics', sub: 'Help improve AI accuracy (no personal data)', val: analyticsEnabled, set: setAnalyticsEnabled },
                  { label: 'Crash Reports', sub: 'Send crash logs to fix bugs faster', val: crashReports, set: setCrashReports },
                ].map(({ label, sub, val, set }) => (
                  <div key={label} className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800">{label}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
                    </div>
                    <Toggle enabled={val} onToggle={() => { set(!val); if (navigator.vibrate) navigator.vibrate(8); }} />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── APP PREFERENCES ── */}
      <motion.div custom={6} variants={cardVariant} initial="hidden" animate="show"
        className="rounded-[2rem] overflow-hidden bg-white" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)' }}>
        <button onClick={() => setShowPrefsPanel(!showPrefsPanel)}
          className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-50 transition-colors">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#0284c712', border: '1px solid #0284c720' }}>
            <Smartphone size={18} style={{ color: '#0284c7' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-800 text-sm">App Preferences</p>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">Camera, voice, themes</p>
          </div>
          <ChevronRight size={16} className={`text-slate-300 shrink-0 transition-transform ${showPrefsPanel ? 'rotate-90' : ''}`} />
        </button>

        <AnimatePresence>
          {showPrefsPanel && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-slate-100">
              <div className="px-5 py-4 space-y-4 bg-slate-50/50">
                {/* Voice */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: '#7dd3fc14' }}>
                      <Mic size={15} className="text-sky-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">Voice Assistant</p>
                      <p className="text-xs text-slate-400 mt-0.5">Hands-free AI interaction</p>
                    </div>
                  </div>
                  <Toggle enabled={profile.voiceEnabled} onToggle={() => { updateProfile({ voiceEnabled: !profile.voiceEnabled }); if (navigator.vibrate) navigator.vibrate(8); }} />
                </div>

                {/* Theme */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: '#fbbf2414' }}>
                      {isDark ? <Moon size={15} className="text-amber-500" /> : <Sun size={15} className="text-amber-500" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">Dark Mode</p>
                      <p className="text-xs text-slate-400 mt-0.5">{isDark ? 'Currently dark' : 'Currently light'}</p>
                    </div>
                  </div>
                  <Toggle enabled={isDark} onToggle={() => { toggleTheme(); if (navigator.vibrate) navigator.vibrate(8); }} />
                </div>

                {/* Location */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: '#f8717114' }}>
                      <MapPin size={15} className="text-rose-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">Location Access</p>
                      <p className="text-xs text-slate-400 mt-0.5">For weather & threat alerts</p>
                    </div>
                  </div>
                  <Toggle enabled={profile.locationAllowed} onToggle={() => { updateProfile({ locationAllowed: !profile.locationAllowed }); if (navigator.vibrate) navigator.vibrate(8); }} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── HELP & SUPPORT ── */}
      <motion.div custom={7} variants={cardVariant} initial="hidden" animate="show"
        className="rounded-[2rem] overflow-hidden bg-white" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)' }}>
        <button onClick={() => setShowHelp(true)}
          className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-50 transition-colors">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#3b82f612', border: '1px solid #3b82f620' }}>
            <HelpCircle size={18} style={{ color: '#3b82f6' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-800 text-sm">Help & Support</p>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">Call or email our team 24/7</p>
          </div>
          <ChevronRight size={16} className="text-slate-300 shrink-0" />
        </button>
      </motion.div>

      {/* ── RESET ONBOARDING ── */}
      <motion.button custom={8} variants={cardVariant} initial="hidden" animate="show"
        onClick={() => { resetProfile(); updateProfile({ onboardingCompleted: false }); }}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-[2rem] font-black text-sm transition-colors"
        style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444' }}
        whileTap={{ scale: 0.98 }}>
        <RotateCcw size={16} />
        {t('prof_restart')}
      </motion.button>

      <p className="text-center text-[10px] text-slate-300 font-bold pb-2">Plant Doctor Intelligence Suite · v1.0</p>

      {/* ── HELP MODAL ── */}
      <AnimatePresence>
        {showHelp && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 16 }}
              className="relative w-full max-w-sm rounded-[32px] bg-white p-6 shadow-2xl">
              <div className="absolute right-4 top-4">
                <button onClick={() => setShowHelp(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200">
                  <X size={16} />
                </button>
              </div>
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <HelpCircle size={28} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Need Help?</h3>
              <p className="mt-2 text-sm text-slate-600 font-medium">
                Kisi bhi problem ke liye hum 24/7 available hain. Call ya email karo.
              </p>
              <div className="mt-6 space-y-3">
                <a href="tel:8228858145"
                  className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-blue-400 hover:bg-emerald-50/50"
                  style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <PhoneCall size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Call Us</p>
                    <p className="font-bold text-slate-800 text-lg">8228858145</p>
                  </div>
                </a>
                <a href="mailto:ayushpandey10851@gmail.com"
                  className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-blue-400 hover:bg-blue-50/50"
                  style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <Mail size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Us</p>
                    <p className="truncate font-bold text-slate-800 text-sm">ayushpandey10851@gmail.com</p>
                  </div>
                </a>
              </div>
              <button onClick={() => setShowHelp(false)}
                className="mt-6 w-full rounded-2xl bg-blue-600 py-3.5 font-bold text-white shadow-md active:scale-95 transition-transform">
                Done
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
