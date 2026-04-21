'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, X, Sparkles } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export type TourStep = {
   targetId: string;
   title: string;
   description: string;
};

const TOUR_STEPS: TourStep[] = [
   {
      targetId: 'tour-crops',
      title: 'Your Crops',
      description: 'Quickly select or add a crop to get localized advice.'
   },
   {
      targetId: 'tour-weather',
      title: 'Real-time Weather',
      description: 'Live field conditions to help you plan watering and spraying.'
   },
   {
      targetId: 'tour-scanner',
      title: 'Intelligent Diagnosis',
      description: 'Take a picture of any sick plant to get an instant cure.'
   },
   {
      targetId: 'tour-market',
      title: 'Market Intel',
      description: 'AI-driven sell/wait recommendations to maximize your profits.'
   },
   {
      targetId: 'tour-expert',
      title: 'Digital Assistant',
      description: 'Have questions? Tap here to talk to our AI Agronomist anytime.'
   }
];

export default function InteractiveTour() {
   const [currentStepIndex, setCurrentStepIndex] = useState(0);
   const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
   const [isActive, setIsActive] = useState(false);
   const { t } = useLanguage();

   // Start tour if not seen before (for demo, we'll wait 1.5s then start)
   useEffect(() => {
      const hasSeenTour = localStorage.getItem('plant_doctors_tour_seen');
      if (!hasSeenTour) {
         const timer = setTimeout(() => setIsActive(true), 1500);
         return () => clearTimeout(timer);
      }
   }, []);

   useEffect(() => {
      if (!isActive) return;

      const updatePosition = () => {
         const targetId = TOUR_STEPS[currentStepIndex]?.targetId;
         if (!targetId) return;
         
         const el = document.getElementById(targetId);
         if (el) {
            // Smoothly scroll the element into view with some padding
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Small delay to allow scroll to complete before measuring
            setTimeout(() => {
               setTargetRect(el.getBoundingClientRect());
            }, 300);
         }
      };

      updatePosition();
      window.addEventListener('resize', updatePosition);
      return () => window.removeEventListener('resize', updatePosition);
   }, [currentStepIndex, isActive]);

   const handleNext = () => {
      if (currentStepIndex < TOUR_STEPS.length - 1) {
         setCurrentStepIndex(prev => prev + 1);
      } else {
         closeTour();
      }
   };

   const closeTour = () => {
      setIsActive(false);
      localStorage.setItem('plant_doctors_tour_seen', 'true');
   };

   if (!isActive || !targetRect) return null;

   const step = TOUR_STEPS[currentStepIndex];
   // Determine tooltip position. If element is near top, put tooltip below it.
   const placeBelow = targetRect.bottom < window.innerHeight / 2;

   return (
      <div className="fixed inset-0 z-[100] pointer-events-auto">
         {/* Backdrop masking */}
         <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
            onClick={closeTour}
         />

         {/* The Spotlight Hole */}
         <motion.div
            animate={{
               top: targetRect.top - 12,
               left: targetRect.left - 12,
               width: targetRect.width + 24,
               height: targetRect.height + 24
            }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className="absolute rounded-3xl shadow-[0_0_0_9999px_rgba(15,23,42,0.4)] pointer-events-none border-2 border-emerald-400 bg-emerald-400/10 mix-blend-hard-light"
         />

         {/* The Tooltip */}
         <AnimatePresence mode="wait">
            <motion.div
               key={currentStepIndex}
               initial={{ opacity: 0, y: placeBelow ? -20 : 20, scale: 0.95 }}
               animate={{ opacity: 1, y: 0, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               transition={{ type: 'spring', damping: 20, stiffness: 200 }}
               style={{
                  position: 'absolute',
                  top: placeBelow ? targetRect.bottom + 24 : undefined,
                  bottom: !placeBelow ? window.innerHeight - targetRect.top + 24 : undefined,
                  left: Math.max(20, Math.min(targetRect.left, window.innerWidth - 300 - 20)),
                  width: Math.min(300, window.innerWidth - 40)
               }}
               className="bg-white rounded-2xl shadow-2xl p-5 border border-slate-100 z-10"
            >
               <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                     <Sparkles size={12} /> Step {currentStepIndex + 1} of {TOUR_STEPS.length}
                  </div>
                  <button onClick={closeTour} className="text-slate-400 p-1 active:scale-95 transition-transform">
                     <X size={16} />
                  </button>
               </div>
               
               <h3 className="text-lg font-bold text-slate-900 leading-tight">
                  {step.title}
               </h3>
               <p className="text-sm text-slate-500 mt-1.5 font-medium leading-relaxed">
                  {step.description}
               </p>

               <div className="mt-5 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                     {TOUR_STEPS.map((_, i) => (
                        <div key={i} className={`h-1.5 rounded-full transition-all ${i === currentStepIndex ? 'w-4 bg-emerald-500' : 'w-1.5 bg-slate-200'}`} />
                     ))}
                  </div>
                  
                  <button onClick={handleNext} className="flex items-center gap-1 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md active:scale-95 transition-transform">
                     {currentStepIndex === TOUR_STEPS.length - 1 ? "Finish" : "Next"} <ChevronRight size={16} />
                  </button>
               </div>
            </motion.div>
         </AnimatePresence>
      </div>
   );
}
