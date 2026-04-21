'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  Search,
  MapPin,
  RefreshCcw,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  Filter
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { getBackendBaseUrl } from '@/lib/api';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine 
} from 'recharts';

type MandiPrice = {
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety: string;
  min_price: number;
  max_price: number;
  modal_price: number;
  date: string;
};

type TrendData = {
  commodity: string;
  delta_pct: number;
  trend: 'up' | 'down' | 'stable';
};

const COMMODITIES = ['Wheat', 'Rice', 'Tomato', 'Potato', 'Cotton', 'Soybean', 'Maize', 'Onion'];

export default function MandiIntelligencePage() {
  const { language, t } = useLanguage();
  const [activeCommodity, setActiveCommodity] = useState('Wheat');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [prices, setPrices] = useState<MandiPrice[]>([]);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);

  // Derive charts data
  const chartData = prices
    .filter(p => p.modal_price > 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((p, i) => ({
      name: p.date,
      price: p.modal_price,
      market: p.market
    }))
    // We only take the last 20 records to keep the chart clean if the API returns 50+
    .slice(-20);

  const fetchMandiData = useCallback(async (commodity: string) => {
    setLoading(true);
    setPrices([]);
    try {
      const [priceRes, trendRes] = await Promise.all([
        fetch(`${getBackendBaseUrl()}/api/v1/mandi/prices?commodity=${commodity}&limit=50`),
        fetch(`${getBackendBaseUrl()}/api/v1/mandi/trends?commodity=${commodity}`)
      ]);

      if (priceRes.ok) {
        const payload = await priceRes.json();
        if (payload.success) setPrices(payload.data);
      }
      
      if (trendRes.ok) {
        const payload = await trendRes.json();
        if (payload.success) setTrends(payload.trends);
      }
    } catch (e) {
      console.error('Mandi API failure', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMandiData(activeCommodity);
  }, [activeCommodity, fetchMandiData]);

  // Derived Stats
  const latestPrice = prices.length > 0 ? prices[0].modal_price : 0;
  const highestPrice = prices.length > 0 ? Math.max(...prices.map(p => p.max_price)) : 0;
  const currentTrend = trends.find(t => t.commodity.toLowerCase() === activeCommodity.toLowerCase());
  
  const isUp = currentTrend?.trend === 'up';
  const isStable = currentTrend?.trend === 'stable';
  const delta = currentTrend?.delta_pct || 0;

  return (
    <div 
      className="min-h-screen text-white pb-32"
      style={{
        background: 'radial-gradient(circle at 100% 0%, rgba(20,83,45,0.2) 0%, transparent 40%), linear-gradient(180deg, #070f1c 0%, #0a1426 46%, #081224 100%)',
      }}
    >
      {/* ── HEADER ── */}
      <div 
        className="px-5 pt-4 pb-4 sticky top-0 z-40"
        style={{
          background: 'linear-gradient(180deg, rgba(8,17,31,0.94), rgba(8,17,31,0.82))',
          backdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <Link
            href="/dashboard"
            className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0 transition-opacity active:opacity-70"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <ChevronLeft size={18} className="text-white/70" />
          </Link>

          <div className="flex items-center gap-2">
            <div 
              className="h-8 w-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(52,211,153,0.16)', border: '1px solid rgba(52,211,153,0.25)' }}
            >
              <TrendingUp size={15} className="text-emerald-300" />
            </div>
            <h1 className="text-base font-black text-white tracking-tight">Market Intelligence</h1>
          </div>

          <button 
            onClick={() => fetchMandiData(activeCommodity)}
            className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0 active:rotate-180 transition-transform duration-300"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <RefreshCcw size={14} className="text-white/60" />
          </button>
        </div>

        {/* Categories / Tabs */}
        <div className="flex gap-2 mt-4 overflow-x-auto hide-scrollbar">
          {COMMODITIES.map((c) => {
            const isActive = activeCommodity === c;
            return (
              <button
                key={c}
                onClick={() => setActiveCommodity(c)}
                className="px-4 py-1.5 rounded-full text-xs font-black tracking-wide transition-all duration-200 whitespace-nowrap active:scale-95"
                style={isActive 
                  ? { background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }
                  : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }
                }
              >
                {c}
              </button>
            )
          })}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
           <div className="h-8 w-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin" />
        </div>
      ) : (
        <div className="p-4 space-y-4">
          
          {/* Main Price Card */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[2rem] p-6 relative overflow-hidden group"
            style={{ 
              background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
            }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[40px] rounded-full" />
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400/80 mb-1">
                  National Average
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white tracking-tighter">₹{latestPrice.toLocaleString('en-IN')}</span>
                  <span className="text-sm font-bold text-white/40">/q</span>
                </div>
              </div>
              <div 
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                style={{ 
                  background: isUp ? 'rgba(52,211,153,0.1)' : isStable ? 'rgba(255,255,255,0.05)' : 'rgba(244,63,94,0.1)',
                  border: `1px solid ${isUp ? 'rgba(52,211,153,0.2)' : isStable ? 'rgba(255,255,255,0.1)' : 'rgba(244,63,94,0.2)'}`
                }}
              >
                {isUp ? <TrendingUp size={12} className="text-emerald-400" /> : isStable ? <Filter size={12} className="text-slate-400" /> : <TrendingDown size={12} className="text-rose-400" />}
                <span className={`text-[11px] font-black tracking-widest ${isUp ? 'text-emerald-400' : isStable ? 'text-slate-300' : 'text-rose-400'}`}>
                  {delta > 0 && '+'}{delta}%
                </span>
              </div>
            </div>

            {/* Micro Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 border border-white/5 rounded-2xl p-3">
                 <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">Highest State</p>
               <p className="text-sm font-black text-white">{highestPrice ? `₹${highestPrice}/q` : 'N/A'}</p>
                 <p className="text-[9px] text-emerald-400 mt-1 flex items-center gap-1"><MapPin size={9}/> Premium Demand</p>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-2xl p-3">
                 <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">AI Recommendation</p>
                 <p className="text-sm font-black text-white">{isUp ? 'HOLD' : 'SELL NOW'}</p>
                 <p className="text-[9px] text-sky-400 mt-1 flex items-center gap-1"><Sparkles size={9}/> Smart Timing</p>
              </div>
            </div>
          </motion.div>

          {/* Recharts Chart */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-[2rem] p-5 relative overflow-hidden"
            style={{ 
              background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
              border: '1px solid rgba(255,255,255,0.08)' 
            }}
          >
             <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black text-white/80 uppercase tracking-widest">30-Day Trend Analysis</h3>
                <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">LIVE APMC</span>
             </div>

             <div className="h-48 w-full -ml-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                       dataKey="name" 
                       tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} 
                       tickFormatter={(val) => new Date(val).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                       axisLine={false} 
                       tickLine={false} 
                    />
                    <YAxis 
                       domain={['dataMin - 100', 'dataMax + 100']} 
                       tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }}
                       tickFormatter={(val) => `₹${val}`}
                       axisLine={false} 
                       tickLine={false}
                    />
                    <Tooltip 
                       contentStyle={{ background: 'rgba(8,12,20,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                       itemStyle={{ color: '#34d399', fontWeight: 900, fontSize: '14px' }}
                       labelStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', marginBottom: '4px' }}
                    />
                    <Area 
                       type="monotone" 
                       dataKey="price" 
                       stroke="#34d399" 
                       strokeWidth={3}
                       fillOpacity={1} 
                       fill="url(#colorPrice)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
             </div>
          </motion.div>

          {/* List of latest arrivals */}
          <div>
            <h3 className="text-xs font-black text-white/50 uppercase tracking-widest pl-2 mb-3 mt-6">Latest Mandi Arrivals</h3>
            <div className="space-y-3">
              {prices.slice(0, 8).map((p, i) => (
                <motion.div 
                   key={i}
                   initial={{ opacity: 0, x: -10 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: 0.1 + (i * 0.05) }}
                   className="flex items-center justify-between p-4 rounded-2xl"
                   style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                   <div className="flex gap-3">
                      <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                         <span className="text-emerald-400 font-black text-sm">{p.state.slice(0,2)}</span>
                      </div>
                      <div>
                         <p className="text-sm font-black text-white leading-tight">{p.market}</p>
                         <p className="text-[10px] font-bold text-white/40 mt-0.5">{p.district}, {p.state}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-sm font-black text-emerald-400">₹{p.modal_price}</p>
                      <p className="text-[9px] text-white/30 uppercase tracking-widest mt-0.5">{p.variety}</p>
                   </div>
                </motion.div>
              ))}
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
}
