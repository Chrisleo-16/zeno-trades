'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { strategiesStore, tradesStore, tagsStore, type Strategy, type Trade } from '@/lib/store';
import { AIStrategyAdvisor, type RecommendedStrategy } from '@/components/ai-strategy-advisor';
import {
  Sparkles, TrendingUp, ChevronRight, X, Layers,
  ShieldCheck, AlertTriangle, CheckCircle2, BookOpen,
  Target, Zap, BarChart2, Lock, Unlock, Plus, Trash2,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type PlaybookRule = {
  id: string;
  text: string;
  category: 'risk' | 'entry' | 'exit' | 'psychology' | 'timing';
  breakTag?: string; // which tag id signals this rule was broken
};

type RuleCompliance = {
  ruleId: string;
  total: number;
  broken: number;
  rate: number; // 0–1 compliance rate
};

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG = {
  risk:       { label: 'Risk',       color: '#ef4444', bg: 'rgba(239,68,68,0.08)',    border: 'rgba(239,68,68,0.2)' },
  entry:      { label: 'Entry',      color: '#60a5fa', bg: 'rgba(96,165,250,0.08)',   border: 'rgba(96,165,250,0.2)' },
  exit:       { label: 'Exit',       color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',   border: 'rgba(245,158,11,0.2)' },
  psychology: { label: 'Mind',       color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.2)' },
  timing:     { label: 'Timing',     color: '#00ff87', bg: 'rgba(0,255,135,0.08)',    border: 'rgba(0,255,135,0.2)' },
};

// Your personal rules seeded from TRADING_JOURNAL_2026.xlsx
const DEFAULT_RULES: PlaybookRule[] = [
  { id: 'r1', text: 'No gambling — only take setups that match Supply & Demand + FVG + FRVP', category: 'entry',      breakTag: 'fomo' },
  { id: 'r2', text: 'Risk only 20% of current account balance per trade',                    category: 'risk',       breakTag: 'oversized' },
  { id: 'r3', text: 'Do NOT enter due to FOMO — wait for price confirmation',               category: 'psychology', breakTag: 'fomo' },
  { id: 'r4', text: 'Do NOT revenge trade after a loss',                                     category: 'psychology', breakTag: 'revenge-trade' },
  { id: 'r5', text: 'Wait for price to retrace before entering',                             category: 'entry',      breakTag: 'early-exit' },
  { id: 'r6', text: 'Always set a stop loss before entering',                                category: 'risk',       breakTag: 'no-stop' },
  { id: 'r7', text: 'Do not allow greed to override your trading discipline',                category: 'psychology', breakTag: 'fomo' },
  { id: 'r8', text: 'Be disciplined — follow the rules every single day',                   category: 'psychology' },
];

const RULES_KEY = 'apex_playbook_rules';

const MOCK_STRATEGIES: RecommendedStrategy[] = [
  {
    id: 'london-breakout',
    name: 'London Session Breakout',
    description: 'Trade currency pair breakouts during London opening hours',
    confidence: 0.92,
    reasoning: ['Your trading times align with London hours', 'Strong breakout performance on GBP/JPY', 'Low volatility matches your risk profile', 'Your discipline score supports this'],
    rules: ['Enter only during London 8:00-10:00 GMT', 'Wait for 5-minute candle close above resistance', 'Risk-to-reward minimum 1:2', 'Stop loss 20 pips below entry', 'Exit at first target or move SL to breakeven'],
    riskLevel: 'low',
    suggestedFor: 'Traders with 0-2 years experience, London session traders',
  },
  {
    id: 'supply-demand',
    name: 'Supply & Demand + FVG',
    description: 'Your own strategy — wait for institutional order blocks and fair value gaps',
    confidence: 0.95,
    reasoning: ['This IS your stated strategy', 'March 9 win came from following market structure', 'FVG + FRVP aligns with institutional flow', 'Highest confidence because it is already your plan'],
    rules: ['Identify supply/demand zone on 4H first', 'Confirm fair value gap on 15M', 'Wait for price to return to the FVG', 'Enter on 5M confirmation candle', 'SL behind the order block, TP at next zone'],
    riskLevel: 'low',
    suggestedFor: 'Your stated strategy — execute it with discipline',
  },
  {
    id: 'ny-rsi',
    name: 'NY Session RSI Confluence',
    description: 'Multi-timeframe RSI with support/resistance in NY hours',
    confidence: 0.80,
    reasoning: ['NY session adds volatility to setups', 'RSI confluence reduces false entries', 'Complements your existing strategy', 'Good for EUR/USD pairs'],
    rules: ['Trade only 13:00-18:00 NY time', 'RSI(14) on 1H between 30-70', 'Price at key supply/demand level', 'Confirm with 15M candle close', 'Take profit at next resistance'],
    riskLevel: 'medium',
    suggestedFor: 'After mastering your core strategy',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadRules(): PlaybookRule[] {
  if (typeof window === 'undefined') return DEFAULT_RULES;
  try {
    const raw = localStorage.getItem(RULES_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_RULES;
  } catch { return DEFAULT_RULES; }
}

function saveRules(rules: PlaybookRule[]): void {
  localStorage.setItem(RULES_KEY, JSON.stringify(rules));
}

function calcCompliance(rules: PlaybookRule[], trades: Trade[]): RuleCompliance[] {
  return rules.map(rule => {
    if (!rule.breakTag) return { ruleId: rule.id, total: trades.length, broken: 0, rate: 1 };
    const broken = trades.filter(t => (t.tags ?? []).includes(rule.breakTag!)).length;
    const total  = trades.length;
    return { ruleId: rule.id, total, broken, rate: total > 0 ? (total - broken) / total : 1 };
  });
}

function overallCompliance(compliances: RuleCompliance[]): number {
  if (compliances.length === 0) return 100;
  const avg = compliances.reduce((s, c) => s + c.rate, 0) / compliances.length;
  return Math.round(avg * 100);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ComplianceBar({ rate, height = 6 }: { rate: number; height?: number }) {
  const color = rate >= 0.8 ? '#00ff87' : rate >= 0.5 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ width: '100%', height, borderRadius: height, background: 'rgba(255,255,255,0.06)' }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${rate * 100}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        style={{ height: '100%', borderRadius: height, background: color, boxShadow: `0 0 8px ${color}60` }}
      />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StrategiesPage() {
  const [strategies, setStrategies]       = useState<Strategy[]>([]);
  const [trades, setTrades]               = useState<Trade[]>([]);
  const [rules, setRules]                 = useState<PlaybookRule[]>([]);
  const [showAdvisor, setShowAdvisor]     = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [activeTab, setActiveTab]         = useState<'strategies' | 'playbook'>('playbook');
  const [newRuleText, setNewRuleText]     = useState('');
  const [newRuleCategory, setNewRuleCategory] = useState<PlaybookRule['category']>('psychology');
  const [addingRule, setAddingRule]       = useState(false);

  useEffect(() => {
    setStrategies(strategiesStore.getAll());
    setTrades(tradesStore.getAll());
    setRules(loadRules());
  }, []);

  const compliances  = calcCompliance(rules, trades);
  const overallScore = overallCompliance(compliances);

  const handleStrategySelect = (rec: RecommendedStrategy) => {
    const s: Strategy = {
      id: Math.random().toString(36).substr(2, 9),
      name: rec.name, description: rec.description, rules: rec.rules,
      timeframe: 'Multi-timeframe', targetPair: 'EUR/USD',
      riskReward: '1:2', winRate: 0, trades: 0,
      personalizedFor: 'You', category: 'day',
    };
    strategiesStore.add(s);
    setStrategies(strategiesStore.getAll());
    setShowAdvisor(false);
  };

  const addRule = () => {
    if (!newRuleText.trim()) return;
    const updated = [...rules, { id: `r${Date.now()}`, text: newRuleText.trim(), category: newRuleCategory }];
    setRules(updated);
    saveRules(updated);
    setNewRuleText('');
    setAddingRule(false);
  };

  const deleteRule = (id: string) => {
    const updated = rules.filter(r => r.id !== id);
    setRules(updated);
    saveRules(updated);
  };

  // Most broken rule
  const worstRule = [...compliances].sort((a, b) => a.rate - b.rate)[0];
  const worstRuleObj = rules.find(r => r.id === worstRule?.ruleId);

  const cardStyle = {
    background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
    border: '1px solid rgba(255,255,255,0.06)',
  };

  return (
    <motion.div className="space-y-8" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(180deg,#00ff87,#00d4ff)' }} />
            <span className="text-[11px] tracking-widest text-white/30 uppercase" style={{ fontFamily: "'DM Mono',monospace" }}>Strategy Vault</span>
          </div>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "'DM Mono',monospace", letterSpacing: '-0.02em' }}>Trading Strategies</h1>
          <p className="text-white/40 text-sm mt-1">Your playbook, your rules, your accountability.</p>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={() => setShowAdvisor(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: 'linear-gradient(135deg,#00ff87 0%,#00d4ff 100%)', color: '#070a10', boxShadow: '0 0 24px rgba(0,255,135,0.3)', fontFamily: "'DM Mono',monospace" }}>
          <Sparkles className="w-4 h-4" /> AI Recommendations
        </motion.button>
      </div>

      {/* ── Tab switcher ── */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', width: 'fit-content' }}>
        {([['playbook', 'My Playbook'], ['strategies', 'Strategies']] as const).map(([tab, label]) => {
          const active = activeTab === tab;
          return (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="relative px-4 py-2 rounded-lg text-xs font-bold transition-colors"
              style={{ color: active ? '#070a10' : 'rgba(255,255,255,0.35)', fontFamily: "'DM Mono',monospace", background: 'none', border: 'none', cursor: 'pointer' }}>
              {active && (
                <motion.div layoutId="stratTab" className="absolute inset-0 rounded-lg"
                  style={{ background: 'linear-gradient(135deg,#00ff87,#00d4ff)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
              )}
              <span className="relative z-10">{label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">

        {/* ══════════════════════════════════════════════
            PLAYBOOK TAB — The accountability system
        ══════════════════════════════════════════════ */}
        {activeTab === 'playbook' && (
          <motion.div key="playbook" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">

            {/* Overall compliance score */}
            <div className="rounded-2xl p-5 relative overflow-hidden"
              style={{
                background: overallScore >= 80
                  ? 'linear-gradient(135deg,rgba(0,255,135,0.07) 0%,rgba(0,212,255,0.03) 100%)'
                  : overallScore >= 50
                  ? 'linear-gradient(135deg,rgba(245,158,11,0.07) 0%,rgba(245,158,11,0.03) 100%)'
                  : 'linear-gradient(135deg,rgba(239,68,68,0.07) 0%,rgba(239,68,68,0.03) 100%)',
                border: `1px solid ${overallScore >= 80 ? 'rgba(0,255,135,0.15)' : overallScore >= 50 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)'}`,
              }}>
              <div className="flex items-end justify-between mb-4">
                <div>
                  <p className="text-white/60 text-sm font-semibold">Rule Compliance Score</p>
                  <p className="text-white/30 text-xs mt-0.5">How often you follow your own rules</p>
                </div>
                <div className="text-right">
                  <span className="text-5xl font-black" style={{
                    fontFamily: "'DM Mono',monospace", letterSpacing: '-0.04em', lineHeight: 1,
                    color: overallScore >= 80 ? '#00ff87' : overallScore >= 50 ? '#f59e0b' : '#ef4444',
                  }}>
                    {overallScore}
                  </span>
                  <span className="text-xl font-bold" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: "'DM Mono',monospace" }}>/100</span>
                </div>
              </div>
              <ComplianceBar rate={overallScore / 100} height={8} />

              {/* Brutal honest message */}
              <p className="text-xs mt-3" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: "'DM Mono',monospace" }}>
                {overallScore >= 80
                  ? '✓ Elite execution. You follow your system. This is why winners win.'
                  : overallScore >= 60
                  ? '⚠ Inconsistent. You know the rules but break them under pressure. Focus here.'
                  : trades.length === 0
                  ? '→ No trades yet. Your score will build as you log trades.'
                  : '✕ Your biggest enemy is yourself. The market is not the problem — your discipline is.'}
              </p>
            </div>

            {/* Most broken rule alert */}
            {worstRuleObj && worstRule.rate < 0.8 && trades.length > 0 && (
              <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                className="rounded-2xl p-4 flex items-start gap-3"
                style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-400 text-sm font-bold mb-1" style={{ fontFamily: "'DM Mono',monospace" }}>
                    Your Most Broken Rule
                  </p>
                  <p className="text-white/60 text-sm leading-relaxed">"{worstRuleObj.text}"</p>
                  <p className="text-red-400/70 text-xs mt-2" style={{ fontFamily: "'DM Mono',monospace" }}>
                    Broken in {Math.round((1 - worstRule.rate) * 100)}% of trades — this single rule costs you the most money.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Rules list */}
            <div className="rounded-2xl overflow-hidden" style={cardStyle}>
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <p className="text-white/70 font-semibold text-sm">Your Personal Rules</p>
                  <p className="text-white/25 text-xs mt-0.5">These are YOUR laws. Break them = lose money.</p>
                </div>
                <button onClick={() => setAddingRule(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{ background: 'rgba(0,255,135,0.08)', border: '1px solid rgba(0,255,135,0.15)', color: '#00ff87', fontFamily: "'DM Mono',monospace", cursor: 'pointer' }}>
                  <Plus className="w-3.5 h-3.5" /> Add Rule
                </button>
              </div>

              {/* Add rule form */}
              <AnimatePresence>
                {addingRule && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="p-4 space-y-3">
                      <input
                        value={newRuleText}
                        onChange={e => setNewRuleText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addRule()}
                        placeholder="Write your rule (e.g. Never enter without 2 confirmations)"
                        style={{
                          width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 10, padding: '10px 14px', color: 'rgba(255,255,255,0.8)',
                          fontSize: 13, outline: 'none', fontFamily: "'DM Mono',monospace",
                        }} />
                      <div className="flex gap-2 flex-wrap">
                        {(Object.keys(CATEGORY_CONFIG) as PlaybookRule['category'][]).map(cat => {
                          const cfg = CATEGORY_CONFIG[cat];
                          const active = newRuleCategory === cat;
                          return (
                            <button key={cat} onClick={() => setNewRuleCategory(cat)}
                              className="text-[11px] px-2.5 py-1 rounded-lg font-semibold"
                              style={{
                                background: active ? cfg.bg : 'rgba(255,255,255,0.03)',
                                border: `1px solid ${active ? cfg.border : 'rgba(255,255,255,0.06)'}`,
                                color: active ? cfg.color : 'rgba(255,255,255,0.3)',
                                fontFamily: "'DM Mono',monospace", cursor: 'pointer',
                              }}>
                              {cfg.label}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setAddingRule(false)}
                          style={{ flex: 1, padding: '8px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: "'DM Mono',monospace", cursor: 'pointer' }}>
                          Cancel
                        </button>
                        <button onClick={addRule}
                          style={{ flex: 1, padding: '8px', borderRadius: 10, background: 'linear-gradient(135deg,#00ff87,#00d4ff)', border: 'none', color: '#070a10', fontSize: 12, fontWeight: 700, fontFamily: "'DM Mono',monospace", cursor: 'pointer' }}>
                          Add Rule
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Rules */}
              <div className="divide-y" style={{ divideColor: 'rgba(255,255,255,0.04)' }}>
                {rules.map((rule, i) => {
                  const compliance = compliances.find(c => c.ruleId === rule.id);
                  const cfg = CATEGORY_CONFIG[rule.category];
                  const rate = compliance?.rate ?? 1;
                  const broken = compliance?.broken ?? 0;
                  const rateColor = rate >= 0.8 ? '#00ff87' : rate >= 0.5 ? '#f59e0b' : '#ef4444';

                  return (
                    <motion.div key={rule.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                      className="px-5 py-4 group">
                      <div className="flex items-start gap-3">
                        {/* Rule number + category */}
                        <div className="flex flex-col items-center gap-1.5 shrink-0 pt-0.5">
                          <span className="text-[10px] font-black w-5 h-5 rounded flex items-center justify-center"
                            style={{ background: cfg.bg, color: cfg.color, fontFamily: "'DM Mono',monospace" }}>
                            {i + 1}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-white/80 text-sm leading-snug mb-2">{rule.text}</p>

                          {/* Compliance bar */}
                          {trades.length > 0 && (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: "'DM Mono',monospace" }}>
                                  {broken > 0 ? `Broken ${broken}x` : 'Never broken'}
                                </span>
                                <span className="text-[10px] font-bold" style={{ color: rateColor, fontFamily: "'DM Mono',monospace" }}>
                                  {Math.round(rate * 100)}% compliant
                                </span>
                              </div>
                              <ComplianceBar rate={rate} height={4} />
                            </div>
                          )}
                        </div>

                        {/* Category badge + delete */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[9px] px-2 py-0.5 rounded font-bold hidden sm:block"
                            style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontFamily: "'DM Mono',monospace" }}>
                            {cfg.label.toUpperCase()}
                          </span>
                          <button onClick={() => deleteRule(rule.id)}
                            className="w-6 h-6 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ color: 'rgba(239,68,68,0.5)', background: 'rgba(239,68,68,0.08)', border: 'none', cursor: 'pointer' }}>
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* The Warren Buffett insight box */}
            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: "'DM Mono',monospace" }}>
                The Edge Most Traders Never Find
              </p>
              <p className="text-white/50 text-sm leading-relaxed mb-3">
                Warren Buffett's rule #1: Never lose money. Rule #2: Never forget rule #1.
                In trading, this means <span style={{ color: '#00ff87' }}>your compliance score matters more than your win rate.</span>
              </p>
              <p className="text-white/35 text-xs leading-relaxed">
                A trader with a 40% win rate who follows their rules every time will outlast a trader with a 60% win rate who breaks rules under pressure. Your rules exist because you made them when you were thinking clearly. Follow them when you're not.
              </p>
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════
            STRATEGIES TAB
        ══════════════════════════════════════════════ */}
        {activeTab === 'strategies' && (
          <motion.div key="strategies" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

            {strategies.length === 0 && (
              <div className="rounded-2xl p-12 text-center" style={cardStyle}>
                <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Layers className="w-6 h-6 text-white/20" />
                </div>
                <h3 className="text-white/70 font-semibold mb-2">No strategies saved yet</h3>
                <p className="text-white/30 text-sm mb-5 max-w-xs mx-auto">Use AI recommendations to build your strategy library.</p>
                <button onClick={() => setShowAdvisor(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: 'linear-gradient(135deg,#00ff87,#00d4ff)', color: '#070a10', fontFamily: "'DM Mono',monospace", boxShadow: '0 0 20px rgba(0,255,135,0.25)', border: 'none', cursor: 'pointer' }}>
                  <Sparkles className="w-4 h-4" /> Get Started
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {strategies.map((strategy, i) => (
                <motion.div key={strategy.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  whileHover={{ y: -3 }} onClick={() => setSelectedStrategy(strategy)}
                  className="rounded-2xl p-5 cursor-pointer group" style={cardStyle}
                  onMouseEnter={e => (e.currentTarget.style.border = '1px solid rgba(0,255,135,0.15)')}
                  onMouseLeave={e => (e.currentTarget.style.border = '1px solid rgba(255,255,255,0.06)')}>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-sm mb-1">{strategy.name}</h3>
                      <p className="text-white/35 text-xs leading-relaxed">{strategy.description}</p>
                    </div>
                    <span className="text-[10px] px-2 py-1 rounded-md font-bold shrink-0"
                      style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', fontFamily: "'DM Mono',monospace" }}>
                      {strategy.trades} trades
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {[
                      { l: 'TF', v: strategy.timeframe },
                      { l: 'R:R', v: strategy.riskReward },
                      { l: 'WIN', v: `${strategy.winRate.toFixed(0)}%`, accent: strategy.winRate > 50 },
                      { l: 'CAT', v: strategy.category.toUpperCase() },
                    ].map(s => (
                      <div key={s.l} className="rounded-lg p-2 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <p className="text-[9px] text-white/25 uppercase mb-0.5" style={{ fontFamily: "'DM Mono',monospace" }}>{s.l}</p>
                        <p className="text-[11px] font-bold" style={{ color: s.accent ? '#00ff87' : 'rgba(255,255,255,0.7)', fontFamily: "'DM Mono',monospace" }}>{s.v}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <span className="text-[10px] text-white/20" style={{ fontFamily: "'DM Mono',monospace" }}>{strategy.rules.length} rules</span>
                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-emerald-400 transition-colors" />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── AI Advisor Modal ── */}
      <AnimatePresence>
        {showAdvisor && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowAdvisor(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }} onClick={e => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl p-6"
              style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,255,135,0.1)', border: '1px solid rgba(0,255,135,0.2)' }}>
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold" style={{ fontFamily: "'DM Mono',monospace" }}>AI Strategy Advisor</h2>
                    <p className="text-white/30 text-xs">Matched to your trading profile</p>
                  </div>
                </div>
                <button onClick={() => setShowAdvisor(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X className="w-4 h-4 text-white/40" />
                </button>
              </div>
              <AIStrategyAdvisor strategies={MOCK_STRATEGIES} onSelect={handleStrategySelect} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Strategy Detail Modal ── */}
      <AnimatePresence>
        {selectedStrategy && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
            onClick={() => setSelectedStrategy(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }} onClick={e => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl overflow-hidden"
              style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="px-6 py-5 flex items-center justify-between"
                style={{ background: 'linear-gradient(135deg,rgba(0,255,135,0.07),transparent)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <h2 className="text-white font-bold" style={{ fontFamily: "'DM Mono',monospace" }}>{selectedStrategy.name}</h2>
                <button onClick={() => setSelectedStrategy(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X className="w-4 h-4 text-white/40" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-white/40 text-sm">{selectedStrategy.description}</p>
                <div>
                  <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: "'DM Mono',monospace" }}>Rules</p>
                  {selectedStrategy.rules.map((rule, i) => (
                    <div key={i} className="flex gap-3 p-3 rounded-xl mb-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <span className="text-[10px] font-bold w-5 h-5 rounded flex items-center justify-center shrink-0"
                        style={{ background: 'rgba(0,255,135,0.1)', color: '#00ff87', fontFamily: "'DM Mono',monospace" }}>{i + 1}</span>
                      <p className="text-sm text-white/60">{rule}</p>
                    </div>
                  ))}
                </div>
                <button onClick={() => setSelectedStrategy(null)}
                  className="w-full py-3 rounded-xl text-sm font-semibold"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontFamily: "'DM Mono',monospace", cursor: 'pointer' }}>
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}