'use client';

import { motion } from 'framer-motion';
import { ChevronLeft, Calendar, MapPin, Leaf, Search } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type ScanRecord = {
  disease: string;
  confidence: number;
  timestamp: string;
  location?: { coordinates: [number, number] };
};

export default function HistoryPage() {
  const { t } = useLanguage();
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/users/me/history`)
      .then(res => res.json())
      .then(data => {
        if (data && data.scans) {
          setScans(data.scans);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("History fetch error:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-32">
      {/* HEADER */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200">
          <ChevronLeft size={20} className="text-slate-600" />
        </Link>
        <h1 className="text-xl font-black text-slate-900">{t('nav_history') || 'Scan History'}</h1>
      </div>

      <div className="px-4 py-6 space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 w-full bg-slate-100 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : scans.length === 0 ? (
          <div className="text-center py-20">
            <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={24} className="text-slate-300" />
            </div>
            <p className="text-slate-500 font-bold">No scans found yet.</p>
            <Link href="/scanner" className="text-emerald-600 font-black text-sm mt-2 block uppercase tracking-wider">Start Scanning Now</Link>
          </div>
        ) : (
          scans.map((scan, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-start gap-4"
            >
              <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <Leaf size={22} className="text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-black text-slate-800 truncate">{scan.disease.replace(/_/g, ' ')}</h3>
                  <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                    {Math.round(scan.confidence * 100)}%
                  </span>
                </div>
                
                <div className="mt-2 flex items-center gap-3 text-slate-400">
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span className="text-[11px] font-bold">
                      {new Date(scan.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin size={12} />
                    <span className="text-[11px] font-bold">Field 1</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
