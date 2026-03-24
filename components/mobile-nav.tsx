'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  BookOpen,
  TrendingUp,
  BarChart3,
  Settings,
  Sparkles,
  Newspaper,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Overview',  href: '/dashboard',           icon: LayoutDashboard },
  { label: 'Journal',   href: '/dashboard/journal',   icon: BookOpen },
  { label: 'News',      href: '/dashboard/news',       icon: Newspaper },
  { label: 'AI Coach',  href: '/dashboard/ai-buddy',  icon: Sparkles },
  { label: 'Settings',  href: '/dashboard/settings',  icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{
        background: 'rgba(8, 12, 20, 0.95)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-center justify-around px-2 py-2 safe-area-pb">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link key={item.href} href={item.href} className="flex-1">
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl relative"
              >
                {isActive && (
                  <motion.div
                    layoutId="mobileActiveNav"
                    className="absolute inset-0 rounded-xl"
                    style={{ background: 'rgba(0,255,135,0.08)', border: '1px solid rgba(0,255,135,0.12)' }}
                  />
                )}
                <Icon
                  className={cn(
                    'w-5 h-5 mb-1 relative z-10',
                    isActive ? 'text-emerald-400' : 'text-white/30'
                  )}
                  strokeWidth={isActive ? 2 : 1.5}
                  style={isActive ? { filter: 'drop-shadow(0 0 6px rgba(0,255,135,0.6))' } : {}}
                />
                <span
                  className={cn(
                    'text-[10px] font-medium relative z-10 tracking-wide',
                    isActive ? 'text-emerald-400' : 'text-white/25'
                  )}
                  style={{ fontFamily: isActive ? "'DM Mono', monospace" : 'inherit' }}
                >
                  {item.label}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}