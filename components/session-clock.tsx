'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Moon } from 'lucide-react';

type Session = {
  name: string;
  open: number;   // UTC hour (weekday open)
  close: number;  // UTC hour (weekday close)
  color: string;
  glow: string;
  pairs: string[];  // best pairs for this session
};

const SESSIONS: Session[] = [
  {
    name: 'Sydney',
    open: 22,
    close: 7,
    color: '#f472b6',
    glow: 'rgba(244,114,182,0.4)',
    pairs: ['AUD/USD', 'NZD/USD', 'AUD/JPY'],
  },
  {
    name: 'Tokyo',
    open: 0,
    close: 9,
    color: '#60a5fa',
    glow: 'rgba(96,165,250,0.4)',
    pairs: ['USD/JPY', 'EUR/JPY', 'AUD/JPY'],
  },
  {
    name: 'London',
    open: 8,
    close: 17,
    color: '#00ff87',
    glow: 'rgba(0,255,135,0.4)',
    pairs: ['EUR/USD', 'GBP/USD', 'EUR/GBP'],
  },
  {
    name: 'New York',
    open: 13,
    close: 22,
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.4)',
    pairs: ['USD/CAD', 'USD/CHF', 'EUR/USD'],
  },
];

/**
 * Forex market closes Friday 22:00 UTC and reopens Sunday 22:00 UTC.
 * Returns true if the market is closed for the weekend.
 */
function isWeekendClose(date: Date): boolean {
  const day = date.getUTCDay();   // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
  const hour = date.getUTCHours();

  // Saturday all day
  if (day === 6) return true;
  // Friday from 22:00 UTC onwards
  if (day === 5 && hour >= 22) return true;
  // Sunday before 22:00 UTC
  if (day === 0 && hour < 22) return true;

  return false;
}

/**
 * Sydney session wraps midnight (22:00–07:00), so needs special handling.
 */
function isSessionActive(session: Session, utcHour: number): boolean {
  if (session.name === 'Sydney') {
    return utcHour >= 22 || utcHour < 7;
  }
  return utcHour >= session.open && utcHour < session.close;
}

/**
 * Returns how many hours until a session opens (for countdown display).
 */
function hoursUntilOpen(session: Session, utcHour: number): number {
  if (session.name === 'Sydney') {
    if (utcHour >= 7 && utcHour < 22) return 22 - utcHour;
    return 0;
  }
  if (utcHour < session.open) return session.open - utcHour;
  return 24 - utcHour + session.open;
}

/**
 * Returns the overlap label if two sessions are simultaneously active.
 */
function getOverlapLabel(activeSessions: Session[]): string | null {
  const names = activeSessions.map((s) => s.name);
  if (names.includes('London') && names.includes('New York')) return 'London/NY Overlap';
  if (names.includes('Tokyo') && names.includes('London')) return 'Tokyo/London Overlap';
  if (names.includes('Sydney') && names.includes('Tokyo')) return 'Sydney/Tokyo Overlap';
  return null;
}

export function SessionClock() {
  const [time, setTime] = useState<Date | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!time) return null;

  const utcHour = time.getUTCHours();
  const utcMinutes = time.getUTCMinutes().toString().padStart(2, '0');
  const utcSeconds = time.getUTCSeconds().toString().padStart(2, '0');
  const weekend = isWeekendClose(time);

  const activeSessions = weekend
    ? []
    : SESSIONS.filter((s) => isSessionActive(s, utcHour));

  const primarySession = activeSessions[0] ?? null;
  const overlapLabel = getOverlapLabel(activeSessions);

  // Day names for display
  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayName = DAY_NAMES[time.getUTCDay()];

  return (
    <div className="fixed bottom-24 right-4 z-50 md:bottom-6 md:right-6">
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-2 rounded-2xl overflow-hidden"
            style={{
              width: 248,
              background: 'rgba(8,12,20,0.98)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(24px)',
              boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
            }}
          >
            {/* Header */}
            <div
              className="px-4 py-3 flex items-center justify-between"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
            >
              <span
                className="text-[10px] uppercase tracking-widest font-semibold"
                style={{ color: 'rgba(255,255,255,0.3)', fontFamily: "'DM Mono',monospace" }}
              >
                Market Sessions
              </span>
              <span
                className="text-[10px] px-2 py-0.5 rounded-md"
                style={{
                  background: weekend ? 'rgba(239,68,68,0.1)' : 'rgba(0,255,135,0.08)',
                  color: weekend ? '#ef4444' : '#00ff87',
                  border: `1px solid ${weekend ? 'rgba(239,68,68,0.2)' : 'rgba(0,255,135,0.15)'}`,
                  fontFamily: "'DM Mono',monospace",
                }}
              >
                {weekend ? 'WEEKEND' : 'WEEKDAY'}
              </span>
            </div>

            {/* Weekend notice */}
            {weekend && (
              <div
                className="mx-3 my-3 px-3 py-2.5 rounded-xl flex items-center gap-2"
                style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)' }}
              >
                <Moon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#ef4444' }} />
                <div>
                  <p className="text-[11px] font-semibold" style={{ color: '#ef4444', fontFamily: "'DM Mono',monospace" }}>
                    Markets Closed
                  </p>
                  <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                    Reopens Sunday 22:00 UTC
                  </p>
                </div>
              </div>
            )}

            {/* Overlap badge */}
            {!weekend && overlapLabel && (
              <div
                className="mx-3 mt-3 px-3 py-1.5 rounded-lg text-center"
                style={{
                  background: 'rgba(0,255,135,0.06)',
                  border: '1px solid rgba(0,255,135,0.15)',
                }}
              >
                <span
                  className="text-[10px] font-bold"
                  style={{ color: '#00ff87', fontFamily: "'DM Mono',monospace", letterSpacing: '0.05em' }}
                >
                  ⚡ {overlapLabel}
                </span>
              </div>
            )}

            {/* Sessions list */}
            <div className="p-3 space-y-1.5">
              {SESSIONS.map((session) => {
                const active = !weekend && isSessionActive(session, utcHour);
                const eta = !active ? hoursUntilOpen(session, utcHour) : null;

                return (
                  <div
                    key={session.name}
                    className="rounded-xl px-3 py-2.5 transition-all"
                    style={{
                      background: active
                        ? `linear-gradient(135deg, ${session.color}10 0%, ${session.color}05 100%)`
                        : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${active ? session.color + '25' : 'rgba(255,255,255,0.05)'}`,
                    }}
                  >
                    {/* Session name row */}
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{
                            background: active ? session.color : 'rgba(255,255,255,0.12)',
                            boxShadow: active ? `0 0 6px ${session.glow}` : 'none',
                          }}
                        />
                        <span
                          className="text-xs font-semibold"
                          style={{
                            color: active ? session.color : 'rgba(255,255,255,0.3)',
                            fontFamily: "'DM Mono',monospace",
                          }}
                        >
                          {session.name}
                        </span>
                        {active && (
                          <motion.span
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                            style={{
                              background: session.color + '20',
                              color: session.color,
                              fontFamily: "'DM Mono',monospace",
                            }}
                          >
                            LIVE
                          </motion.span>
                        )}
                      </div>
                      <span
                        className="text-[10px]"
                        style={{ color: 'rgba(255,255,255,0.18)', fontFamily: "'DM Mono',monospace" }}
                      >
                        {session.name === 'Sydney'
                          ? '22:00–07:00'
                          : `${String(session.open).padStart(2, '0')}:00–${String(session.close).padStart(2, '0')}:00`}
                      </span>
                    </div>

                    {/* Pairs row */}
                    <div className="flex items-center gap-1 flex-wrap">
                      {session.pairs.map((pair) => (
                        <span
                          key={pair}
                          className="text-[9px] px-1.5 py-0.5 rounded"
                          style={{
                            background: active ? session.color + '12' : 'rgba(255,255,255,0.04)',
                            color: active ? session.color + 'cc' : 'rgba(255,255,255,0.2)',
                            fontFamily: "'DM Mono',monospace",
                            border: `1px solid ${active ? session.color + '20' : 'rgba(255,255,255,0.06)'}`,
                          }}
                        >
                          {pair}
                        </span>
                      ))}
                      {!active && !weekend && eta !== null && (
                        <span
                          className="text-[9px] ml-auto"
                          style={{ color: 'rgba(255,255,255,0.2)', fontFamily: "'DM Mono',monospace" }}
                        >
                          opens in ~{eta}h
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* UTC clock footer */}
            <div
              className="px-4 py-3 flex items-center justify-between"
              style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
            >
              <div>
                <p
                  className="text-[9px] uppercase tracking-widest"
                  style={{ color: 'rgba(255,255,255,0.2)', fontFamily: "'DM Mono',monospace" }}
                >
                  UTC — {dayName}
                </p>
                <p
                  className="text-base font-bold text-white"
                  style={{ fontFamily: "'DM Mono',monospace", letterSpacing: '0.05em', lineHeight: 1.2 }}
                >
                  {String(utcHour).padStart(2, '0')}:{utcMinutes}
                  <span className="text-white/25 text-sm">:{utcSeconds}</span>
                </p>
              </div>
              {!weekend && activeSessions.length === 0 && (
                <span
                  className="text-[10px] px-2 py-1 rounded-lg"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    color: 'rgba(255,255,255,0.25)',
                    fontFamily: "'DM Mono',monospace",
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  Inter-session
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trigger pill */}
      <motion.button
        onClick={() => setShow((v) => !v)}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-2 px-3 py-2 rounded-xl"
        style={{
          background: show
            ? 'rgba(0,255,135,0.1)'
            : 'rgba(8,12,20,0.95)',
          border: `1px solid ${
            weekend
              ? 'rgba(239,68,68,0.2)'
              : show
              ? 'rgba(0,255,135,0.2)'
              : 'rgba(255,255,255,0.08)'
          }`,
          backdropFilter: 'blur(20px)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        }}
      >
        {weekend ? (
          <Moon className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />
        ) : primarySession ? (
          <div
            className="w-2 h-2 rounded-full"
            style={{
              background: primarySession.color,
              boxShadow: `0 0 8px ${primarySession.glow}`,
              animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
            }}
          />
        ) : (
          <Clock className="w-3.5 h-3.5 text-white/30" />
        )}

        <span
          className="text-xs font-semibold"
          style={{
            fontFamily: "'DM Mono',monospace",
            color: weekend
              ? '#ef4444'
              : primarySession
              ? primarySession.color
              : 'rgba(255,255,255,0.4)',
            letterSpacing: '0.05em',
          }}
        >
          {weekend
            ? 'CLOSED'
            : overlapLabel
            ? 'OVERLAP'
            : primarySession
            ? primarySession.name.toUpperCase()
            : 'QUIET'}
        </span>

        <span
          className="text-xs"
          style={{ fontFamily: "'DM Mono',monospace", color: 'rgba(255,255,255,0.3)' }}
        >
          {String(utcHour).padStart(2, '0')}:{utcMinutes}
        </span>
      </motion.button>
    </div>
  );
}