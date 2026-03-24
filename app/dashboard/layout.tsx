'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { MobileNav } from '@/components/mobile-nav';
import { SessionClock } from '@/components/session-clock';
import { authStore } from '@/lib/auth';
import { importHistoricalTrades } from '@/lib/import-historical';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!authStore.isAuthenticated()) {
      router.push('/');
      return;
    }
    // Seed historical trades from TRADING_JOURNAL_2026.xlsx — runs once only
    importHistoricalTrades();
  }, [router]);

  if (!mounted) {
    return null;
  }

  return (
    <div
      className="flex min-h-screen"
      style={{
        background: '#070a10',
        // Subtle radial glow top-left for depth
        backgroundImage: `
          radial-gradient(ellipse 80% 50% at 20% -10%, rgba(0,255,135,0.04) 0%, transparent 60%),
          radial-gradient(ellipse 60% 40% at 80% 110%, rgba(0,212,255,0.03) 0%, transparent 50%)
        `,
      }}
    >
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main content */}
      <main
        className="flex-1 md:ml-64 overflow-auto pb-24 md:pb-8"
        style={{ minHeight: '100vh' }}
      >
        {/* Top bar — desktop only */}
        <div
          className="hidden md:flex items-center justify-between sticky top-0 z-30 px-8 py-4"
          style={{
            background: 'rgba(7, 10, 16, 0.85)',
            backdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          {/* Breadcrumb slot — children can override via portal if needed */}
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 rounded-full" style={{ background: 'linear-gradient(180deg, #00ff87, #00d4ff)' }} />
            <span className="text-white/50 text-sm font-medium tracking-wide" style={{ fontFamily: "'DM Mono', monospace" }}>
              ZENO TRADING
            </span>
          </div>

          {/* Right cluster */}
          <div className="flex items-center gap-3">
            {/* Live indicator */}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{
                background: 'rgba(0,255,135,0.06)',
                border: '1px solid rgba(0,255,135,0.1)',
                color: 'rgba(0,255,135,0.8)',
                fontFamily: "'DM Mono', monospace",
                letterSpacing: '0.05em',
              }}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
              </span>
              LIVE
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Navigation */}
      <MobileNav />

      {/* Session Clock */}
      <SessionClock />
    </div>
  );
}