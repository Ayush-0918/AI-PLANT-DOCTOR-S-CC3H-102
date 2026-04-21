'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Scan, ShoppingBag, Users, UserCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import AppLogo from '@/components/AppLogo';

export default function SideNav() {
  const pathname = usePathname();

  const navItems = [
    { label: 'HOME', icon: Home, route: '/dashboard' },
    { label: 'SCAN', icon: Scan, route: '/scanner' },
    { label: 'SHOP', icon: ShoppingBag, route: '/marketplace' },
    { label: 'COMMUNITY', icon: Users, route: '/community' },
    { label: 'PROFILE', icon: UserCircle2, route: '/profile' },
  ];

  return (
    <nav className="hidden lg:flex w-[280px] h-screen flex-col border-r border-white/5 bg-slate-900/40 backdrop-blur-2xl px-6 py-8 relative z-50">
      
      {/* Brand */}
      <div className="flex items-center gap-3 mb-12">
        <AppLogo size={40} />
        <div>
           <h1 className="text-xl font-bold text-white tracking-tight">Plant Doctor</h1>
           <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Web Edition</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex flex-col gap-3 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.route;
          return (
            <Link
              key={item.label}
              href={item.route}
              className={`relative flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 ${
                isActive 
                  ? 'bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5 font-medium'
              }`}
            >
              <item.icon size={22} className={isActive ? 'text-emerald-400' : 'text-slate-400'} />
              <span className="text-sm uppercase tracking-widest">{item.label}</span>
              
              {isActive && (
                 <motion.div 
                    layoutId="activeSideNav"
                    className="absolute inset-0 rounded-2xl border-2 border-emerald-500"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                 />
              )}
            </Link>
          );
        })}
      </div>

      {/* Bottom Legal / Profile Quick View */}
      <div className="pt-8 border-t border-white/10 mt-auto">
         <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition-colors">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white font-bold shadow-md">
               A
            </div>
            <div>
               <p className="text-sm font-bold text-white">Ayush</p>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Premium Farmer</p>
            </div>
         </div>
      </div>
    </nav>
  );
}
