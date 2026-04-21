'use client';

import { motion } from 'framer-motion';

interface SkeletonMorphProps {
  className?: string;
}

export function SkeletonMorph({ className = '' }: SkeletonMorphProps) {
  return (
    <div className={`relative overflow-hidden bg-slate-100 rounded-[2rem] ${className}`}>
       <motion.div
         className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent z-10"
         animate={{ x: ['-100%', '100%'] }}
         transition={{ 
            repeat: Infinity, 
            duration: 1.5, 
            ease: "easeInOut" 
         }}
       />
       
       <motion.div
          className="absolute inset-0 bg-slate-200"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{
             repeat: Infinity,
             duration: 2,
             ease: "easeInOut"
          }}
       />
    </div>
  );
}
