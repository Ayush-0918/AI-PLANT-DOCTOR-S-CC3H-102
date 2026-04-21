'use client';

import { motion } from 'framer-motion';
import { Wind, Cloud, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { useMemo } from 'react';

interface SprayAdvisorProps {
  weather: {
    wind_speed: string;
    humidity: string;
    description: string;
  } | null;
}

export default function SprayAdvisor({ weather }: SprayAdvisorProps) {
  const analysis = useMemo(() => {
    if (!weather) return null;
    
    // Check if wind_speed and humidity strings contain numbers or are null
    const wind = parseFloat(weather.wind_speed?.replace(/[^0-9.]/g, '') || '0');
    const humidity = parseFloat(weather.humidity?.replace(/[^0-9.]/g, '') || '0');
    const isRaining = weather.description.toLowerCase().includes('rain');
    
    let status: 'optimal' | 'caution' | 'danger' = 'optimal';
    let reason = 'Perfect conditions for spraying.';
    
    if (isRaining) {
      status = 'danger';
      reason = 'Rain detected. Fungicides will wash off.';
    } else if (wind > 15) {
      status = 'danger';
      reason = 'High wind drift alert. Ineffective coverage.';
    } else if (wind > 10 || humidity > 85) {
      status = 'caution';
      reason = 'Moderate drift/humidity risk. Monitor closely.';
    }
    
    return { status, reason, wind, humidity };
  }, [weather]);

  if (!analysis) return (
    <div className="h-40 flex flex-col items-center justify-center bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 text-center animate-pulse">
       <span className="text-xl mb-2">🌬️</span>
       <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Weather Intelligence...</h4>
    </div>
  );

  const colors = {
    optimal: { bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a', icon: CheckCircle2 },
    caution: { bg: '#fffbeb', border: '#fde68a', text: '#d97706', icon: Clock },
    danger: { bg: '#fef2f2', border: '#fecaca', text: '#ef4444', icon: AlertCircle },
  };

  const { bg, border, text, icon: Icon } = colors[analysis.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[2rem] p-5 shadow-sm border h-full flex flex-col justify-between"
      style={{ background: bg, borderColor: border }}
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5" style={{ color: text }} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: text }}>
              AI Spray Advisor
            </span>
          </div>
          <div className="px-3 py-1 rounded-full bg-white/50 border border-current text-[10px] font-black uppercase" style={{ color: text, borderColor: `${text}30` }}>
            {analysis.status}
          </div>
        </div>

        <h4 className="text-base font-black text-slate-800 leading-tight mb-2">
          {analysis.reason}
        </h4>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-white/60 p-3 rounded-2xl border border-white/80 shadow-inner">
            <div className="flex items-center gap-1.5 mb-1">
              <Wind size={12} className="text-slate-400" />
              <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Wind Speed</span>
            </div>
            <p className="text-sm font-black text-slate-700 leading-none">{analysis.wind} km/h</p>
          </div>
          <div className="bg-white/60 p-3 rounded-2xl border border-white/80 shadow-inner">
            <div className="flex items-center gap-1.5 mb-1">
              <Cloud size={12} className="text-slate-400" />
              <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Humidity</span>
            </div>
            <p className="text-sm font-black text-slate-700 leading-none">{analysis.humidity}%</p>
          </div>
        </div>

        <div className="pt-4 border-t border-black/5">
          <p className="text-[10px] font-black text-slate-400 leading-relaxed uppercase tracking-tighter opacity-70">
            Premium Tip: Optimal droplet size for current wind is 300-400μm.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
