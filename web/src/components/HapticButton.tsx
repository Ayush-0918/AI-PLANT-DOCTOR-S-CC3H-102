'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';
import { useAtmosphere } from '@/context/AtmosphericContext';

interface HapticButtonProps extends HTMLMotionProps<'button'> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  glowOnHover?: boolean;
}

export default function HapticButton({
  children,
  variant = 'primary',
  glowOnHover = true,
  className = '',
  ...props
}: HapticButtonProps) {
  const { glowColor } = useAtmosphere();

  const base = "relative overflow-hidden font-bold rounded-[2rem] transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
  const variants = {
    primary:   "bg-emerald-500 text-white px-8 py-4 shadow-xl",
    secondary: "bg-white text-slate-800 border border-slate-100 px-8 py-4 shadow-md",
    ghost:     "bg-transparent text-slate-600 px-6 py-3",
  };

  return (
    <motion.button
      whileTap={{ scale: 0.93, y: 1 }}
      whileHover={{ scale: 1.03, y: -1 }}
      transition={{ type: 'spring', stiffness: 600, damping: 18 }}
      className={`${base} ${variants[variant]} ${className}`}
      style={glowOnHover && variant === 'primary' ? {
        boxShadow: `0 10px 30px -5px ${glowColor}50`,
      } : undefined}
      {...props}
    >
      {/* Shimmer layer on hover */}
      <motion.span
        className="absolute inset-0 shimmer pointer-events-none opacity-0"
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
      {children}
    </motion.button>
  );
}
