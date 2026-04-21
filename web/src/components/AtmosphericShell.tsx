'use client';

import { useAtmosphere } from '@/context/AtmosphericContext';
import { motion } from 'framer-motion';

export default function AtmosphericShell({ children }: { children: React.ReactNode }) {
  const { glowColor, healthScore, timeOfDay } = useAtmosphere();

  const isNight = timeOfDay === 'night';
  const glowIntensity = healthScore >= 90 ? '0.35' : healthScore >= 60 ? '0.18' : '0.25';

  return (
    <div
      className="relative min-h-screen transition-all duration-[3000ms] ease-in-out"
      style={{
        background: isNight
          ? 'linear-gradient(145deg, #06101d 0%, #0a1728 46%, #0f2337 100%)'
          : undefined,
      }}
    >
      {/* Subtle time-based radial ambient glow */}
      <motion.div
        className="fixed inset-0 pointer-events-none z-0"
        animate={{ opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          background: `radial-gradient(ellipse 60% 40% at 50% 0%, ${glowColor}${Math.round(parseFloat(glowIntensity) * 255).toString(16).padStart(2, '0')} 0%, transparent 68%)`,
        }}
      />

      {/* Health glow ring — edge-of-screen shimmer */}
      <motion.div
        className="fixed inset-0 pointer-events-none z-[100] rounded-[inherit]"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          boxShadow: `inset 0 0 72px 10px ${glowColor}${Math.round(parseFloat(glowIntensity) * 0.7 * 255).toString(16).padStart(2, '0')}`,
        }}
      />

      {/* Floating ambient blob */}
      <div
        className="fixed top-[-20%] left-[-15%] w-[70vw] h-[70vw] rounded-full blur-[120px] pointer-events-none z-0 transition-all duration-[3000ms]"
        style={{ background: `${glowColor}16` }}
      />
      <div
        className="fixed bottom-[-15%] right-[-15%] w-[60vw] h-[60vw] rounded-full blur-[100px] pointer-events-none z-0 transition-all duration-[3000ms]"
        style={{ background: `${glowColor}14` }}
      />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
