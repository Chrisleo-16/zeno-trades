'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  analyticsStore, tradesStore, calcDrawdown,
  buildCalendarData, tagsStore,
  type Trade, type DrawdownStats, type DayStats, type TradeTag,
} from '@/lib/store';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Zap, Award, Target, Gauge, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { TradeCalendar } from '@/components/trade-calender';
import { DrawdownWidgets } from '@/components/drawdown-widgets';

const cardStyle = {
  background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
  border: '1px solid rgba(255,255,255,0.06)',
};

const tooltipStyle = {
  contentStyle: {
    background: '#0d1117',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    color: 'rgba(255,255,255,0.8)',
    fontFamily: "'DM Mono', monospace",
    fontSize: '12px',
  },
  labelStyle: { color: 'rgba(255,255,255,0.4)' },
};

const PIE_COLORS = ['#00ff87', '#ef4444', '#f59e0b', '#60a5fa', '#a78bfa'];

const EmptyChart = ({ msg }: { msg: string }) => (
  <div className="h-64 flex flex-col items-center justify-center gap-2">
    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <Gauge className="w-5 h-5 text-white/15" />
    </div>
    <p className="text-white/20 text-xs text-center" style={{ fontFamily: "'DM Mono',monospace" }}>{msg}</p>
  </div>
);

export default function AnalyticsPage() {
  const [trades, setTrades]               = useState<Trade[]>([]);
  const [winRate, setWinRate]             = useState(0);
  const [totalPnL, setTotalPnL]           = useState(0);
  const [disciplineScore, setDisciplineScore] = useState(0);
  const [tradesByPair, setTradesByPair]   = useState<Record<string, number>>({});
  const [profitFactor, setProfitFactor]   = useState(0);
  const [avgWin, setAvgWin]               = useState(0);
  const [avgLoss, setAvgLoss]             = useState(0);
  const [ddStats, setDdStats]             = useState<DrawdownStats | null>(null);
  const [calData, setCalData]             = useState<Record<string, DayStats>>({});
  const [tagStats, setTagStats]           = useState<Record<string, { count: number; pnl: number; wins: number }>>({});
  const [allTags, setAllTags]             = useState<TradeTag[]>([]);

  useEffect(() => {
    const all = tradesStore.getAll();
    const profile = typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('sniper_profile') || '{}')
      : {};

    setTrades(all);
    setWinRate(analyticsStore.getWinRate());
    setTotalPnL(analyticsStore.getTotalPnL());
    setDisciplineScore(analyticsStore.getDisciplineScore());
    setTradesByPair(analyticsStore.getTradesByPair());
    setProfitFactor(analyticsStore.getProfitFactor());
    setAvgWin(analyticsStore.getAvgWin());
    setAvgLoss(analyticsStore.getAvgLoss());
    setTagStats(analyticsStore.getTradesByTag());
    setDdStats(calcDrawdown(all, profile.startingBalance ?? 10000));
    setCalData(buildCalendarData(all));
    setAllTags(tagsStore.getAll());
  }, []);

  const pnlData = trades.map((t, i) => ({
    name: `#${i + 1}`,
    pnl: t.pnl || 0,
    cumulative: trades.slice(0, i + 1).reduce((s, x) => s + (x.pnl || 0), 0),
  }));

  const pairData = Object.entries(tradesByPair).map(([name, value]) => ({ name, value }));

  const emotionData = trades.reduce((acc, t) => {
    const e = acc.find((x: any) => x.name === t.emotionalState);
    if (e) e.value++;
    else acc.push({ name: t.emotionalState, value: 1 });
    return acc;
  }, [] as Array<{ name: string; value: number }>);

  const EMOTION_COLORS: Record<string, string> = {
    calm: '#00ff87', excited: '#f59e0b', frustrated: '#ef4444', fearful: '#60a5fa',
  };

  // Tag performance table data
  const tagTableData = Object.entries(tagStats)
    .map(([id, s]) => {
      const tag = allTags.find((t) => t.id === id);
      return {
        id,
        label: tag?.label ?? id,
        color: tag?.color ?? '#fff',
        count: s.count,
        pnl: s.pnl,
        winRate: s.count > 0 ? ((s.wins / s.count) * 100).toFixed(1) : '0',
      };
    })
    .sort((a, b) => b.count - a.count);

  const statCards = [
    { label: 'WIN RATE',      value: `${winRate.toFixed(1)}%`,          icon: TrendingUp, color: '#00ff87', sub: 'Target 60%' },
    { label: 'TOTAL P&L',     value: `${totalPnL >= 0 ? '+' : ''}$${totalPnL.toFixed(2)}`, icon: Zap, color: totalPnL >= 0 ? '#00ff87' : '#ef4444', sub: 'Net performance' },
    { label: 'PROFIT FACTOR', value: profitFactor === 999 ? '∞' : profitFactor.toFixed(2), icon: Award, color: profitFactor >= 1.5 ? '#00ff87' : profitFactor >= 1 ? '#f59e0b' : '#ef4444', sub: 'Gross profit / loss' },
    { label: 'DISCIPLINE',    value: `${disciplineScore.toFixed(0)}/100`, icon: Target, color: '#f59e0b', sub: `${trades.length} trades total` },
    { label: 'AVG WIN',       value: `$${avgWin.toFixed(2)}`,            icon: TrendingUp, color: '#00ff87', sub: 'Per winning trade' },
    { label: 'AVG LOSS',      value: avgLoss !== 0 ? `-$${Math.abs(avgLoss).toFixed(2)}` : '—', icon: AlertTriangle, color: '#ef4444', sub: 'Per losing trade' },
  ];

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* ── Header ── */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(180deg,#00ff87,#00d4ff)' }} />
          <span className="text-[11px] tracking-widest text-white/30 uppercase" style={{ fontFamily: "'DM Mono',monospace" }}>Performance</span>
        </div>
        <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "'DM Mono',monospace", letterSpacing: '-0.02em' }}>Analytics</h1>
        <p className="text-white/40 text-sm mt-1">Deep insights into your trading patterns and performance.</p>
      </div>

      {/* ── 6-stat grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl p-4"
              style={cardStyle}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: s.color + '15', border: `1px solid ${s.color}25` }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: s.color }} />
                </div>
              </div>
              <p className="text-[9px] uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: "'DM Mono',monospace" }}>{s.label}</p>
              <p className="text-xl font-bold" style={{ fontFamily: "'DM Mono',monospace", color: s.color, letterSpacing: '-0.02em' }}>{s.value}</p>
              <p className="text-[10px] mt-0.5 text-white/25">{s.sub}</p>
            </motion.div>
          );
        })}
      </div>

      {/* ── Drawdown widgets ── */}
      {ddStats && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <DrawdownWidgets stats={ddStats} totalTrades={trades.length} />
        </motion.div>
      )}

      {/* ── Trade Calendar ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <TradeCalendar data={calData} />
      </motion.div>

      {/* ── Charts row 1: Equity + P&L bars ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-2xl p-5" style={cardStyle}>
          <div className="mb-4">
            <p className="text-white/70 font-semibold text-sm">Equity Curve</p>
            <p className="text-white/25 text-xs mt-0.5">Cumulative P&L over time</p>
          </div>
          {pnlData.length > 1 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={pnlData}>
                <defs>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00ff87" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#00ff87" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.15)" tick={{ fill: 'rgba(255,255,255,0.25)', fontFamily: "'DM Mono',monospace", fontSize: 10 }} />
                <YAxis stroke="rgba(255,255,255,0.15)" tick={{ fill: 'rgba(255,255,255,0.25)', fontFamily: "'DM Mono',monospace", fontSize: 10 }} />
                <Tooltip {...tooltipStyle} />
                <Line type="monotone" dataKey="cumulative" stroke="#00ff87" dot={false} strokeWidth={2}
                  style={{ filter: 'drop-shadow(0 0 6px rgba(0,255,135,0.5))' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyChart msg="Log trades to see your equity curve" />}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="rounded-2xl p-5" style={cardStyle}>
          <div className="mb-4">
            <p className="text-white/70 font-semibold text-sm">P&L Per Trade</p>
            <p className="text-white/25 text-xs mt-0.5">Win / loss distribution</p>
          </div>
          {pnlData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={pnlData} barSize={10}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.15)" tick={{ fill: 'rgba(255,255,255,0.25)', fontFamily: "'DM Mono',monospace", fontSize: 10 }} />
                <YAxis stroke="rgba(255,255,255,0.15)" tick={{ fill: 'rgba(255,255,255,0.25)', fontFamily: "'DM Mono',monospace", fontSize: 10 }} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {pnlData.map((entry, i) => (
                    <Cell key={i} fill={entry.pnl >= 0 ? '#00ff87' : '#ef4444'}
                      style={{ filter: `drop-shadow(0 0 4px ${entry.pnl >= 0 ? 'rgba(0,255,135,0.4)' : 'rgba(239,68,68,0.4)'})` }} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart msg="Log trades to see P&L breakdown" />}
        </motion.div>
      </div>

      {/* ── Charts row 2: Pair pie + Emotion bars ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="rounded-2xl p-5" style={cardStyle}>
          <div className="mb-4">
            <p className="text-white/70 font-semibold text-sm">Trades by Pair</p>
            <p className="text-white/25 text-xs mt-0.5">Instrument distribution</p>
          </div>
          {pairData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie data={pairData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                    {pairData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {pairData.map((entry, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-xs text-white/50" style={{ fontFamily: "'DM Mono',monospace" }}>{entry.name}</span>
                    </div>
                    <span className="text-xs font-bold text-white/70" style={{ fontFamily: "'DM Mono',monospace" }}>{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <EmptyChart msg="No pair data yet" />}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="rounded-2xl p-5" style={cardStyle}>
          <div className="mb-4">
            <p className="text-white/70 font-semibold text-sm">Emotional State</p>
            <p className="text-white/25 text-xs mt-0.5">Psychology breakdown</p>
          </div>
          {emotionData.length > 0 ? (
            <div className="space-y-3">
              {emotionData.map((state, i) => {
                const pct = (state.value / trades.length) * 100;
                const color = EMOTION_COLORS[state.name] || '#60a5fa';
                return (
                  <div key={i}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-xs capitalize text-white/50" style={{ fontFamily: "'DM Mono',monospace" }}>{state.name}</span>
                      <span className="text-xs font-bold" style={{ color, fontFamily: "'DM Mono',monospace" }}>{state.value} trades</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <motion.div className="h-full rounded-full" animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                        style={{ background: color, boxShadow: `0 0 6px ${color}60` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <EmptyChart msg="No emotional data yet" />}
        </motion.div>
      </div>

      {/* ── Tag performance table ── */}
      {tagTableData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="rounded-2xl overflow-hidden" style={cardStyle}>
          <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.15)' }}>
              <Target className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-white/70 font-semibold text-sm">Performance by Tag</p>
              <p className="text-white/25 text-xs">Which setups & mistakes affect P&L</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  {['Tag', 'Trades', 'Win Rate', 'Total P&L'].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-[10px] uppercase tracking-widest font-semibold"
                      style={{ color: 'rgba(255,255,255,0.2)', fontFamily: "'DM Mono',monospace" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tagTableData.map((row) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td className="py-3 px-4">
                      <span className="text-xs px-2 py-1 rounded-lg font-semibold"
                        style={{ background: row.color + '15', color: row.color, border: `1px solid ${row.color}25`, fontFamily: "'DM Mono',monospace" }}>
                        {row.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white/50 text-xs" style={{ fontFamily: "'DM Mono',monospace" }}>{row.count}</td>
                    <td className="py-3 px-4 text-xs font-bold" style={{ color: Number(row.winRate) >= 50 ? '#00ff87' : '#ef4444', fontFamily: "'DM Mono',monospace" }}>
                      {row.winRate}%
                    </td>
                    <td className="py-3 px-4 text-xs font-bold" style={{ color: row.pnl >= 0 ? '#00ff87' : '#ef4444', fontFamily: "'DM Mono',monospace" }}>
                      {row.pnl >= 0 ? '+' : ''}${row.pnl.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* ── AI Insights ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
        className="rounded-2xl overflow-hidden" style={cardStyle}>
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(0,255,135,0.08)', border: '1px solid rgba(0,255,135,0.15)' }}>
            <Gauge className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-white/70 font-semibold text-sm">AI Trading Insights</p>
            <p className="text-white/25 text-xs">Personalized analysis</p>
          </div>
        </div>

        <div className="p-5 space-y-3">
          {trades.length === 0 ? (
            <p className="text-white/20 text-sm text-center py-8" style={{ fontFamily: "'DM Mono',monospace" }}>
              Log trades to unlock insights
            </p>
          ) : (
            <>
              {winRate >= 55 && (
                <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  className="flex gap-3 p-4 rounded-xl" style={{ background: 'rgba(0,255,135,0.05)', border: '1px solid rgba(0,255,135,0.12)' }}>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-emerald-400 text-sm font-semibold mb-0.5" style={{ fontFamily: "'DM Mono',monospace" }}>Positive Win Rate</p>
                    <p className="text-white/40 text-xs leading-relaxed">Your {winRate.toFixed(1)}% win rate shows consistent strategy execution. Keep following your system.</p>
                  </div>
                </motion.div>
              )}
              {profitFactor >= 1.5 && (
                <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}
                  className="flex gap-3 p-4 rounded-xl" style={{ background: 'rgba(0,255,135,0.05)', border: '1px solid rgba(0,255,135,0.12)' }}>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-emerald-400 text-sm font-semibold mb-0.5" style={{ fontFamily: "'DM Mono',monospace" }}>Strong Profit Factor</p>
                    <p className="text-white/40 text-xs leading-relaxed">Profit factor of {profitFactor.toFixed(2)} means you earn ${profitFactor.toFixed(2)} for every $1 you lose. Elite traders sit above 2.0.</p>
                  </div>
                </motion.div>
              )}
              {ddStats && ddStats.currentConsecutiveLosses >= 2 && (
                <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                  className="flex gap-3 p-4 rounded-xl" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.12)' }}>
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-400 text-sm font-semibold mb-0.5" style={{ fontFamily: "'DM Mono',monospace" }}>Active Losing Streak</p>
                    <p className="text-white/40 text-xs leading-relaxed">{ddStats.currentConsecutiveLosses} consecutive losses. Consider stopping for today and reviewing your last trades before continuing.</p>
                  </div>
                </motion.div>
              )}
              {emotionData.some((s) => s.name === 'frustrated' && s.value > trades.length * 0.3) && (
                <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
                  className="flex gap-3 p-4 rounded-xl" style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.12)' }}>
                  <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-amber-400 text-sm font-semibold mb-0.5" style={{ fontFamily: "'DM Mono',monospace" }}>Emotional Risk Alert</p>
                    <p className="text-white/40 text-xs leading-relaxed">High frustration rate detected. Enforce a 2-loss daily stop rule to protect your account.</p>
                  </div>
                </motion.div>
              )}
              {totalPnL > 0 && (
                <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                  className="flex gap-3 p-4 rounded-xl" style={{ background: 'rgba(96,165,250,0.05)', border: '1px solid rgba(96,165,250,0.12)' }}>
                  <TrendingUp className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-blue-400 text-sm font-semibold mb-0.5" style={{ fontFamily: "'DM Mono',monospace" }}>Profitable Trend</p>
                    <p className="text-white/40 text-xs leading-relaxed">You're net profitable. Build consistency before scaling position sizes.</p>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}