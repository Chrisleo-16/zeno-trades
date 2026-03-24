'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  BookOpen,
  TrendingUp,
  GraduationCap,
  BarChart3,
  Settings,
  Activity,
  Moon,
  Sparkles,
  Newspaper,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Session logic (mirrors session-clock.tsx exactly) ──────────────────────

type Session = {
  name: string;
  open: number;
  close: number;
  color: string;
  glow: string;
};

const SESSIONS: Session[] = [
  { name: 'Sydney',   open: 22, close: 7,  color: '#f472b6', glow: 'rgba(244,114,182,0.4)' },
  { name: 'Tokyo',    open: 0,  close: 9,  color: '#60a5fa', glow: 'rgba(96,165,250,0.4)' },
  { name: 'London',   open: 8,  close: 17, color: '#00ff87', glow: 'rgba(0,255,135,0.4)' },
  { name: 'New York', open: 13, close: 22, color: '#f59e0b', glow: 'rgba(245,158,11,0.4)' },
];

function isWeekendClose(date: Date): boolean {
  const day = date.getUTCDay();
  const hour = date.getUTCHours();
  if (day === 6) return true;
  if (day === 5 && hour >= 22) return true;
  if (day === 0 && hour < 22) return true;
  return false;
}

function isSessionActive(session: Session, utcHour: number): boolean {
  if (session.name === 'Sydney') return utcHour >= 22 || utcHour < 7;
  return utcHour >= session.open && utcHour < session.close;
}

function getActiveSessions(date: Date): Session[] {
  if (isWeekendClose(date)) return [];
  const utcHour = date.getUTCHours();
  return SESSIONS.filter((s) => isSessionActive(s, utcHour));
}

function getOverlapLabel(sessions: Session[]): string | null {
  const names = sessions.map((s) => s.name);
  if (names.includes('London') && names.includes('New York')) return 'London/NY';
  if (names.includes('Tokyo') && names.includes('London')) return 'Tokyo/London';
  if (names.includes('Sydney') && names.includes('Tokyo')) return 'Sydney/Tokyo';
  return null;
}

// ── Nav items ───────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: 'Overview',   href: '/dashboard',            icon: LayoutDashboard },
  { label: 'Journal',    href: '/dashboard/journal',    icon: BookOpen },
  { label: 'Strategies', href: '/dashboard/strategies', icon: TrendingUp },
  { label: 'Learn',      href: '/dashboard/learn',      icon: GraduationCap },
  { label: 'Analytics',  href: '/dashboard/analytics',  icon: BarChart3 },
  { label: 'Market News',href: '/dashboard/news',        icon: Newspaper },
  { label: 'AI Coach',   href: '/dashboard/ai-buddy',   icon: Sparkles },
  { label: 'Settings',   href: '/dashboard/settings',   icon: Settings },
];

// ── Component ───────────────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();
  const [now, setNow] = useState<Date | null>(null);

  // Tick every minute — no need for per-second updates in the sidebar
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const weekend = now ? isWeekendClose(now) : false;
  const activeSessions = now ? getActiveSessions(now) : [];
  const primarySession = activeSessions[0] ?? null;
  const overlapLabel = getOverlapLabel(activeSessions);

  // Badge content
  const badgeLabel = weekend
    ? 'WEEKEND CLOSED'
    : overlapLabel
    ? `${overlapLabel} OVERLAP`
    : primarySession
    ? `${primarySession.name.toUpperCase()} SESSION`
    : 'INTER-SESSION';

  const badgeColor = weekend
    ? '#ef4444'
    : primarySession
    ? primarySession.color
    : 'rgba(255,255,255,0.3)';

  const badgeBg = weekend
    ? 'rgba(239,68,68,0.06)'
    : primarySession
    ? `${primarySession.color}08`
    : 'rgba(255,255,255,0.03)';

  const badgeBorder = weekend
    ? 'rgba(239,68,68,0.15)'
    : primarySession
    ? `${primarySession.color}18`
    : 'rgba(255,255,255,0.07)';

  return (
    <aside
      className="fixed top-0 left-0 h-screen w-64 z-40 flex flex-col"
      style={{
        background: 'linear-gradient(180deg, #080c14 0%, #070a10 100%)',
        borderRight: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      {/* ── Logo ── */}
      <div className="px-6 py-6 flex items-center gap-3 border-b border-white/5">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #00ff87 0%, #00d4ff 100%)',
            boxShadow: '0 0 20px rgba(0,255,135,0.3)',
          }}
        >
          <Activity className="w-4 h-4 text-black" strokeWidth={2.5} />
        </div>
        <div>
          <p
            className="text-white font-bold text-sm"
            style={{ fontFamily: "'DM Mono',monospace", letterSpacing: '-0.02em' }}
          >
            ZENO 
          </p>
          <p className="text-[10px] text-white/30 uppercase tracking-widest">Trade System</p>
        </div>
      </div>

      {/* ── Market status badge ── */}
      <div className="mx-4 mt-4">
        <div
          className="px-3 py-2.5 rounded-xl"
          style={{ background: badgeBg, border: `1px solid ${badgeBorder}` }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {weekend ? (
                /* Weekend — static moon icon */
                <Moon className="w-3 h-3 flex-shrink-0" style={{ color: '#ef4444' }} />
              ) : primarySession ? (
                /* Active session — pulsing dot */
                <span className="relative flex h-2 w-2 flex-shrink-0">
                  <span
                    className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                    style={{ background: primarySession.color }}
                  />
                  <span
                    className="relative inline-flex rounded-full h-2 w-2"
                    style={{ background: primarySession.color }}
                  />
                </span>
              ) : (
                /* Inter-session — dim static dot */
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.15)' }}
                />
              )}

              <span
                className="text-[11px] font-semibold leading-none"
                style={{ color: badgeColor, fontFamily: "'DM Mono',monospace" }}
              >
                {badgeLabel}
              </span>
            </div>

            {/* Active pair badges for primary session */}
            {!weekend && primarySession && (
              <span
                className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                style={{
                  background: `${primarySession.color}15`,
                  color: `${primarySession.color}cc`,
                  border: `1px solid ${primarySession.color}20`,
                  fontFamily: "'DM Mono',monospace",
                }}
              >
                LIVE
              </span>
            )}
          </div>

          {/* Active sessions row (shows all concurrent sessions) */}
          {!weekend && activeSessions.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {activeSessions.map((s) => (
                <span
                  key={s.name}
                  className="text-[9px] px-2 py-0.5 rounded-md font-medium"
                  style={{
                    background: `${s.color}10`,
                    color: `${s.color}aa`,
                    border: `1px solid ${s.color}20`,
                    fontFamily: "'DM Mono',monospace",
                  }}
                >
                  {s.name}
                </span>
              ))}
            </div>
          )}

          {/* Weekend reopens note */}
          {weekend && (
            <p
              className="text-[9px] mt-1.5"
              style={{ color: 'rgba(255,255,255,0.2)', fontFamily: "'DM Mono',monospace" }}
            >
              Reopens Sun 22:00 UTC
            </p>
          )}

          {/* Inter-session note */}
          {!weekend && activeSessions.length === 0 && now && (
            <p
              className="text-[9px] mt-1.5"
              style={{ color: 'rgba(255,255,255,0.2)', fontFamily: "'DM Mono',monospace" }}
            >
              Between sessions
            </p>
          )}
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p
          className="text-[10px] text-white/20 uppercase tracking-widest px-3 mb-3 font-medium"
          style={{ fontFamily: "'DM Mono',monospace" }}
        >
          Navigation
        </p>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 2 }}
                transition={{ duration: 0.15 }}
                className={cn(
                  'group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer',
                  isActive ? 'text-white' : 'text-white/40 hover:text-white/80'
                )}
                style={
                  isActive
                    ? {
                        background:
                          'linear-gradient(90deg, rgba(0,255,135,0.1) 0%, rgba(0,212,255,0.05) 100%)',
                        border: '1px solid rgba(0,255,135,0.15)',
                      }
                    : { border: '1px solid transparent' }
                }
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
                    style={{ background: 'linear-gradient(180deg, #00ff87, #00d4ff)' }}
                  />
                )}
                <Icon
                  className={cn(
                    'w-4 h-4 flex-shrink-0',
                    isActive
                      ? 'text-emerald-400'
                      : 'text-white/30 group-hover:text-white/60'
                  )}
                  strokeWidth={isActive ? 2 : 1.5}
                />
                <span
                  className="text-[13px]"
                  style={{
                    fontFamily: isActive ? "'DM Mono',monospace" : 'inherit',
                    letterSpacing: isActive ? '0.01em' : 'normal',
                  }}
                >
                  {item.label}
                </span>
                {isActive && (
                  <div
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0"
                    style={{ boxShadow: '0 0 6px #00ff87' }}
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* ── User strip ── */}
      <div className="px-4 py-4 border-t border-white/5">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-black flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #00ff87, #00d4ff)' }}
          >
            T
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white/80 text-xs font-semibold truncate">Trader</p>
            <p className="text-white/25 text-[10px] truncate">Pro Account</p>
          </div>
          {/* Online dot — always green on weekdays, dim on weekends */}
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{
              background: weekend ? 'rgba(255,255,255,0.15)' : '#00ff87',
              boxShadow: weekend ? 'none' : '0 0 6px #00ff87',
            }}
          />
        </div>
      </div>
    </aside>
  );
}