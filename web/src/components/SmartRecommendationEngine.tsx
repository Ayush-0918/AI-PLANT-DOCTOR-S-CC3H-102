'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CloudRain, ThermometerSun, Leaf, AlertTriangle, ShieldCheck, ChevronRight, Activity } from 'lucide-react';
import { useMemo } from 'react';
import { useFarmerProfile } from '@/context/FarmerProfileContext';

export default function SmartRecommendationEngine() {
  const { profile } = useFarmerProfile();
  
  // Simulated AI Logic combining Weather + Soil + Disease
  const insight = useMemo<{
     condition: string;
     suggestion: string;
     riskLevel: 'Low' | 'Medium' | 'High';
     actionLabel: string;
  }>(() => {
      // Implementation of Triple-Threat Engine: Weather Data + Soil Type + Disease Diagnosis
      const isRainExpected = true;
      const isSoilClay = true;
      const isDiseaseFungal = true;

      if (isRainExpected && isSoilClay && isDiseaseFungal) {
        return {
          condition: "High Runoff Risk",
          suggestion: "DO NOT SPRAY. Wait 24 hours to prevent runoff due to expected rain on clay soil.",
          riskLevel: 'High',
          actionLabel: "Set 24h Reminder"
        };
      }
      if (profile.farmSize === "Large") {
        return {
          condition: "Low Nitrogen detected in Sector 4",
          suggestion: "Recommend Urea application. Ideal moisture levels present.",
          riskLevel: 'Medium',
          actionLabel: "Order Urea (EMI available)"
        };
      }
      return {
        condition: "High Humidity Alert",
        suggestion: "Fungus risk is elevated. Setup preventative Trichoderma spray.",
        riskLevel: 'High',
        actionLabel: "View Dosage Guide"
      };
  }, [profile.farmSize]);

  if (!insight) return null;

  const triggerHaptic = () => {
     if (navigator.vibrate) navigator.vibrate([20, 30, 20]);
  };

  return (
    <motion.section 
       initial={{ opacity: 0, scale: 0.95 }}
       animate={{ opacity: 1, scale: 1 }}
       className="glass-card mb-4 bg-white/5 border-white/10 p-5 relative overflow-hidden group"
    >
       <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
       
       <div className="flex items-center justify-between relative z-10 mb-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 w-fit">
             <Activity size={14} className="text-indigo-600 animate-pulse" />
             <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-indigo-700">AI Logic Engine</p>
          </div>
          
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest ${
             insight.riskLevel === 'High' ? 'bg-rose-50 border-rose-200 text-rose-700' :
             insight.riskLevel === 'Medium' ? 'bg-amber-50 border-amber-200 text-amber-700' :
             'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}>
             {insight.riskLevel === 'High' && <AlertTriangle size={12} />}
             {insight.riskLevel === 'Medium' && <ThermometerSun size={12} />}
             {insight.riskLevel === 'Low' && <ShieldCheck size={12} />}
             {insight.riskLevel} Risk
          </div>
       </div>

       <div className="relative z-10 space-y-1">
          <h3 className="text-lg font-bold tracking-tight text-white border-l-4 border-indigo-500 pl-3 leading-none mt-1">
             {insight.condition}
          </h3>
          <p className="text-xs font-medium text-slate-300 pl-4 border-l-4 border-transparent mt-2 leading-snug">
             {insight.suggestion}
          </p>
       </div>

       <div className="mt-6 flex justify-between items-center relative z-10 border-t border-slate-200/60 pt-4">
          <div className="flex gap-1.5 h-1.5 w-16">
             <div className={`h-full w-1/3 rounded-full ${insight.riskLevel === 'Low' ? 'bg-emerald-500' : insight.riskLevel === 'Medium' ? 'bg-amber-500' : 'bg-rose-500'}`} />
             <div className={`h-full w-1/3 rounded-full ${insight.riskLevel === 'Medium' || insight.riskLevel === 'High' ? (insight.riskLevel === 'High' ? 'bg-rose-500' : 'bg-amber-500') : 'bg-slate-200'}`} />
             <div className={`h-full w-1/3 rounded-full ${insight.riskLevel === 'High' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]' : 'bg-slate-200'}`} />
          </div>
          <button onClick={triggerHaptic} className="bg-white/10 border border-white/10 text-white px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-transform flex items-center gap-1.5 hover:bg-white/20">
             {insight.actionLabel} <ChevronRight size={14} />
          </button>
       </div>
    </motion.section>
  );
}
