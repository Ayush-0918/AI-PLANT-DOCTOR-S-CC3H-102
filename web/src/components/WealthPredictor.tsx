import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, PieChart, Share2, Info, ArrowUpRight } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { useFarmerProfile } from '@/context/FarmerProfileContext';
import { useLanguage } from '@/context/LanguageContext';

interface PredictionData {
  crop: string;
  harvest_date: string;
  days_until_harvest: number;
  maturity_progress_pct: number;
  estimated_yield_kg: number;
  projected_revenue_inr: number;
  mandi_price_ref_kg: number;
  confidence_score: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function WealthPredictor() {
  const { profile } = useFarmerProfile();
  const { t, language } = useLanguage();
  const [data, setData] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPrediction = async () => {
    try {
      const crop = profile.crops[0] || 'Wheat';
      const plantingDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(); 
      const area = parseFloat(profile.farmSize) || 1.0;

      const res = await fetch(`${API_BASE}/api/v1/intelligence/yield-prediction?crop=${crop}&planting_date=${plantingDate}&area_acres=${area}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) setData(json.prediction);
      }
    } catch (e) {
      console.error('Wealth Prediction error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrediction();
  }, [profile.crops, profile.farmSize]);

  const [fertAdjust, setFertAdjust] = useState(100);

  // Derived calculations for the "Premium breakdown"
  const stats = useMemo(() => {
    if (!data) return null;
    
    const factor = 1 + (fertAdjust - 100) / 100 * 0.25;
    const income = Math.round(data.projected_revenue_inr * factor);
    const area = parseFloat(profile.farmSize) || 1.0;
    
    // Simulations for missing data points
    const baseInvestmentPerAcre = 25000;
    const fertilizerBasePerAcre = 5000;
    
    const investment = Math.round((baseInvestmentPerAcre + (fertAdjust/100 * fertilizerBasePerAcre)) * area);
    const fertilizerCost = Math.round((fertAdjust/100 * fertilizerBasePerAcre) * area);
    const profit = income - investment;
    const roi = (profit / investment) * 100;
    const yieldKg = Math.round(data.estimated_yield_kg * factor);

    return {
      income,
      investment,
      fertilizerCost,
      profit,
      roi,
      yieldKg
    };
  }, [data, fertAdjust, profile.farmSize]);

  if (loading) return (
    <div className="h-80 flex flex-col items-center justify-center bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-50 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
      <div className="w-12 h-12 bg-slate-100 rounded-2xl mb-4" />
      <div className="w-32 h-3 bg-slate-100 rounded-full mb-2" />
      <div className="w-48 h-2 bg-slate-50 rounded-full" />
    </div>
  );

  if (!data || !stats) return (
    <div className="h-80 flex flex-col items-center justify-center bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 text-center">
       <span className="text-2xl mb-2">📉</span>
       <h4 className="text-sm font-black text-slate-800">No Revenue Data</h4>
       <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Check profile settings</p>
    </div>
  );

  const isHindi = language === 'हिंदी';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-[0_12px_44px_rgba(0,0,0,0.06)]"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-1">
            {t('intel_roi_profitability')}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-slate-900">+{stats.roi.toFixed(2)}%</span>
            <div className="flex h-5 items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0 border border-emerald-500/20 text-[9px] font-black text-emerald-600">
               <TrendingUp size={10} />
               <span>ESTIMATED</span>
            </div>
          </div>
        </div>
        <motion.button 
          whileTap={{ scale: 0.9 }}
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 shadow-sm"
        >
          <Share2 size={18} />
        </motion.button>
      </div>

      {/* Main Breakdown Grid */}
      <div className="space-y-4 mb-8">
        {/* Investment */}
        <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('intel_investment')}</span>
            <span className="text-lg font-black text-slate-800">₹{stats.investment.toLocaleString('en-IN')}</span>
          </div>
          <p className="text-[10px] font-bold text-slate-500">
            {isHindi ? 'खाद' : 'Fertilizer'}: ₹{stats.fertilizerCost.toLocaleString('en-IN')}
          </p>
        </div>

        {/* Expected Income */}
        <div className="rounded-2xl bg-emerald-500/5 p-4 border border-emerald-500/10">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70">{t('intel_expected_income')}</span>
            <span className="text-lg font-black text-emerald-600">₹{stats.income.toLocaleString('en-IN')}</span>
          </div>
          <p className="text-[10px] font-bold text-emerald-500/80">
            {t('intel_yield')}: {stats.yieldKg.toLocaleString('en-IN')} kg
          </p>
        </div>

        {/* Net Profit */}
        <div className="rounded-2xl bg-slate-900 p-4 shadow-lg shadow-slate-900/10">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('intel_net_profit')}</span>
            <span className="text-xl font-black text-white">₹{stats.profit.toLocaleString('en-IN')}</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
             <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
             <p className="text-[9px] font-black uppercase tracking-tighter text-slate-400">
               {t('intel_mandi_signal')}: {isHindi ? 'स्थिर' : 'stable'} (0%)
             </p>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
         <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-200 text-slate-400">
               <Info size={14} />
            </div>
            <p className="text-[9px] font-bold text-slate-400 max-w-[120px] leading-tight">
               {isHindi ? 'मंडी कीमतों के आधार पर दैनिक अपडेट' : 'Updated daily based on Mandi trends'}
            </p>
         </div>
         <motion.button 
           whileTap={{ scale: 0.95 }}
           className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest shadow-md flex items-center gap-2"
         >
           {t('intel_share_roi')}
           <ArrowUpRight size={12} />
         </motion.button>
      </div>

      {/* Floating Interactive Badge (Simulating the slider/interactive feel without being cluttered) */}
      <div className="absolute top-24 -right-8 rotate-90 hidden sm:block">
         <span className="text-[10px] font-black text-slate-200/50 tracking-[0.5em] uppercase">INTELLIGENCE SUITE</span>
      </div>
    </motion.div>
  );
}
