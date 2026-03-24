'use client';

import { motion } from 'framer-motion';
import { TrendingDown, AlertTriangle, Activity, Zap } from 'lucide-react';
import type { DrawdownStats } from '@/lib/store-extended';

interface DrawdownWidgetsProps {
  stats: DrawdownStats;
  totalTrades: number;
}

export function DrawdownWidgets({ stats, totalTrades }: DrawdownWidgetsProps) {
  const {
    maxDrawdownDollar,
    maxDrawdownPercent,
    maxDrawdownDate,
    maxConsecutiveLosses,
    currentConsecutiveLosses,
    currentDrawdownFromPeak,
  } = stats;

  const noData = totalTrades === 0;

  // Severity colour for current drawdown
  const ddSeverity =
    currentDrawdownFromPeak === 0
      ? { color: '#00ff87', bg: 'rgba(0,255,135,0.06)', border: 'rgba(0,255,135,0.15)' }
      : currentDrawdownFromPeak < 5
      ? { color: '#f59e0b', bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.15)' }
      : { color: '#ef4444', bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.15)' };

  const consLossSeverity =
    currentConsecutiveLosses === 0
      ? { color: '#00ff87', bg: 'rgba(0,255,135,0.06)', border: 'rgba(0,255,135,0.15)' }
      : currentConsecutiveLosses < 3
      ? { color: '#f59e0b', bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.15)' }
      : { color: '#ef4444', bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.15)' };

  const cardStyle = {
    background: 'linear-gradient(135deg,rgba(255,255,255,0.03) 0%,rgba(255,255,255,0.01) 100%)',
    border: '1px solid rgba(255,255,255,0.06)',
  };

  const widgets = [
    {
      label: 'MAX DRAWDOWN',
      icon: TrendingDown,
      iconColor: '#ef4444',
      iconBg: 'rgba(239,68,68,0.1)',
      value: noData ? '—' : `-$${maxDrawdownDollar.toFixed(2)}`,
      sub: noData ? 'No data' : `-${maxDrawdownPercent.toFixed(2)}%`,
      subColor: '#ef4444',
      extra: maxDrawdownDate ? `Peak hit: ${maxDrawdownDate}` : null,
      severity: { color: '#ef4444', bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.15)' },
    },
    {
      label: 'CURRENT DRAWDOWN',
      icon: Activity,
      iconColor: ddSeverity.color,
      iconBg: ddSeverity.bg,
      value: noData ? '—' : `${currentDrawdownFromPeak.toFixed(2)}%`,
      sub: noData ? 'No data' : currentDrawdownFromPeak === 0 ? 'At peak' : 'From peak',
      subColor: ddSeverity.color,
      extra: null,
      severity: ddSeverity,
    },
    {
      label: 'MAX CONSEC. LOSSES',
      icon: AlertTriangle,
      iconColor: '#f59e0b',
      iconBg: 'rgba(245,158,11,0.1)',
      value: noData ? '—' : String(maxConsecutiveLosses),
      sub: noData ? 'No data' : 'trades in a row',
      subColor: 'rgba(255,255,255,0.3)',
      extra: null,
      severity: { color: '#f59e0b', bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.15)' },
    },
    {
      label: 'CURRENT STREAK',
      icon: Zap,
      iconColor: consLossSeverity.color,
      iconBg: consLossSeverity.bg,
      value: noData ? '—' : currentConsecutiveLosses === 0 ? '0' : `-${currentConsecutiveLosses}`,
      sub: noData
        ? 'No data'
        : currentConsecutiveLosses === 0
        ? 'No active losing streak'
        : `${currentConsecutiveLosses} consecutive ${currentConsecutiveLosses === 1 ? 'loss' : 'losses'}`,
      subColor: consLossSeverity.color,
      extra: currentConsecutiveLosses >= 2 ? '⚠ Consider taking a break' : null,
      severity: consLossSeverity,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-1 h-4 rounded-full" style={{ background: 'linear-gradient(180deg,#ef4444,#f97316)' }} />
        <p className="text-white/60 text-sm font-semibold">Drawdown Analysis</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {widgets.map((w, i) => {
          const Icon = w.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="rounded-2xl p-4 relative overflow-hidden"
              style={cardStyle}
            >
              {/* Background severity tint */}
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{ background: w.severity.bg, border: `1px solid ${w.severity.border}` }}
              />

              <div className="relative">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: w.iconBg, border: `1px solid ${w.iconColor}25` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: w.iconColor }} />
                  </div>
                  <span
                    className="text-[9px] text-right uppercase tracking-widest"
                    style={{ color: 'rgba(255,255,255,0.2)', fontFamily: "'DM Mono',monospace" }}
                  >
                    {w.label}
                  </span>
                </div>

                <p
                  className="text-2xl font-bold mb-0.5"
                  style={{ color: w.severity.color, fontFamily: "'DM Mono',monospace", letterSpacing: '-0.02em' }}
                >
                  {w.value}
                </p>
                <p className="text-[11px]" style={{ color: w.subColor }}>
                  {w.sub}
                </p>

                {w.extra && (
                  <p
                    className="text-[10px] mt-2 pt-2"
                    style={{
                      color: 'rgba(239,68,68,0.7)',
                      borderTop: '1px solid rgba(239,68,68,0.1)',
                      fontFamily: "'DM Mono',monospace",
                    }}
                  >
                    {w.extra}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}