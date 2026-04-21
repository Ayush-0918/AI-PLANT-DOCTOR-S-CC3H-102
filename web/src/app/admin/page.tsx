'use client';

import { motion } from 'framer-motion';
import {
  Activity, AlertTriangle, ArrowLeft, BarChart3, Brain, CheckCircle2, ChevronRight,
  Clock, Database, Gauge, Package, RefreshCw, Server, ShieldCheck, Signal, Wifi, Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchJson, getBackendAssetUrl } from '@/lib/api';

type AccuracyResponse = {
  status?: string;
  error?: string;
  accuracy_pct?: number;
  dataset_classes?: number;
  train_samples?: number;
  val_samples?: number;
  confusion_matrix_route?: string;
  active_model?: {
    model_version?: string;
    architecture?: string;
    confidence_threshold?: number;
  };
  field_validation?: {
    field_accuracy_pct?: number;
    status?: string;
    message?: string;
  };
  feedback_summary?: {
    feedback_count?: number;
    feedback_accuracy_pct?: number | null;
  };
};

type ObservabilityResponse = {
  prediction_count?: number;
  low_confidence_rate_pct?: number;
  avg_latency_ms?: number | null;
  latency_p95_ms?: number | null;
  feedback_accuracy_pct?: number | null;
  top_diseases?: Array<{ name: string; count: number }>;
  drift?: {
    status?: string;
    js_divergence?: number | null;
    message?: string;
  };
};

type HealthResponse = {
  dependencies?: {
    database?: string;
    active_model?: { model_version?: string; architecture?: string };
  };
};

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = '#7dd3fc',
  delay = 0,
  fullWidth = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  delay?: number;
  fullWidth?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`relative rounded-[22px] p-5 overflow-hidden ${fullWidth ? 'col-span-2' : ''}`}
      style={{
        background: 'linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(8,14,28,0.95) 100%)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      {/* Glow blob */}
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl pointer-events-none opacity-20"
        style={{ background: color }} />

      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-xl"
          style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
          <Icon size={14} style={{ color }} />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/40">{label}</p>
      </div>

      <p className="text-3xl font-black text-white leading-none tracking-tight">{value}</p>
      {sub && <p className="mt-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: `${color}90` }}>{sub}</p>}
    </motion.div>
  );
}

function AccuracyBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">{label}</span>
        <span className="text-xs font-black text-white">{value.toFixed(1)}%</span>
      </div>
      <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}, ${color}aa)` }}
        />
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, badge }: { icon: React.ElementType; title: string; badge?: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl"
          style={{ background: 'rgba(125,211,252,0.1)', border: '1px solid rgba(125,211,252,0.2)' }}>
          <Icon size={15} className="text-sky-300" />
        </div>
        <h2 className="text-base font-black text-white">{title}</h2>
      </div>
      {badge && (
        <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(125,211,252,0.1)', color: '#7dd3fc', border: '1px solid rgba(125,211,252,0.15)' }}>
          {badge}
        </span>
      )}
    </div>
  );
}

export default function AdminPage() {
  const [accuracy, setAccuracy] = useState<AccuracyResponse | null>(null);
  const [observability, setObservability] = useState<ObservabilityResponse | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState('');
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [healthData, accuracyData, observabilityData] = await Promise.all([
        fetchJson<HealthResponse>('/api/v1/health'),
        fetchJson<AccuracyResponse>('/api/v1/admin/ai/model/accuracy'),
        fetchJson<ObservabilityResponse>('/api/v1/admin/ai/observability?window_hours=168'),
      ]);
      setHealth(healthData);
      setAccuracy(accuracyData);
      setObservability(observabilityData);
      setRefreshedAt(new Date());
      setError('');
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Failed to load admin telemetry.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Error state ──
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4"
        style={{ background: 'linear-gradient(160deg, #070f1c 0%, #0a1426 100%)' }}>
        <div className="text-center space-y-4">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20">
            <AlertTriangle size={28} className="text-rose-400" />
          </div>
          <p className="text-white font-black text-lg">Telemetry Unavailable</p>
          <p className="text-white/50 text-sm">{error}</p>
          <button onClick={load}
            className="mt-4 flex items-center gap-2 mx-auto px-5 py-2.5 rounded-full text-xs font-black text-sky-200 border border-sky-500/30 bg-sky-500/10">
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Loading state ──
  if (loading || !accuracy || !observability || !health) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(160deg, #070f1c 0%, #0a1426 100%)' }}>
        <div className="text-center space-y-4">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-sky-500/10 border border-sky-500/20 animate-pulse">
            <Activity size={28} className="text-sky-400" />
          </div>
          <p className="text-sky-200/60 text-[11px] font-black uppercase tracking-[0.3em] animate-pulse">
            Syncing Live Telemetry...
          </p>
        </div>
      </div>
    );
  }

  const dbConnected = health.dependencies?.database === 'connected';
  const activeModel = accuracy.active_model?.model_version || health.dependencies?.active_model?.model_version || 'Unknown';
  const fieldAccuracy = accuracy.field_validation?.field_accuracy_pct ?? 0;
  const inDomainAcc = accuracy.accuracy_pct ?? 0;
  const confusionMatrixUrl = accuracy.confusion_matrix_route ? getBackendAssetUrl(accuracy.confusion_matrix_route) : '';
  const maxCount = Math.max(...(observability.top_diseases || []).map(d => d.count), 1);
  const driftStatus = observability.drift?.status || 'insufficient_data';
  const isDriftHigh = driftStatus === 'high';

  return (
    <div className="min-h-screen pb-24 px-4 pt-0"
      style={{ background: 'linear-gradient(160deg, #070f1c 0%, #0a1426 60%, #060d1a 100%)' }}>

      {/* ── HEADER ── */}
      <div className="sticky top-0 z-50 pt-4 pb-3 -mx-4 px-4"
        style={{
          background: 'linear-gradient(180deg, rgba(7,15,28,0.97), rgba(7,15,28,0.88))',
          backdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard"
              className="flex h-9 w-9 items-center justify-center rounded-xl transition-opacity active:opacity-60"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <ArrowLeft size={16} className="text-white/60" />
            </Link>
            <div>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <p className="text-[9px] font-black uppercase tracking-[0.28em] text-cyan-400/80">Live Console</p>
              </div>
              <h1 className="text-lg font-black text-white leading-tight tracking-tight">Operations Console</h1>
            </div>
          </div>
          <button onClick={load}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black text-white/50 active:opacity-60 transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <RefreshCw size={11} />
            Refresh
          </button>
        </div>
        {refreshedAt && (
          <p className="mt-1.5 text-[9px] text-white/20 font-medium pl-12">
            Last synced: {refreshedAt.toLocaleTimeString('en-IN')}
          </p>
        )}
      </div>

      <div className="mt-5 space-y-4">

        {/* ── SYSTEM STATUS BANNER ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between rounded-[20px] px-5 py-4"
          style={{
            background: dbConnected
              ? 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(16,185,129,0.04) 100%)'
              : 'linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(239,68,68,0.04) 100%)',
            border: `1px solid ${dbConnected ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
          }}
        >
          <div className="flex items-center gap-3">
            {dbConnected
              ? <CheckCircle2 size={20} className="text-emerald-400" />
              : <AlertTriangle size={20} className="text-rose-400" />}
            <div>
              <p className="font-black text-white text-sm">{dbConnected ? 'All Systems Operational' : 'Database Degraded'}</p>
              <p className="text-[10px] text-white/40 font-medium mt-0.5">MobileNetV3 · FastAPI · MongoDB</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{
              background: dbConnected ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
              border: `1px solid ${dbConnected ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
            }}>
            <Wifi size={11} className={dbConnected ? 'text-emerald-400' : 'text-rose-400'} />
            <span className={`text-[10px] font-black ${dbConnected ? 'text-emerald-300' : 'text-rose-300'}`}>
              {dbConnected ? 'Online' : 'Offline'}
            </span>
          </div>
        </motion.div>

        {/* ── STAT GRID ── */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={Zap} label="Predictions" value={observability.prediction_count ?? 0} sub="Last 168 Hours" color="#7dd3fc" delay={0.05} />
          <StatCard icon={Clock} label="Latency P95" value={`${observability.latency_p95_ms ?? 'N/A'}ms`} sub="Inference Tail" color="#fbbf24" delay={0.1} />
          <StatCard icon={ShieldCheck} label="Field Audit" value={fieldAccuracy > 0 ? `${fieldAccuracy.toFixed(1)}%` : 'Pending'} sub="Real-World Acc" color={fieldAccuracy >= 70 ? '#34d399' : '#f87171'} delay={0.15} />
          <StatCard icon={Gauge} label="Avg Latency" value={`${observability.avg_latency_ms ?? 'N/A'}ms`} sub="Inference Mean" color="#a78bfa" delay={0.2} />
        </div>

        {/* ── MODEL REGISTRY ── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-[24px] p-5 space-y-5"
          style={{
            background: 'linear-gradient(135deg, rgba(15,23,42,0.9), rgba(8,14,28,0.95))',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
          }}
        >
          <SectionHeader icon={Package} title="Model Registry" badge="Active" />

          <div className="rounded-[18px] p-4 space-y-1"
            style={{ background: 'rgba(125,211,252,0.04)', border: '1px solid rgba(125,211,252,0.1)' }}>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-sky-400/60">Active Version</p>
            <p className="font-black text-white text-sm leading-snug break-all">{activeModel}</p>
            <p className="text-xs text-white/40 font-medium">{accuracy.active_model?.architecture || 'Architecture N/A'}</p>
          </div>

          <div className="space-y-3">
            <AccuracyBar label="In-domain Accuracy" value={inDomainAcc} color="#34d399" />
            <AccuracyBar label="Field (Real-World) Accuracy" value={fieldAccuracy} color={fieldAccuracy >= 70 ? '#34d399' : '#fb923c'} />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Confidence Threshold', value: `${accuracy.active_model?.confidence_threshold ?? 'N/A'}%`, color: '#7dd3fc' },
              { label: 'Train Samples', value: new Intl.NumberFormat('en-US').format(accuracy.train_samples ?? 0), color: '#a78bfa' },
              { label: 'Val Samples', value: new Intl.NumberFormat('en-US').format(accuracy.val_samples ?? 0), color: '#fbbf24' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-[14px] p-3 text-center"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-[8px] font-black uppercase tracking-wider text-white/30 leading-tight mb-1">{label}</p>
                <p className="text-base font-black leading-none" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>

          {confusionMatrixUrl ? (
            <div className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
              <img src={confusionMatrixUrl} alt="Confusion Matrix"
                className="w-full object-cover opacity-90 hover:opacity-100 transition-opacity" />
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-8 text-center">
              <Brain size={24} className="text-white/20 mx-auto mb-2" />
              <p className="text-[10px] font-black uppercase tracking-widest text-white/20">
                Awaiting Matrix Generation
              </p>
            </div>
          )}
        </motion.section>

        {/* ── OBSERVABILITY ── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-[24px] p-5 space-y-4"
          style={{
            background: 'linear-gradient(135deg, rgba(15,23,42,0.9), rgba(8,14,28,0.95))',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
          }}
        >
          <SectionHeader icon={Activity} title="Observability" badge="168h Window" />

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Low Confidence', value: `${observability.low_confidence_rate_pct ?? 0}%`, color: '#f87171', bg: 'rgba(248,113,113,0.07)' },
              { label: 'Feedback Acc', value: (observability.feedback_accuracy_pct ?? accuracy.feedback_summary?.feedback_accuracy_pct) != null ? `${observability.feedback_accuracy_pct ?? accuracy.feedback_summary?.feedback_accuracy_pct}%` : 'N/A', color: '#7dd3fc', bg: 'rgba(125,211,252,0.07)' },
              { label: 'Feedback Count', value: String(accuracy.feedback_summary?.feedback_count ?? 0), color: '#a78bfa', bg: 'rgba(167,139,250,0.07)' },
              { label: 'Dataset Classes', value: String(accuracy.dataset_classes ?? 38), color: '#fbbf24', bg: 'rgba(251,191,36,0.07)' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className="rounded-[16px] p-4"
                style={{ background: bg, border: `1px solid ${color}20` }}>
                <p className="text-[9px] font-black uppercase tracking-[0.18em] mb-1" style={{ color: `${color}80` }}>{label}</p>
                <p className="text-xl font-black leading-none" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ── DRIFT RADAR ── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="relative rounded-[24px] p-5 overflow-hidden"
          style={{
            background: isDriftHigh
              ? 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(8,14,28,0.95))'
              : 'linear-gradient(135deg, rgba(15,23,42,0.9), rgba(8,14,28,0.95))',
            border: `1px solid ${isDriftHigh ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.07)'}`,
          }}
        >
          {isDriftHigh && <div className="absolute -top-12 right-0 w-40 h-40 rounded-full blur-[60px] bg-rose-500/20 pointer-events-none" />}
          <SectionHeader
            icon={Signal}
            title="Drift Radar"
            badge={isDriftHigh ? '⚠️ HIGH' : 'Stable'}
          />
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-[14px] px-4 py-3"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <p className="text-[9px] font-black uppercase tracking-wider text-white/30">Signal Strength</p>
                <p className="text-sm font-black text-white mt-0.5">{driftStatus.replace(/_/g, ' ').toUpperCase()}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black uppercase tracking-wider text-white/30">JSD Metric</p>
                <p className="text-lg font-black text-white mt-0.5">{(observability.drift?.js_divergence ?? 0).toFixed(2)}</p>
              </div>
            </div>
            <p className="text-xs text-white/40 leading-relaxed px-1">
              {observability.drift?.message || 'Statistical comparison running within tolerances.'}
            </p>
          </div>
        </motion.section>

        {/* ── TOP DIAGNOSES ── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-[24px] p-5 space-y-4"
          style={{
            background: 'linear-gradient(135deg, rgba(15,23,42,0.9), rgba(8,14,28,0.95))',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
          }}
        >
          <SectionHeader icon={BarChart3} title="Top AI Diagnoses" badge={`${observability.top_diseases?.length ?? 0} entries`} />

          {(observability.top_diseases && observability.top_diseases.length > 0) ? (
            <div className="space-y-3">
              {observability.top_diseases.slice(0, 8).map((entry, idx) => {
                const pct = Math.round((entry.count / maxCount) * 100);
                const colors = ['#7dd3fc', '#34d399', '#fbbf24', '#a78bfa', '#f87171', '#fb923c', '#6ee7d8', '#c4b5fd'];
                const color = colors[idx % colors.length];
                const cleanName = entry.name.replace(/___/g, ' → ').replace(/_/g, ' ');
                return (
                  <div key={entry.name} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-[10px] w-5 shrink-0 font-black text-white/30">#{idx + 1}</span>
                        <p className="text-xs font-bold text-white/85 truncate">{cleanName}</p>
                      </div>
                      <span className="text-xs font-black px-2.5 py-0.5 rounded-full shrink-0"
                        style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
                        {entry.count}
                      </span>
                    </div>
                    <div className="ml-7 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.4 + idx * 0.05, duration: 0.6, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, ${color}, ${color}80)` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-10 text-center">
              <Server size={24} className="text-white/20 mx-auto mb-2" />
              <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Awaiting Telemetry Sync</p>
            </div>
          )}

          <Link href="/dashboard"
            className="mt-2 flex items-center justify-center gap-2 w-full rounded-2xl py-3.5 text-xs font-black transition-all active:scale-95"
            style={{
              background: 'linear-gradient(135deg, rgba(125,211,252,0.1), rgba(125,211,252,0.04))',
              border: '1px solid rgba(125,211,252,0.15)',
              color: '#7dd3fc',
            }}>
            Back to Dashboard <ChevronRight size={13} />
          </Link>
        </motion.section>

      </div>
    </div>
  );
}
