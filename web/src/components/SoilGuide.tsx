'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle, ChevronRight, Droplets, LeafyGreen, Mountain, Sprout, Wind } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function SoilGuide() {
  const [soilType, setSoilType] = useState<string>('Loam');
  const [nitrogen, setNitrogen] = useState(65);
  const [phosphorus, setPhosphorus] = useState(40);
  const [potassium, setPotassium] = useState(80);
  const [phLevel, setPhLevel] = useState(6.8);

  const triggerHaptic = () => {
    if (navigator.vibrate) navigator.vibrate(15);
  };

  const soilTypes = [
    { id: 'Loam', icon: LeafyGreen, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { id: 'Clay', icon: Mountain, color: 'text-amber-700', bg: 'bg-amber-50' },
    { id: 'Sandy', icon: Wind, color: 'text-orange-400', bg: 'bg-orange-50' },
    { id: 'Peaty', icon: Droplets, color: 'text-blue-800', bg: 'bg-blue-50' }
  ];

  return (
    <div className="space-y-6 pb-24">
      <header className="space-y-2">
         <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-amber-700">Earth Engine</p>
         <h1 className="text-4xl font-bold tracking-tight text-slate-900">Soil Diagnostics</h1>
         <p className="text-sm font-medium text-slate-600">Tune your soil profile to get AI-driven crop and fertilizer matches.</p>
      </header>

      {/* Soil Type Selector */}
      <section>
        <h2 className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400 mb-3 px-1">Base Terrain</h2>
        <div className="grid grid-cols-4 gap-3">
           {soilTypes.map(type => (
             <button 
               key={type.id}
               onClick={() => { triggerHaptic(); setSoilType(type.id); }}
               className={`relative flex flex-col items-center gap-2 p-4 rounded-[1.8rem] transition-all overflow-hidden ${soilType === type.id ? 'bg-slate-900 text-white shadow-xl scale-105 z-10' : 'bg-white text-slate-500 border border-slate-100'}`}
             >
                {soilType === type.id && (
                   <motion.div layoutId="soil-active" className="absolute inset-0 bg-gradient-to-br from-slate-800 to-black -z-10" />
                )}
                <type.icon size={28} className={soilType === type.id ? 'text-amber-400' : type.color} />
                <span className="text-[10px] font-bold uppercase tracking-widest">{type.id}</span>
             </button>
           ))}
        </div>
      </section>

      {/* Liquid Nutrient Sliders */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
           <h2 className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">NPK Balance</h2>
           <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Live Scan</span>
        </div>

        <div className="bg-white/80 backdrop-blur-3xl border border-white/70 p-5 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] space-y-6">
           <LiquidSlider label="Nitrogen (N)" value={nitrogen} max={100} color="emerald" onChange={(v) => { setNitrogen(v); triggerHaptic(); }} />
           <LiquidSlider label="Phosphorus (P)" value={phosphorus} max={100} color="amber" onChange={(v) => { setPhosphorus(v); triggerHaptic(); }} />
           <LiquidSlider label="Potassium (K)" value={potassium} max={100} color="indigo" onChange={(v) => { setPotassium(v); triggerHaptic(); }} />
        </div>
      </section>

      {/* pH Meter (Curved/Arc representation simulation) */}
      <section className="bg-gradient-to-br from-slate-900 to-black rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden text-white">
         <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-[80px] pointer-events-none" />
         
         <div className="flex justify-between items-start relative z-10">
            <div>
               <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-400">Acidity Level</p>
               <h3 className="text-5xl font-bold mt-1">{phLevel.toFixed(1)}</h3>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 text-[10px] font-bold uppercase tracking-widest">
               {phLevel < 6 ? 'Acidic' : phLevel > 7.5 ? 'Alkaline' : 'Optimal'}
            </div>
         </div>

         <div className="mt-8 relative z-10 pb-4">
            <input 
              type="range" 
              min="4" max="9" step="0.1" 
              value={phLevel} 
              onChange={(e) => { setPhLevel(parseFloat(e.target.value)); triggerHaptic(); }}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer outline-none slider-thumb-premium"
            />
            <style jsx>{`
              .slider-thumb-premium::-webkit-slider-thumb {
                appearance: none;
                width: 24px;
                height: 24px;
                background: #34d399;
                border-radius: 50%;
                border: 4px solid #fff;
                box-shadow: 0 0 20px rgba(52, 211, 153, 0.5);
              }
            `}</style>
            <div className="flex justify-between mt-3 text-[10px] font-bold text-white/50 uppercase tracking-widest">
               <span>4.0</span>
               <span className="text-emerald-400">6.5-7.5</span>
               <span>9.0</span>
            </div>
         </div>
      </section>

      {/* AI Prescriptions */}
      <section className="space-y-4">
         <h2 className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400 px-1">AI Prescription</h2>
         
         <div className="bg-[#FFF8E7] border border-[#F2D799] p-5 rounded-[2rem] shadow-sm flex gap-4">
            <div className="w-12 h-12 rounded-[1.2rem] bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
               <AlertCircle size={24} />
            </div>
            <div>
               <p className="text-lg font-bold text-amber-950 leading-tight">Phosphorus Deficient</p>
               <p className="text-sm font-medium text-amber-800/70 mt-1">Root development will be stunted. Apply Rock Phosphate immediately.</p>
               <button className="mt-3 bg-amber-900 text-amber-50 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest active:scale-95 transition-transform flex items-center gap-1">
                  View Market <ChevronRight size={14} />
               </button>
            </div>
         </div>

         <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-[2rem] shadow-sm flex gap-4">
            <div className="w-12 h-12 rounded-[1.2rem] bg-emerald-200/50 flex items-center justify-center text-emerald-700 shrink-0">
               <CheckCircle size={24} />
            </div>
            <div>
               <p className="text-lg font-bold text-emerald-950 leading-tight">Nitrogen Optimal</p>
               <p className="text-sm font-medium text-emerald-800/70 mt-1">Leaf growth is supported. Maintain current urea schedule.</p>
            </div>
         </div>
      </section>
    </div>
  );
}

function LiquidSlider({ label, value, max, color, onChange }: { label: string; value: number; max: number; color: 'emerald' | 'amber' | 'indigo'; onChange: (v: number) => void }) {
  const colorMap = {
     emerald: { bg: 'bg-emerald-100', fill: 'bg-emerald-500', text: 'text-emerald-700' },
     amber: { bg: 'bg-amber-100', fill: 'bg-amber-500', text: 'text-amber-700' },
     indigo: { bg: 'bg-indigo-100', fill: 'bg-indigo-500', text: 'text-indigo-700' }
  };
  const theme = colorMap[color];

  return (
     <div>
        <div className="flex justify-between items-end mb-3">
           <p className="text-sm font-bold text-slate-800">{label}</p>
           <p className={`text-2xl font-bold ${theme.text}`}>{value}%</p>
        </div>
        <div 
          className={`relative h-12 ${theme.bg} rounded-[1.5rem] overflow-hidden cursor-pointer shadow-inner`}
          onClick={(e) => {
             const rect = e.currentTarget.getBoundingClientRect();
             const x = e.clientX - rect.left;
             onChange(Math.round((x / rect.width) * max));
          }}
        >
           <motion.div 
             className={`absolute inset-y-0 left-0 ${theme.fill} rounded-[1.5rem]`}
             initial={{ width: 0 }}
             animate={{ width: `${(value / max) * 100}%` }}
             transition={{ type: 'spring', bounce: 0.2, duration: 0.8 }}
           >
              <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.3)_50%,transparent)] w-[200%] animate-[shimmer_2s_infinite]" />
           </motion.div>
        </div>
     </div>
  );
}
