'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Navigation, Layers, Info, Map as MapIcon, Crosshair } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { useFarmerProfile } from '@/context/FarmerProfileContext';

interface SpatialRiskData {
  threat_summary: any;
  heatmap: Array<{ lat: number; lon: number; intensity: number; label: string }>;
  environmental_risk: any;
  field_health_index: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function FieldSpatialExplorer() {
  const { profile } = useFarmerProfile();
  const [data, setData] = useState<SpatialRiskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeThreat, setActiveThreat] = useState<number | null>(null);

  const center = useMemo(() => ({
    lat: profile.latitude || 25.1213,
    lon: profile.longitude || 85.3789
  }), [profile.latitude, profile.longitude]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`${API_BASE}/api/v1/intelligence/spatial-risk?lat=${center.lat}&lon=${center.lon}&radius_km=10`);
        if (res.ok) {
          const json = await res.json();
          if (json.success) setData(json);
        }
      } catch (e) {
        console.error('Spatial Intelligence Error:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [center]);

  // Convert GPS to SVG Coordinates (Relative to center)
  const getCoords = (lat: number, lon: number) => {
    const scale = 1500; // Zoom factor
    const x = 200 + (lon - center.lon) * scale;
    const y = 200 - (lat - center.lat) * scale;
    return { x, y };
  };

  if (loading) return (
    <div className="h-[400px] flex flex-col items-center justify-center bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-50 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
      <div className="w-16 h-16 bg-slate-100 rounded-full mb-4 animate-pulse" />
      <div className="w-40 h-3 bg-slate-100 rounded-full mb-2" />
      <div className="w-24 h-2 bg-slate-50 rounded-full" />
      <p className="mt-8 text-[10px] font-black uppercase tracking-widest text-slate-300">Synchronizing field satellite data...</p>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden bg-[#0a1526]/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-6 text-white min-h-[500px] shadow-2xl"
    >
      {/* HUD Header */}
      <div className="flex justify-between items-center mb-6 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse shadow-[0_0_10px_#60a5fa]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Tactical Farm View</span>
          </div>
          <h3 className="text-2xl font-black tracking-tight">Spatial Discovery</h3>
        </div>

        <div className="flex gap-2">
          <div className="bg-white/5 px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-3">
            <Crosshair className="w-4 h-4 text-emerald-400" />
            <div className="flex flex-col">
              <span className="text-[8px] text-white/40 uppercase font-black">Coordinates</span>
              <span className="text-[10px] font-mono">{center.lat.toFixed(4)}N, {center.lon.toFixed(4)}E</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* SVG Vector Map Engine */}
        <div className="lg:col-span-3 h-[420px] rounded-[2rem] overflow-hidden border border-white/10 relative bg-[#060b14] shadow-inner group">
          {/* Scan Line Animation */}
          <motion.div
            animate={{ top: ['0%', '100%', '0%'] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            className="absolute left-0 right-0 h-[2px] bg-blue-500/30 blur-sm z-20 pointer-events-none"
          />

          <svg viewBox="0 0 400 400" className="w-full h-full cursor-grab active:cursor-grabbing">
            {/* Grid System */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              </pattern>
              <radialGradient id="fieldGlow">
                <stop offset="0%" stopColor="rgba(16, 185, 129, 0.2)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Radar Circles */}
            <circle cx="200" cy="200" r="180" fill="none" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
            <circle cx="200" cy="200" r="120" fill="none" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
            <circle cx="200" cy="200" r="60" fill="none" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />

            {/* Your Field Polygon (Simulated) */}
            <motion.path
              d="M 180,180 L 220,185 L 215,215 L 175,210 Z"
              fill="url(#fieldGlow)"
              stroke="#10b981"
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
            />
            <circle cx="200" cy="200" r="4" fill="#10b981" className="shadow-lg shadow-emerald-500" />

            {/* Threat Orbs */}
            {data?.heatmap.map((threat, i) => {
              const { x, y } = getCoords(threat.lat, threat.lon);
              const isHigh = threat.intensity > 0.6;
              return (
                <g key={i} className="cursor-pointer" onClick={() => setActiveThreat(i)}>
                  <motion.circle
                    initial={{ scale: 0 }}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                    cx={x} cy={y} r="12"
                    fill={isHigh ? "rgba(239, 68, 68, 0.15)" : "rgba(245, 158, 11, 0.15)"}
                  />
                  <circle cx={x} cy={y} r="4" fill={isHigh ? "#ef4444" : "#f59e0b"} />
                  <motion.circle
                    cx={x} cy={y} r="8"
                    fill="none"
                    stroke={isHigh ? "#ef4444" : "#f59e0b"}
                    strokeWidth="1"
                    animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </g>
              )
            })}
          </svg>

          {/* Floating HUD Labels */}
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
            <Navigation className="w-3 h-3 text-emerald-400" />
            <span className="text-[9px] font-bold">PRIMARY_FIELD_ALTA</span>
          </div>

          <AnimatePresence>
            {activeThreat !== null && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-4 left-4 right-4 bg-[#0a1424]/90 backdrop-blur-xl p-4 rounded-2xl border border-red-500/30 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/20 rounded-xl">
                    <ShieldAlert className="w-4 h-4 text-red-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold">{data?.heatmap[activeThreat].label}</h4>
                    <p className="text-[10px] text-white/40">Highly contagious fungal detected nearby</p>
                  </div>
                </div>
                <button onClick={() => setActiveThreat(null)} className="text-[10px] font-bold uppercase text-white/30 hover:text-white">Close</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Intelligence Hub Panel */}
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MapIcon className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-black uppercase tracking-widest">Environment</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <span className="text-[8px] text-white/40 uppercase block mb-1">Health Index</span>
                <span className="text-lg font-black text-emerald-400">{data?.field_health_index}%</span>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <span className="text-[8px] text-white/40 uppercase block mb-1">Risk Factor</span>
                <span className="text-lg font-black text-orange-400">{data?.environmental_risk.risk_score}</span>
              </div>
            </div>
          </div>

          <div className="p-5 bg-gradient-to-br from-white/5 to-transparent rounded-[2rem] border border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <Layers className="w-5 h-5 text-blue-400" />
              <h4 className="text-xs font-black uppercase tracking-widest">Advisory Core</h4>
            </div>
            <p className="text-[11px] leading-relaxed text-white/60 mb-6">
              Conditions are {data?.environmental_risk.risk_level}.
              {data?.environmental_risk.reasons[0]} identified. Increase monitoring.
            </p>
            <button className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 active:scale-95">
              Get Full Report
            </button>
          </div>

          <div className="flex items-center gap-2 p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
            <Info className="w-3 h-3 text-emerald-400" />
            <span className="text-[9px] font-bold text-emerald-200/80">Updating in real-time via satellite feed</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
