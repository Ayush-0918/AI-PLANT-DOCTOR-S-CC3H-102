import { Home, Scan, ShoppingBag, Users, UserCircle2 } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAtmosphere } from '@/context/AtmosphericContext';
import { useLanguage } from '@/context/LanguageContext';

const navItems = [
  { name: 'nav_home', path: '/dashboard', icon: Home, color: '#7dd3fc' },
  { name: 'nav_scan', path: '/scanner', icon: Scan, color: '#6ee7d8' },
  { name: 'nav_shop', path: '/marketplace', icon: ShoppingBag, color: '#fdba74' },
  { name: 'nav_community', path: '/community', icon: Users, color: '#c4b5fd' },
  { name: 'nav_profile', path: '/profile', icon: UserCircle2, color: '#fda4af' },
];

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { glowColor } = useAtmosphere();
  const { t } = useLanguage();

  const handleNav = (path: string) => {
    if (navigator.vibrate) navigator.vibrate([10]);
    router.push(path);
  };

  return (
    <div 
      className="fixed left-4 right-4 z-50 pointer-events-none"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}
    >
      <div className="pointer-events-auto max-w-md mx-auto">
        <nav
          className="relative rounded-[32px] px-2 py-2.5 bg-white/90 backdrop-blur-2xl border border-slate-200/60 shadow-[0_4px_32px_rgba(0,0,0,0.1)]"
        >
          <motion.div
            className="absolute inset-0 rounded-[28px] pointer-events-none"
            animate={{ opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              background: `radial-gradient(ellipse 60% 40% at 50% 100%, ${glowColor}15, transparent)`,
            }}
          />

          <div className="relative z-10 flex items-center justify-around">
            {navItems.map((item) => {
              const isActive = pathname === item.path || (pathname?.startsWith(item.path) && item.path !== '/dashboard');

              return (
                <motion.button
                  key={item.name}
                  onClick={() => handleNav(item.path)}
                  whileTap={{ scale: 0.9, y: 2 }}
                  className="relative flex flex-col items-center justify-center py-1.5 px-3 min-w-[60px] outline-none group"
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-active-pill"
                      className="absolute inset-0 rounded-[20px] bg-slate-50 border border-slate-100"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}

                  <div className="relative">
                    <item.icon
                      size={20}
                      strokeWidth={isActive ? 2.5 : 1.5}
                      style={{
                        color: isActive ? item.color : '#94a3b8',
                        transition: 'color 0.3s',
                      }}
                    />
                    {isActive && (
                      <motion.div
                        layoutId="nav-dot"
                        className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full"
                        style={{ background: item.color }}
                      />
                    )}
                  </div>

                  <span
                    className={`mt-1 text-[8px] font-black uppercase tracking-widest transition-opacity ${isActive ? 'opacity-100' : 'opacity-40'}`}
                    style={{ color: isActive ? item.color : '#64748b' }}
                  >
                    {t(item.name)}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
