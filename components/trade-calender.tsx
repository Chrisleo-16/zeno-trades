'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { DayStats } from '@/lib/store-extended';

interface TradeCalendarProps {
  data: Record<string, DayStats>; // keyed by YYYY-MM-DD
  onDayClick?: (date: string, stats: DayStats) => void;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

// 0=Sun,1=Mon…6=Sat → shift to Mon-first (0=Mon…6=Sun)
function getStartOffset(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function pnlColor(pnl: number, max: number): string {
  if (pnl === 0) return 'rgba(255,255,255,0.03)';
  const intensity = Math.min(Math.abs(pnl) / (max || 1), 1);
  if (pnl > 0) {
    const a = 0.12 + intensity * 0.55;
    return `rgba(0,255,135,${a.toFixed(2)})`;
  }
  const a = 0.12 + intensity * 0.55;
  return `rgba(239,68,68,${a.toFixed(2)})`;
}

function pnlBorder(pnl: number): string {
  if (pnl > 0) return 'rgba(0,255,135,0.25)';
  if (pnl < 0) return 'rgba(239,68,68,0.25)';
  return 'rgba(255,255,255,0.05)';
}

export function TradeCalendar({ data, onDayClick }: TradeCalendarProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [hovered, setHovered] = useState<string | null>(null);

  const daysInMonth = getDaysInMonth(year, month);
  const offset = getStartOffset(year, month);

  // Monthly summary
  const monthDays = Object.values(data).filter((d) => {
    const [y, m] = d.date.split('-').map(Number);
    return y === year && m - 1 === month;
  });

  const monthPnL = monthDays.reduce((s, d) => s + d.pnl, 0);
  const monthTrades = monthDays.reduce((s, d) => s + d.tradeCount, 0);
  const monthWins = monthDays.reduce((s, d) => s + d.winCount, 0);
  const winDays = monthDays.filter((d) => d.pnl > 0).length;
  const lossDays = monthDays.filter((d) => d.pnl < 0).length;

  const maxAbsPnL = Math.max(...monthDays.map((d) => Math.abs(d.pnl)), 1);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const cells: Array<{ day: number | null; dateStr: string | null }> = [];
  for (let i = 0; i < offset; i++) cells.push({ day: null, dateStr: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    cells.push({ day: d, dateStr: `${year}-${mm}-${dd}` });
  }
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push({ day: null, dateStr: null });

  const hoveredStats = hovered ? data[hovered] : null;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg,rgba(255,255,255,0.03) 0%,rgba(255,255,255,0.01) 100%)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div>
          <p className="text-white/70 font-semibold text-sm">Trade Calendar</p>
          <p className="text-white/25 text-xs mt-0.5">Daily P&L heatmap</p>
        </div>

        {/* Month nav */}
        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span
            className="text-sm font-semibold text-white/70 w-36 text-center"
            style={{ fontFamily: "'DM Mono',monospace" }}
          >
            {MONTHS[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Monthly summary strip */}
      <div
        className="grid grid-cols-4 px-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        {[
          { label: 'NET P&L', value: `${monthPnL >= 0 ? '+' : ''}$${monthPnL.toFixed(2)}`, color: monthPnL >= 0 ? '#00ff87' : '#ef4444' },
          { label: 'TRADES', value: String(monthTrades), color: 'rgba(255,255,255,0.6)' },
          { label: 'WIN DAYS', value: String(winDays), color: '#00ff87' },
          { label: 'LOSS DAYS', value: String(lossDays), color: '#ef4444' },
        ].map((s, i) => (
          <div key={i} className="px-4 py-3" style={{ borderRight: i < 3 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
            <p className="text-[9px] uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: "'DM Mono',monospace" }}>
              {s.label}
            </p>
            <p className="text-base font-bold" style={{ color: s.color, fontFamily: "'DM Mono',monospace", letterSpacing: '-0.02em' }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="p-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {DAYS.map((d) => (
            <div
              key={d}
              className="text-center text-[10px] pb-2 font-semibold uppercase"
              style={{ color: 'rgba(255,255,255,0.2)', fontFamily: "'DM Mono',monospace" }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell, i) => {
            if (!cell.day || !cell.dateStr) {
              return <div key={i} className="aspect-square" />;
            }

            const stats = data[cell.dateStr];
            const isToday =
              cell.dateStr === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            const isHovered = hovered === cell.dateStr;
            const hasTrades = !!stats;
            const isWeekend = i % 7 >= 5;

            return (
              <motion.div
                key={cell.dateStr}
                whileHover={hasTrades ? { scale: 1.08 } : {}}
                onClick={() => hasTrades && onDayClick?.(cell.dateStr!, stats)}
                onMouseEnter={() => setHovered(cell.dateStr)}
                onMouseLeave={() => setHovered(null)}
                className="aspect-square rounded-lg flex flex-col items-center justify-center relative"
                style={{
                  background: hasTrades
                    ? pnlColor(stats.pnl, maxAbsPnL)
                    : isWeekend
                    ? 'rgba(255,255,255,0.01)'
                    : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${hasTrades ? pnlBorder(stats.pnl) : isToday ? 'rgba(0,255,135,0.3)' : 'rgba(255,255,255,0.04)'}`,
                  cursor: hasTrades ? 'pointer' : 'default',
                  boxShadow: isHovered && hasTrades
                    ? `0 0 12px ${stats.pnl > 0 ? 'rgba(0,255,135,0.2)' : 'rgba(239,68,68,0.2)'}`
                    : 'none',
                }}
              >
                <span
                  className="text-[11px] font-semibold"
                  style={{
                    color: isToday
                      ? '#00ff87'
                      : hasTrades
                      ? 'rgba(255,255,255,0.8)'
                      : 'rgba(255,255,255,0.2)',
                    fontFamily: "'DM Mono',monospace",
                  }}
                >
                  {cell.day}
                </span>

                {hasTrades && (
                  <span
                    className="text-[8px] font-bold mt-0.5"
                    style={{
                      color: stats.pnl > 0 ? 'rgba(0,255,135,0.9)' : 'rgba(239,68,68,0.9)',
                      fontFamily: "'DM Mono',monospace",
                    }}
                  >
                    {stats.pnl > 0 ? '+' : ''}{stats.pnl.toFixed(0)}
                  </span>
                )}

                {isToday && (
                  <div
                    className="absolute bottom-1 w-1 h-1 rounded-full"
                    style={{ background: '#00ff87', boxShadow: '0 0 4px #00ff87' }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Hovered day tooltip */}
      <AnimatePresence>
        {hovered && hoveredStats && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mx-4 mb-4 px-4 py-3 rounded-xl flex items-center justify-between"
            style={{
              background: hoveredStats.pnl > 0 ? 'rgba(0,255,135,0.06)' : 'rgba(239,68,68,0.06)',
              border: `1px solid ${hoveredStats.pnl > 0 ? 'rgba(0,255,135,0.15)' : 'rgba(239,68,68,0.15)'}`,
            }}
          >
            <div>
              <p className="text-white/60 text-xs font-semibold">{hovered}</p>
              <p
                className="text-lg font-bold"
                style={{
                  color: hoveredStats.pnl > 0 ? '#00ff87' : '#ef4444',
                  fontFamily: "'DM Mono',monospace",
                  letterSpacing: '-0.02em',
                }}
              >
                {hoveredStats.pnl > 0 ? '+' : ''}${hoveredStats.pnl.toFixed(2)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-white/30 text-xs">{hoveredStats.tradeCount} trades</p>
              <p className="text-white/30 text-xs">{hoveredStats.winCount} wins</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div
        className="flex items-center justify-center gap-4 pb-4"
        style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 12 }}
      >
        {[
          { label: 'Profit day', color: 'rgba(0,255,135,0.5)' },
          { label: 'Loss day', color: 'rgba(239,68,68,0.5)' },
          { label: 'No trades', color: 'rgba(255,255,255,0.08)' },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded" style={{ background: l.color }} />
            <span className="text-[10px] text-white/25">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}