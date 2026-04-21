'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, Globe, Moon, Sun, ChevronDown, Check,
  Menu, X, Scan, ShoppingBag, Users, Leaf,
  Thermometer, FlaskConical, BookOpen, Image,
  Phone, BarChart3, Settings, History, ArrowRight,
  Wheat, Home, BrainCircuit, HelpCircle, PhoneCall, Mail
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAtmosphere } from '@/context/AtmosphericContext';
import { useFarmerProfile } from '@/context/FarmerProfileContext';
import { APP_LANGUAGES } from '@/lib/languages';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const FarmerVoiceAssistant = dynamic(() => import('@/components/FarmerVoiceAssistant'), { ssr: false });

// ── All real features ──────────────────────────────────────────
const FEATURES = [
  { id: 'dashboard',  icon: Home,           label: 'Dashboard',       labelHi: 'डैशबोर्ड',      href: '/dashboard',   color: '#10b981', bg: '#ecfdf5' },
  { id: 'scanner',    icon: Scan,           label: 'AI Scan',         labelHi: 'AI स्कैन',      href: '/scanner',    color: '#8b5cf6', bg: '#f5f3ff' },
  { id: 'market',     icon: ShoppingBag,    label: 'Kisan Bazaar',    labelHi: 'किसान बाज़ार',   href: '/marketplace',color: '#f59e0b', bg: '#fffbeb' },
  { id: 'community',  icon: Users,          label: 'Community',       labelHi: 'समुदाय',        href: '/community',  color: '#3b82f6', bg: '#eff6ff' },
  { id: 'soil',       icon: FlaskConical,   label: 'Soil Guide',      labelHi: 'मिट्टी गाइड',   href: '/soil',       color: '#92400e', bg: '#fef3c7' },
  { id: 'guide',      icon: BookOpen,       label: 'Crop Guide',      labelHi: 'फसल गाइड',      href: '/guide',      color: '#0ea5e9', bg: '#f0f9ff' },
  { id: 'expert',     icon: Phone,          label: 'Expert Call',     labelHi: 'विशेषज्ञ कॉल',  href: '/expert',     color: '#ef4444', bg: '#fef2f2' },
  { id: 'weather',    icon: Thermometer,    label: 'Weather',         labelHi: 'मौसम',           href: '/dashboard',  color: '#06b6d4', bg: '#ecfeff' },
  { id: 'dosage',     icon: Wheat,          label: 'Dosage Calc',     labelHi: 'खुराक कैलक.',    href: '/scanner',    color: '#65a30d', bg: '#f7fee7' },
  { id: 'growth',     icon: BrainCircuit,   label: 'Growth Care',     labelHi: 'ग्रोथ केयर',    href: '/guide',      color: '#7c3aed', bg: '#f5f3ff' },
  { id: 'history',    icon: History,        label: 'Scan History',    labelHi: 'स्कैन इतिहास',  href: '/dashboard',  color: '#475569', bg: '#f8fafc' },
  { id: 'admin',      icon: BarChart3,      label: 'AI Console',      labelHi: 'AI कंसोल',       href: '/admin',      color: '#db2777', bg: '#fdf2f8' },
];

const SETTINGS_ITEMS = [
  { icon: Globe,    label: 'Language',       labelHi: 'भाषा',           desc: 'Change app language' },
  { icon: Moon,     label: 'Theme',          labelHi: 'थीम',            desc: 'Light / Dark mode' },
  { icon: Mic,      label: 'Voice',          labelHi: 'आवाज़',           desc: 'Voice assistant settings' },
  { icon: Settings, label: 'Farm Details',   labelHi: 'खेत विवरण',      desc: 'Edit your farm profile' },
  { icon: Leaf,     label: 'Crops',          labelHi: 'फसलें',          desc: 'Manage selected crops' },
];

export default function ModernHeader() {
  const { language, setLanguage } = useLanguage();
  const { isDark, toggleTheme } = useAtmosphere();
  const { profile, updateProfile } = useFarmerProfile();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'features' | 'settings' | 'help'>('features');

  // Settings edit state
  const [editField, setEditField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const currentLang = APP_LANGUAGES.find((lang) => lang.name === language) || APP_LANGUAGES[0];
  const triggerHaptic = () => { if (typeof window !== 'undefined' && navigator.vibrate) navigator.vibrate([10]); };

  const startEdit = (field: string, current: string) => { setEditField(field); setEditValue(current); };
  const saveEdit = () => {
    if (!editField || !editValue.trim()) { setEditField(null); return; }
    if (editField === 'farmerType') updateProfile({ farmerType: editValue.trim() });
    if (editField === 'farmSize') updateProfile({ farmSize: editValue.trim() });
    if (editField === 'village') updateProfile({ village: editValue.trim() });
    if (editField === 'state') updateProfile({ state: editValue.trim() });
    setEditField(null);
  };

  const isHindi = language === 'हिंदी' || language === 'भोजपुरी' || language === 'मैथिली';

  return (
    <>
      <header 
        className="sticky top-0 z-[60] w-full px-4 py-4 flex items-center justify-between pointer-events-none"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)' }}
      >
        {/* ── LEFT: ASSISTANT CHIP ── */}
        <motion.button
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { triggerHaptic(); setShowAssistant(true); }}
          className="pointer-events-auto flex items-center gap-2.5 rounded-full px-3.5 py-2 bg-white shadow-sm ring-1 ring-slate-900/5"
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-emerald-400 blur-[4px] opacity-40 animate-pulse" />
            <Mic size={16} className="relative z-10 text-emerald-500" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-600">
            {isHindi ? 'सहायक' : 'Assistant'}
          </span>
        </motion.button>

        {/* ── RIGHT: CONTROLS ── */}
        <div className="flex items-center gap-2 pointer-events-auto">

          {/* Language Pill */}
          <div className="relative">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex items-center gap-2 rounded-full px-3 py-1.5 bg-white shadow-sm ring-1 ring-slate-900/5 hover:bg-slate-50 transition-colors"
            >
              <Globe size={14} className="text-slate-400" />
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-tight">{currentLang.name.slice(0, 2)}</span>
              <ChevronDown size={10} className={`text-slate-400 transition-transform ${isLangOpen ? 'rotate-180' : ''}`} />
            </motion.button>

            <AnimatePresence>
              {isLangOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-40 overflow-hidden rounded-2xl bg-white p-1 shadow-xl ring-1 ring-slate-900/5"
                >
                  {APP_LANGUAGES.map((lang) => (
                    <button
                      key={lang.name}
                      onClick={() => { setLanguage(lang.name); setIsLangOpen(false); triggerHaptic(); }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold transition-all ${
                        language === lang.name ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {lang.label}
                      {language === lang.name && <Check size={12} />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Theme Toggle */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => { toggleTheme(); triggerHaptic(); }}
            className="rounded-full p-2 bg-white shadow-sm ring-1 ring-slate-900/5 hover:bg-slate-50 transition-colors"
          >
            {isDark ? <Sun size={14} className="text-amber-500" /> : <Moon size={14} className="text-sky-500" />}
          </motion.button>

          {/* ── HAMBURGER MENU ── */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => { setMenuOpen(true); triggerHaptic(); }}
            className="rounded-full p-2 bg-emerald-500 shadow-sm hover:bg-emerald-600 transition-colors"
            style={{ boxShadow: '0 4px 12px rgba(16,185,129,0.35)' }}
          >
            <Menu size={15} className="text-white" />
          </motion.button>

        </div>
      </header>

      {/* Voice Assistant Modal */}
      <AnimatePresence>
        {showAssistant && (
          <FarmerVoiceAssistant onClose={() => setShowAssistant(false)} />
        )}
      </AnimatePresence>

      {/* ── FULL FEATURES DRAWER ── */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
            />

            {/* Drawer panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed top-[12px] right-[12px] bottom-[12px] z-[150] w-[88%] max-w-sm overflow-y-auto overflow-x-hidden hide-scrollbar rounded-[32px]"
              style={{
                  background: 'linear-gradient(160deg, #ffffff 0%, #f8fafc 100%)',
                  boxShadow: '0 10px 50px rgba(0,0,0,0.2), inset 0 2px 0 rgba(255,255,255,1)',
                  border: '1px solid rgba(255,255,255,0.7)'
              }}
            >
              {/* Drawer header */}
              <div 
                className="sticky top-0 z-10 flex items-center justify-between px-6 pb-5 bg-white/94 backdrop-blur-3xl border-b border-slate-100/50"
                style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}
              >
                <div>
                  <p className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.32em]">Plant Doctor</p>
                  <h2 className="text-xl font-black text-slate-900">
                    {isHindi ? 'सभी फ़ीचर' : 'All Features'}
                  </h2>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setMenuOpen(false)}
                  className="h-9 w-9 rounded-2xl flex items-center justify-center bg-slate-100"
                >
                  <X size={16} className="text-slate-500" />
                </motion.button>
              </div>

              {/* Premium Farmer chip */}
              <div className="mx-5 mt-4 relative overflow-hidden rounded-[24px] p-4 flex items-center gap-4" 
                   style={{ background: 'linear-gradient(135deg, #020617 0%, #0f172a 100%)', boxShadow: '0 8px 32px rgba(15,23,42,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="absolute -right-4 -bottom-4 opacity-10 blur-[2px] pointer-events-none">
                  <Leaf size={100} className="text-emerald-400" />
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl" />
                
                <div className="h-12 w-12 rounded-full flex items-center justify-center font-black text-slate-900 text-lg relative z-10 shrink-0"
                  style={{ background: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)', boxShadow: '0 0 20px rgba(16,185,129,0.4)', border: '1px solid rgba(255,255,255,0.4)' }}>
                  {profile.name.split(' ').map(p => p[0]).join('').slice(0,2).toUpperCase()}
                </div>
                <div className="flex-1 relative z-10 min-w-0">
                  <p className="font-black text-white text-[15px] tracking-tight truncate">{profile.name}</p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                     <span className="px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase border border-white/10" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.9)' }}>
                       {profile.farmerType}
                     </span>
                     <span className="px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase border border-emerald-400/20" style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399' }}>
                       {profile.locationLabel}
                     </span>
                  </div>
                </div>
              </div>

              {/* Tab switch */}
              <div className="mx-5 mt-5 flex rounded-[20px] p-1.5 bg-slate-100/60 backdrop-blur-md border border-slate-200/60">
                {(['features', 'settings', 'help'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => { setActiveTab(tab); triggerHaptic(); }}
                    className={`flex-1 py-2.5 rounded-[14px] text-xs font-black transition-all duration-300 ${
                      activeTab === tab 
                      ? 'bg-white text-slate-900 shadow-[0_4px_16px_rgba(0,0,0,0.06)] border border-slate-100' 
                      : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {tab === 'features'
                      ? (isHindi ? '📱 फ़ीचर' : '📱 Features')
                      : tab === 'settings'
                      ? (isHindi ? '⚙️ सेटिंग' : '⚙️ Settings')
                      : (isHindi ? '📞 मदद' : '📞 Help')}
                  </button>
                ))}
              </div>

              {/* ── FEATURES GRID ── */}
              {activeTab === 'features' && (
                <div className="px-5 mt-5 pb-8">
                  <div className="grid grid-cols-3 gap-3">
                    {FEATURES.map((feat, i) => (
                      <motion.div
                        key={feat.id}
                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: i * 0.03, type: 'spring', stiffness: 300, damping: 24 }}
                      >
                        <Link
                          href={feat.href}
                          onClick={() => setMenuOpen(false)}
                          className="relative flex flex-col items-center justify-center gap-3 p-4 rounded-[22px] overflow-hidden active:scale-90 transition-all duration-300 h-full group"
                          style={{ 
                            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                            boxShadow: '0 6px 20px rgba(0,0,0,0.03), inset 0 2px 0 rgba(255,255,255,1)',
                            border: `1px solid rgba(0,0,0,0.05)`
                          }}
                        >
                          {/* Giant Corner Bleeding Icon */}
                          <div className="absolute top-0 right-0 h-16 w-16 opacity-[0.03] translate-x-4 -translate-y-4 transition-transform duration-500 group-hover:scale-110">
                              <feat.icon size={72} style={{ color: feat.color }} />
                          </div>
                          
                          {/* Inner Glowing Icon Base */}
                          <div className="h-11 w-11 rounded-[16px] flex items-center justify-center relative z-10 transition-transform duration-300 group-hover:scale-105" 
                              style={{ background: `linear-gradient(135deg, ${feat.color}15 0%, ${feat.color}05 100%)`, border: `1px solid ${feat.color}25` }}>
                            <div className="absolute inset-0 rounded-[16px] blur-md translate-y-1.5 opacity-[0.18]" style={{ background: feat.color }} />
                            <feat.icon size={20} style={{ color: feat.color }} className="relative z-10 drop-shadow-sm" />
                          </div>
                          
                          {/* Label */}
                          <p className="text-[10px] font-black text-slate-700 leading-tight tracking-[0.02em] relative z-10 font-[family-name:var(--font-geist-sans)]">
                            {isHindi ? feat.labelHi : feat.label}
                          </p>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── SETTINGS ── */}
              {activeTab === 'settings' && (
                <div className="px-5 py-4 space-y-3 pb-8">

                  {/* Farm details edit */}
                  <div className="rounded-2xl overflow-hidden border border-slate-100">
                    <p className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50">
                      {isHindi ? 'खेत की जानकारी' : 'Farm Details'}
                    </p>
                    {[
                      { field: 'farmerType', label: isHindi ? 'किसान प्रकार' : 'Farmer Type', value: profile.farmerType },
                      { field: 'farmSize',   label: isHindi ? 'खेत का आकार' : 'Farm Size',   value: profile.farmSize },
                      { field: 'village',    label: isHindi ? 'गाँव' : 'Village',              value: profile.village },
                      { field: 'state',      label: isHindi ? 'राज्य' : 'State',              value: profile.state },
                    ].map(({ field, label, value }) => (
                      <div key={field} className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-white">
                        {editField === field ? (
                          <div className="flex-1 flex gap-2">
                            <input
                              autoFocus
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') saveEdit(); }}
                              className="flex-1 text-sm font-bold text-slate-800 bg-emerald-50 border border-emerald-300 rounded-lg px-2 py-1 outline-none"
                            />
                            <button onClick={saveEdit} className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-xs font-black">
                              {isHindi ? 'सेव' : 'Save'}
                            </button>
                          </div>
                        ) : (
                          <>
                            <div>
                              <p className="text-[10px] text-slate-400 font-medium">{label}</p>
                              <p className="text-sm font-bold text-slate-800">{value}</p>
                            </div>
                            <button
                              onClick={() => startEdit(field, value)}
                              className="px-3 py-1 rounded-xl bg-slate-100 text-xs font-black text-slate-600"
                            >
                              {isHindi ? 'बदलें' : 'Edit'}
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Language setting */}
                  <div className="rounded-2xl border border-slate-100 overflow-hidden">
                    <p className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50">
                      {isHindi ? 'भाषा चुनें' : 'App Language'}
                    </p>
                    <div className="grid grid-cols-2 gap-1 p-2 bg-white">
                      {APP_LANGUAGES.map(lang => (
                        <button
                          key={lang.name}
                          onClick={() => { setLanguage(lang.name); triggerHaptic(); }}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black transition-all ${
                            language === lang.name ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {language === lang.name && <Check size={11} className="text-emerald-500 shrink-0" />}
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Theme toggle */}
                  <button
                    onClick={() => { toggleTheme(); triggerHaptic(); }}
                    className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-white border border-slate-100"
                  >
                    <div className="flex items-center gap-3">
                      {isDark ? <Sun size={18} className="text-amber-500" /> : <Moon size={18} className="text-sky-500" />}
                      <div className="text-left">
                        <p className="font-black text-slate-800 text-sm">{isHindi ? 'थीम' : 'Theme'}</p>
                        <p className="text-xs text-slate-400">{isDark ? 'Dark Mode' : 'Light Mode'}</p>
                      </div>
                    </div>
                    <div className={`w-12 h-6 rounded-full transition-colors relative ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
                      <div className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${isDark ? 'left-7' : 'left-1'}`} />
                    </div>
                  </button>

                  {/* Voice toggle */}
                  <button
                    onClick={() => { updateProfile({ voiceEnabled: !profile.voiceEnabled }); triggerHaptic(); }}
                    className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-white border border-slate-100"
                  >
                    <div className="flex items-center gap-3">
                      <Mic size={18} className={profile.voiceEnabled ? 'text-emerald-500' : 'text-slate-400'} />
                      <div className="text-left">
                        <p className="font-black text-slate-800 text-sm">{isHindi ? 'आवाज़ असिस्टेंट' : 'Voice Assistant'}</p>
                        <p className="text-xs text-slate-400">{profile.voiceEnabled ? (isHindi ? 'चालू' : 'Enabled') : (isHindi ? 'बंद' : 'Disabled')}</p>
                      </div>
                    </div>
                    <div className={`w-12 h-6 rounded-full transition-colors relative ${profile.voiceEnabled ? 'bg-emerald-400' : 'bg-slate-200'}`}>
                      <div className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${profile.voiceEnabled ? 'left-7' : 'left-1'}`} />
                    </div>
                  </button>

                  {/* Go to profile */}
                  <Link href="/profile" onClick={() => setMenuOpen(false)}>
                    <div className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-emerald-500 mt-2"
                      style={{ boxShadow: '0 4px 16px rgba(16,185,129,0.3)' }}>
                      <span className="font-black text-white text-sm">{isHindi ? 'पूरी प्रोफ़ाइल देखें' : 'View Full Profile'}</span>
                      <ArrowRight size={16} className="text-white" />
                    </div>
                  </Link>
                </div>
              )}

              {/* ── HELP & SUPPORT ── */}
              {activeTab === 'help' && (
                <div className="px-5 py-6 pb-8 space-y-4">
                  <div className="mb-4 flex flex-col items-center text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                      <HelpCircle size={28} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">{isHindi ? 'मदद चाहिए?' : 'Need Help?'}</h3>
                    <p className="mt-2 text-sm text-slate-500 font-medium">
                      {isHindi ? 'अगर आपको ऐप या मार्केट से कोई भी समस्या आ रही है, तो सीधा हमसे बात करें। हम 24/7 उपलब्ध हैं।' : 'If you are facing any problem with the app or the market, please reach out to us directly. We are here to help you 24/7.'}
                    </p>
                  </div>

                  <a
                    href="tel:8228858145"
                    className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-blue-600 hover:bg-emerald-50/50"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                      <PhoneCall size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{isHindi ? 'कॉल करें' : 'Call Us'}</p>
                      <p className="font-bold text-slate-800 text-lg">8228858145</p>
                    </div>
                  </a>

                  <a
                    href="mailto:ayushpandey10851@gmail.com"
                    className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-blue-600 hover:bg-blue-50/50"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                      <Mail size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{isHindi ? 'ईमेल भेजें' : 'Email Us'}</p>
                      <p className="truncate font-bold text-slate-800 text-[13px]">ayushpandey10851@gmail.com</p>
                    </div>
                  </a>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
