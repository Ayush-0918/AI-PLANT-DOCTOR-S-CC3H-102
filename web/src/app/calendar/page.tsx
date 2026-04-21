'use client';

import { motion } from 'framer-motion';
import { ChevronLeft, Clock, ShieldCheck, Sprout, Loader2, CalendarDays, Share2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useFarmerProfile } from '@/context/FarmerProfileContext';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

type LifecycleTask = {
  day_offset: number;
  due_date: string;
  category: string;
  task: string;
  status: 'completed' | 'current' | 'upcoming';
};

type LifecycleResponse = {
  success: boolean;
  crop: string;
  sowing_date: string;
  window_days: number;
  tasks: LifecycleTask[];
  next_critical?: LifecycleTask | null;
};

function toDateInputValue(value: Date): string {
  const y = value.getFullYear();
  const m = `${value.getMonth() + 1}`.padStart(2, '0');
  const d = `${value.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function CalendarPage() {
  const { t, language } = useLanguage();
  const { profile } = useFarmerProfile();
  const selectedCrop = profile.activeCrop || profile.crops?.[0] || 'Wheat';

  const [sowingDate, setSowingDate] = useState(() => {
    const fallback = new Date();
    fallback.setDate(fallback.getDate() - 28);
    return toDateInputValue(fallback);
  });
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<LifecycleTask[]>([]);
  const [harvestDate, setHarvestDate] = useState('');
  const [error, setError] = useState('');

  const isHindi = language !== 'English';

  useEffect(() => {
    let active = true;
    async function loadLifecycle() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(
          `${API_BASE}/api/v1/intelligence/crop-lifecycle?crop=${encodeURIComponent(selectedCrop)}&sowing_date=${encodeURIComponent(
            sowingDate
          )}&window_days=90`
        );
        if (!res.ok) throw new Error(`lifecycle_${res.status}`);
        const data: LifecycleResponse = await res.json();
        if (!active) return;
        setTasks(data.tasks || []);
        if (data.tasks?.length) {
          const maxDay = Math.max(...data.tasks.map((item) => item.day_offset));
          const harvest = new Date(sowingDate);
          harvest.setDate(harvest.getDate() + maxDay);
          setHarvestDate(toDateInputValue(harvest));
        } else {
          setHarvestDate('');
        }
      } catch {
        if (!active) return;
        setError('Unable to load lifecycle from AI service. Showing basic fallback tasks.');
        setTasks([
          { day_offset: 0, due_date: sowingDate, category: 'sowing', task: 'Sowing and seed treatment', status: 'completed' },
          { day_offset: 20, due_date: sowingDate, category: 'irrigation', task: 'First irrigation and gap filling', status: 'current' },
          { day_offset: 45, due_date: sowingDate, category: 'nutrition', task: 'Top dressing with balanced fertilizer', status: 'upcoming' },
          { day_offset: 75, due_date: sowingDate, category: 'protection', task: 'Disease and pest scouting round', status: 'upcoming' },
          { day_offset: 90, due_date: sowingDate, category: 'market', task: 'Pre-harvest mandi planning', status: 'upcoming' },
        ]);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadLifecycle();
    return () => {
      active = false;
    };
  }, [selectedCrop, sowingDate]);

  const timeline = useMemo(
    () =>
      tasks.map((m) => ({
        ...m,
        label: m.category.replace('_', ' ').toUpperCase(),
      })),
    [tasks]
  );

  const lifecycleShareHref = useMemo(() => {
    const upcoming = tasks.filter((task) => task.status !== 'completed').slice(0, 4);
    const summary =
      upcoming.length > 0
        ? upcoming.map((task) => `Day ${task.day_offset} (${task.due_date}): ${task.task}`).join('\n')
        : 'Day 0: Sowing and seed treatment';

    const lines = isHindi
      ? [
          `${selectedCrop} का मेरा 90-दिन प्लान शेयर कर रहा/रही हूँ।`,
          `Sowing date: ${sowingDate}`,
          summary,
          'अगर कोई बेहतर सुझाव हो तो बताइए।',
        ]
      : [
          `Sharing my 90-day ${selectedCrop} lifecycle plan.`,
          `Sowing date: ${sowingDate}`,
          summary,
          'Any practical improvements from your field experience?',
        ];

    const params = new URLSearchParams({
      crop: selectedCrop,
      template: 'lifecycle',
      prefill_question: isHindi ? 'मेरे 90-दिन के प्लान पर सुझाव दें।' : 'Please review my 90-day crop plan.',
      prefill: lines.join('\n'),
    });
    return `/community/ask?${params.toString()}`;
  }, [isHindi, selectedCrop, sowingDate, tasks]);

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-32">
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200">
          <ChevronLeft size={20} className="text-slate-600" />
        </Link>
        <h1 className="text-xl font-black text-slate-900">{t('nav_calendar') || 'Crop Calendar'}</h1>
      </div>

      <div className="px-4 py-6">
        <div className="bg-emerald-600 rounded-[2rem] p-6 text-white mb-8 shadow-xl shadow-emerald-900/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Sprout size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Current Crop</p>
              <h2 className="text-xl font-black">{selectedCrop}</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
              <p className="text-[8px] font-bold uppercase opacity-60">Sowing Date</p>
              <div className="mt-1.5 flex items-center gap-2">
                <CalendarDays size={15} />
                <input
                  type="date"
                  value={sowingDate}
                  onChange={(e) => setSowingDate(e.target.value)}
                  className="bg-transparent text-sm font-black text-white outline-none"
                />
              </div>
            </div>
            <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
              <p className="text-[8px] font-bold uppercase opacity-60">90-Day Horizon</p>
              <p className="text-sm font-black mt-1.5">{harvestDate || 'Calculating...'}</p>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-emerald-100/90">
            {isHindi ? 'AI 90-दिन की कार्य सूची अपने आप बना रहा है।' : 'AI is auto-generating your 90-day task list.'}
          </p>
          <Link
            href={lifecycleShareHref}
            className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-white/90 px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-emerald-700"
          >
            <Share2 size={12} />
            {isHindi ? '90-दिन प्लान शेयर करें' : 'Share my 90-day plan'}
          </Link>
        </div>

        {error && <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">{error}</div>}

        {loading ? (
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Loader2 size={16} className="animate-spin" />
            Loading lifecycle tasks...
          </div>
        ) : (
          <div className="relative pl-8 space-y-8 before:absolute before:left-3 before:top-4 before:bottom-0 before:w-0.5 before:bg-slate-200 before:content-['']">
            {timeline.map((m, idx) => (
              <motion.div
                key={`${m.day_offset}-${m.task}-${idx}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="relative"
              >
                <div
                  className={`absolute -left-[29px] top-1 h-5 w-5 rounded-full border-4 border-white ${
                    m.status === 'completed'
                      ? 'bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.1)]'
                      : m.status === 'current'
                        ? 'bg-sky-500 shadow-[0_0_0_4px_rgba(14,165,233,0.1)]'
                        : 'bg-slate-300'
                  }`}
                />

                <div className={`bg-white rounded-2xl p-4 shadow-sm border border-slate-100 ${m.status === 'current' ? 'ring-2 ring-sky-500/20' : ''}`}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="font-black text-slate-800 text-sm">{m.task}</h3>
                    <span className="text-[9px] font-black text-slate-400">Day {m.day_offset}</span>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">{m.label}</p>
                  <p className="text-xs text-slate-500 font-medium mt-1">Due: {m.due_date}</p>
                  {m.status === 'current' && (
                    <div className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-sky-50 text-sky-700 rounded-xl border border-sky-100">
                      <Clock size={12} strokeWidth={3} />
                      <span className="text-[10px] font-black uppercase tracking-wider">Doing this week</span>
                    </div>
                  )}
                  {m.status === 'completed' && (
                    <div className="mt-3 flex items-center gap-2 text-emerald-600 font-bold text-[10px]">
                      <ShieldCheck size={12} strokeWidth={3} />
                      <span>Completed</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
