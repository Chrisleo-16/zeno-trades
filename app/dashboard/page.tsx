'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { analyticsStore, tradesStore, strategiesStore } from '@/lib/store';
import {
  BarChart3, TrendingUp, Award, Zap, ArrowRight,
  BookOpen, Activity, Target, ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

const cardStyle = {
  background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
  border: '1px solid rgba(255,255,255,0.06)',
};

const QUICK_ACTIONS = [
  { label: 'Log a Trade', sub: 'Record your next trade', href: '/dashboard/journal', icon: BookOpen, color: '#00ff87' },
  { label: 'Strategies', sub: 'View your playbook', href: '/dashboard/strategies', icon: TrendingUp, color: '#60a5fa' },
  { label: 'Learn & Improve', sub: 'Sharpen your edge', href: '/dashboard/learn', icon: Zap, color: '#a78bfa' },
  { label: 'Analytics', sub: 'Deep performance data', href: '/dashboard/analytics', icon: BarChart3, color: '#f59e0b' },
];

export default function DashboardPage() {
  const [winRate, setWinRate] = useState(0);
  const [totalPnL, setTotalPnL] = useState(0);
  const [disciplineScore, setDisciplineScore] = useState(0);
  const [tradeCount, setTradeCount] = useState(0);
  const [strategiesCount, setStrategiesCount] = useState(0);

  useEffect(() => {
    setWinRate(analyticsStore.getWinRate());
    setTotalPnL(analyticsStore.getTotalPnL());
    setDisciplineScore(analyticsStore.getDisciplineScore());
    setTradeCount(tradesStore.getAll().length);
    setStrategiesCount(strategiesStore.getAll().length);
  }, []);

  const stats = [
    {
      label: 'WIN RATE',
      value: `${winRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: '#00ff87',
      glow: 'rgba(0,255,135,0.15)',
      sub: 'Target 60%',
    },
    {
      label: 'TOTAL P&L',
      value: `${totalPnL >= 0 ? '+' : ''}$${totalPnL.toFixed(2)}`,
      icon: BarChart3,
      color: totalPnL >= 0 ? '#00ff87' : '#ef4444',
      glow: totalPnL >= 0 ? 'rgba(0,255,135,0.15)' : 'rgba(239,68,68,0.15)',
      sub: 'Net performance',
    },
    {
      label: 'DISCIPLINE',
      value: `${disciplineScore.toFixed(0)}/100`,
      icon: Award,
      color: '#f59e0b',
      glow: 'rgba(245,158,11,0.15)',
      sub: 'Consistency score',
    },
  ];

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* ── Page Header ── */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-1 h-5 rounded-full"
            style={{ background: 'linear-gradient(180deg,#00ff87,#00d4ff)' }}
          />
          <span
            className="text-[11px] tracking-widest text-white/30 uppercase"
            style={{ fontFamily: "'DM Mono',monospace" }}
          >
            Overview
          </span>
        </div>
        <h1
          className="text-3xl font-bold text-white"
          style={{ fontFamily: "'DM Mono',monospace", letterSpacing: '-0.02em' }}
        >
          Trading Dashboard
        </h1>
        <p className="text-white/40 text-sm mt-1">
          Welcome back. Your trading system is ready to execute.
        </p>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -3 }}
              className="rounded-2xl p-5 relative overflow-hidden"
              style={cardStyle}
            >
              {/* Glow blob */}
              <div
                className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl pointer-events-none"
                style={{ background: stat.glow, transform: 'translate(30%,-30%)' }}
              />

              <div className="flex items-start justify-between mb-4 relative">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{
                    background: stat.color + '12',
                    border: `1px solid ${stat.color}25`,
                  }}
                >
                  <Icon className="w-4 h-4" style={{ color: stat.color }} />
                </div>
                <span
                  className="text-[9px] uppercase tracking-widest"
                  style={{ color: 'rgba(255,255,255,0.2)', fontFamily: "'DM Mono',monospace" }}
                >
                  {stat.label}
                </span>
              </div>

              <p
                className="text-3xl font-bold mb-1 relative"
                style={{
                  fontFamily: "'DM Mono',monospace",
                  color: stat.color,
                  letterSpacing: '-0.03em',
                  lineHeight: 1,
                }}
              >
                {stat.value}
              </p>
              <p className="text-white/25 text-xs relative">{stat.sub}</p>
            </motion.div>
          );
        })}
      </div>

      {/* ── Quick Actions ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="rounded-2xl overflow-hidden"
        style={cardStyle}
      >
        <div
          className="flex items-center gap-3 px-5 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(0,255,135,0.08)', border: '1px solid rgba(0,255,135,0.15)' }}
          >
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-white/70 font-semibold text-sm">Quick Actions</p>
            <p className="text-white/25 text-xs">Jump to any section</p>
          </div>
        </div>

        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {QUICK_ACTIONS.map((action, i) => {
            const Icon = action.icon;
            return (
              <Link key={i} href={action.href}>
                <motion.div
                  whileHover={{ x: 3 }}
                  className="flex items-center gap-3 p-3.5 rounded-xl group cursor-pointer transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = action.color + '25';
                    e.currentTarget.style.background = action.color + '06';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: action.color + '12', border: `1px solid ${action.color}20` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: action.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/70 text-sm font-semibold group-hover:text-white/90 transition-colors">
                      {action.label}
                    </p>
                    <p className="text-white/25 text-xs truncate">{action.sub}</p>
                  </div>
                  <ChevronRight
                    className="w-4 h-4 flex-shrink-0 group-hover:translate-x-0.5 transition-transform"
                    style={{ color: 'rgba(255,255,255,0.15)' }}
                  />
                </motion.div>
              </Link>
            );
          })}
        </div>
      </motion.div>

      {/* ── System Status ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="rounded-2xl overflow-hidden"
        style={cardStyle}
      >
        <div
          className="flex items-center gap-3 px-5 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.15)' }}
          >
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-white/70 font-semibold text-sm">System Status</p>
        </div>

        <div className="p-4 space-y-2">
          {[
            { label: 'Total Trades Logged', value: tradeCount, icon: Target, color: '#00ff87' },
            { label: 'Active Strategies', value: strategiesCount, icon: TrendingUp, color: '#60a5fa' },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={i}
                className="flex items-center justify-between p-3.5 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" style={{ color: item.color }} />
                  <span className="text-white/50 text-sm">{item.label}</span>
                </div>
                <span
                  className="text-2xl font-bold"
                  style={{ fontFamily: "'DM Mono',monospace", color: item.color, letterSpacing: '-0.02em' }}
                >
                  {item.value}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ── First trade CTA (only when empty) ── */}
      {tradeCount === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="rounded-2xl p-6 text-center"
          style={{
            background: 'linear-gradient(135deg,rgba(0,255,135,0.06) 0%,rgba(0,212,255,0.03) 100%)',
            border: '1px solid rgba(0,255,135,0.12)',
          }}
        >
          <div
            className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'rgba(0,255,135,0.1)', border: '1px solid rgba(0,255,135,0.2)' }}
          >
            <BookOpen className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-white/70 font-semibold mb-1">No trades yet</p>
          <p className="text-white/30 text-sm mb-5">
            Start building your trading record. Every entry is a data point.
          </p>
          <Link href="/dashboard/journal">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold"
              style={{
                background: 'linear-gradient(135deg,#00ff87 0%,#00d4ff 100%)',
                color: '#070a10',
                fontFamily: "'DM Mono',monospace",
                boxShadow: '0 0 20px rgba(0,255,135,0.25)',
              }}
            >
              Log Your First Trade
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </Link>
        </motion.div>
      )}
    </motion.div>
  );
}