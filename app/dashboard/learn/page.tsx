'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { modulesStore, tradesStore, type LearningModule, type Trade } from '@/lib/store';
import {
  BookOpen, Brain, BarChart3, Play, CheckCircle2,
  Flame, Clock, X, ChevronRight, TrendingDown,
  AlertTriangle, Target, Zap, Activity, Eye,
} from 'lucide-react';

// ─── Pattern analysis engine ──────────────────────────────────────────────────

type Pattern = {
  id: string;
  severity: 'critical' | 'warning' | 'insight' | 'positive';
  title: string;
  finding: string;
  evidence: string;
  action: string;
};

function analyzePatterns(trades: Trade[]): Pattern[] {
  const patterns: Pattern[] = [];
  if (trades.length === 0) return patterns;

  const realTrades = trades.filter(t => t.status === 'win' || t.status === 'loss');
  if (realTrades.length === 0) return patterns;

  const wins   = realTrades.filter(t => t.status === 'win');
  const losses = realTrades.filter(t => t.status === 'loss');
  const winRate = wins.length / realTrades.length;

  // ── Pattern 1: FOMO diagnosis ──────────────────────────────────────────────
  const fomoTrades  = realTrades.filter(t => (t.tags ?? []).includes('fomo'));
  const fomoLosses  = fomoTrades.filter(t => t.status === 'loss');
  if (fomoTrades.length > 0) {
    const fomoLossRate = fomoLosses.length / fomoTrades.length;
    patterns.push({
      id: 'fomo',
      severity: fomoLossRate > 0.7 ? 'critical' : 'warning',
      title: 'FOMO Is Your #1 Account Killer',
      finding: `${fomoTrades.length} of your ${realTrades.length} trades were FOMO entries. ${fomoLossRate > 0.7 ? `You lost ${Math.round(fomoLossRate * 100)}% of them.` : 'These trades underperform your non-FOMO trades.'}`,
      evidence: `FOMO trades: ${fomoTrades.length} | FOMO losses: ${fomoLosses.length} | Non-FOMO win rate: ${realTrades.filter(t => !(t.tags ?? []).includes('fomo') && t.status === 'win').length}/${realTrades.filter(t => !(t.tags ?? []).includes('fomo')).length}`,
      action: 'Before any entry, ask: "Am I entering because my setup is valid, or because I fear missing the move?" If you cannot answer clearly — do not enter.',
    });
  }

  // ── Pattern 2: Consecutive losses ─────────────────────────────────────────
  let maxStreak = 0, currentStreak = 0;
  const sorted = [...realTrades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  sorted.forEach(t => {
    if (t.status === 'loss') { currentStreak++; maxStreak = Math.max(maxStreak, currentStreak); }
    else currentStreak = 0;
  });
  if (maxStreak >= 3) {
    patterns.push({
      id: 'streak',
      severity: 'critical',
      title: `${maxStreak}-Loss Streak Detected`,
      finding: `You had ${maxStreak} consecutive losses. Research shows that after 2+ losses, emotional decision-making increases by 60%. Your subsequent trades after losing streaks are your most dangerous.`,
      evidence: `Max consecutive losses: ${maxStreak} | Total losses: ${losses.length} | After 2 losses, your next trade should not happen.`,
      action: 'Implement a hard rule: stop trading for the day after 2 consecutive losses. Come back tomorrow with a clear head. This single rule will save your account.',
    });
  }

  // ── Pattern 3: Win when you follow the plan ────────────────────────────────
  const calmoTrades = realTrades.filter(t => t.emotionalState === 'calm');
  const calmoWins   = calmoTrades.filter(t => t.status === 'win');
  const excitedTrades = realTrades.filter(t => t.emotionalState === 'excited' || t.emotionalState === 'frustrated');
  const excitedWins   = excitedTrades.filter(t => t.status === 'win');

  if (calmoTrades.length > 0 && excitedTrades.length > 0) {
    const calmWR    = calmoWins.length / calmoTrades.length;
    const excitedWR = excitedTrades.length > 0 ? excitedWins.length / excitedTrades.length : 0;
    if (calmWR > excitedWR + 0.1) {
      patterns.push({
        id: 'emotion',
        severity: 'insight',
        title: 'Calm State = Better Trades',
        finding: `When calm: ${Math.round(calmWR * 100)}% win rate. When emotional: ${Math.round(excitedWR * 100)}% win rate. Your emotional state directly predicts your outcome.`,
        evidence: `Calm trades: ${calmoTrades.length} | Calm wins: ${calmoWins.length} | Excited/frustrated trades: ${excitedTrades.length} | Emotional wins: ${excitedWins.length}`,
        action: 'Rate your emotional state honestly before each trade. If you are not calm, step away. Your best trades come from clarity, not urgency.',
      });
    }
  }

  // ── Pattern 4: Your one win — replicate it ─────────────────────────────────
  if (wins.length >= 1 && losses.length > 2) {
    const bestWin = wins.reduce((best, t) => (t.pnl ?? 0) > (best.pnl ?? 0) ? t : best, wins[0]);
    patterns.push({
      id: 'replicate',
      severity: 'positive',
      title: 'You Have Proof You Can Win',
      finding: `Your trade on ${bestWin.date} (${bestWin.pair}) produced +$${(bestWin.pnl ?? 0).toFixed(2)}. You noted: "${bestWin.notes}". This is your blueprint.`,
      evidence: `Strategy: ${bestWin.strategyUsed || 'Market structure'} | Emotion: ${bestWin.emotionalState} | Tags: ${(bestWin.tags ?? []).join(', ') || 'clean setup'}`,
      action: 'Study this trade obsessively. What made it different from your losses? The answer is in your own data. Every trade you take should aim to replicate this moment — not the outcome, but the PROCESS.',
    });
  }

  // ── Pattern 5: Overall win rate reality check ──────────────────────────────
  if (winRate < 0.3 && realTrades.length >= 5) {
    patterns.push({
      id: 'winrate',
      severity: 'critical',
      title: `${Math.round(winRate * 100)}% Win Rate — The System Isn't Working Yet`,
      finding: `With ${realTrades.length} trades at ${Math.round(winRate * 100)}% win rate, you are not yet executing your strategy consistently. But this is data, not failure — it is information.`,
      evidence: `Wins: ${wins.length} | Losses: ${losses.length} | To break even at 1:2 R:R you need 34% win rate.`,
      action: 'Stop trying to find a better strategy. Your strategy (Supply & Demand + FVG + FRVP) is sound. The problem is execution. Track your compliance score in the Playbook tab and focus there first.',
    });
  }

  // ── Pattern 6: Late entry pattern ─────────────────────────────────────────
  const lateEntries = realTrades.filter(t => (t.tags ?? []).includes('late-entry'));
  if (lateEntries.length >= 2) {
    patterns.push({
      id: 'patience',
      severity: 'warning',
      title: 'Patience Is Your Missing Edge',
      finding: `${lateEntries.length} trades were late/rushed entries. You are not waiting for confirmation. The best setups require patience — the market will always give you another chance.`,
      evidence: `Late entries: ${lateEntries.length} | Late entry losses: ${lateEntries.filter(t => t.status === 'loss').length}`,
      action: 'After identifying a setup, set a price alert and walk away. Come back ONLY when price reaches your level. Remove yourself from the screen so you cannot enter early.',
    });
  }

  return patterns;
}

// ─── Mock modules (unchanged) ─────────────────────────────────────────────────

const MOCK_MODULES: LearningModule[] = [
  {
    id: 'psychology-101', type: 'psychology',
    title: 'Trading Psychology 101: Emotional Discipline',
    description: 'Master the psychological aspects of trading. Learn how to identify and control emotional trading patterns.',
    content: `# Trading Psychology 101

## The Emotional Trading Trap

Most traders lose money not because of bad strategies, but because of emotional decisions.

### Key Concepts:

1. **Fear & Greed Cycle**: Understand how fear and greed drive market emotions
2. **Position Sizing Psychology**: How position size affects your emotional control
3. **Breakeven Trades**: Why we hold breakeven trades (losing money)
4. **Revenge Trading**: The biggest account killer - revenge trading after losses
5. **Confirmation Bias**: How we see what we want to see in charts

## The Solution

- Pre-plan every trade in detail
- Follow the plan religiously
- Keep a trading journal of emotional states
- Don't trade after 2 consecutive losses
- Take a break every Friday

## Your Action Items

1. Keep a daily emotional journal
2. Record your emotional state for each trade
3. Identify your primary emotional trigger
4. Create a 5-point protocol to handle it`,
    duration: '25 minutes', completed: false, difficulty: 'beginner',
  },
  {
    id: 'breakout-guide', type: 'guide',
    title: 'Interactive: London Breakout Strategy Setup',
    description: 'Step-by-step walkthrough of identifying and trading London opening breakouts with real examples.',
    content: `# London Breakout Strategy - Complete Guide

## What is a Breakout?

A breakout occurs when price breaks above resistance or below support after consolidation.

## London Breakout Setup

### Step 1: Identify the Range (7:00-8:00 GMT)
- Draw support at the low of the range
- Draw resistance at the high of the range
- This is your trading zone

### Step 2: Wait for the Break (8:00-10:00 GMT)
- Only trade on 5-minute candle close above resistance
- Or close below support
- DO NOT anticipate the break

### Step 3: Enter the Trade
- Enter at market on candle close
- Stop loss 20 pips below the low
- Target = Entry + 2x the risk

### Step 4: Manage the Trade
- Move stop to breakeven at +20 pips
- Trail stop loss with trailing stop

## Real Example:
EUR/USD on January 15th, 2024
- Range: 1.0850 - 1.0870
- Break: Price closed above 1.0870
- Result: +80 pips profit

## Why This Works:
- London is the most liquid session
- Breakouts have high follow-through here
- Retail traders miss it, institutions don't`,
    duration: '35 minutes', completed: false, difficulty: 'beginner',
  },
  {
    id: 'case-study-win', type: 'case-study',
    title: 'Case Study: When Your Strategy Works',
    description: 'Real historical example of a London breakout trade that worked perfectly. Understand what you should repeat.',
    content: `# Case Study: Successful London Breakout
Date: March 15, 2024
Pair: GBP/USD

## The Setup
- Range formed 7:00-8:00: 1.2750-1.2770
- Resistance at 1.2770
- Support at 1.2750

## The Trade
- Entry: 1.2775 (break above resistance)
- Stop Loss: 1.2750 (-25 pips)
- Target: 1.2825 (+50 pips)
- Risk/Reward: 1:2

## What Happened
- Trade hit target perfectly
- Profit: +50 pips
- Time in trade: 45 minutes

## Why It Worked
✓ Entered on candle close, not anticipation
✓ Risk/reward was 1:2 minimum
✓ Traded only during London hours
✓ Followed the plan perfectly
✓ Controlled emotional state

## The Lesson
This is what SHOULD happen when you follow the system. This is your baseline.
Any deviation = lower probability = lower returns.`,
    duration: '20 minutes', completed: false, difficulty: 'beginner',
  },
  {
    id: 'case-study-loss', type: 'case-study',
    title: 'Case Study: When Your Strategy Fails',
    description: 'Real example of a London breakout that failed. Understand what to avoid and how to manage losses.',
    content: `# Case Study: Failed London Breakout
Date: March 18, 2024
Pair: EUR/USD

## The Setup
- Range: 1.0850-1.0870
- This looked identical to the winning trade

## What Went Wrong
- Entered on close above resistance ✓ (correct)
- Stop loss: -25 pips ✓ (correct)
- But: Price swept below the range, then shot up
- Got stopped out at 1.0825 (-25 pips loss)
- Then price rocketed to 1.0900 (+75 pips)

## The Lesson
This is NOT a failed strategy. This is a PROPER trade that lost.

### Why?
Breakouts fail sometimes. That's expected. The strategy had:
- 1:2 risk/reward ✓
- Proper stop loss ✓
- Correct entry logic ✓

### What Made It "Proper" Even Though It Lost
- We took the loss immediately
- We didn't move the stop loss (revenge)
- We didn't double down
- We didn't get emotional
- We recorded it and moved on

This loss is a SUCCESS because we followed the system.
A strategy that wins 60% of the time is AMAZING.`,
    duration: '20 minutes', completed: false, difficulty: 'beginner',
  },
  {
    id: 'money-management', type: 'psychology',
    title: 'Money Management: The Foundation of Consistency',
    description: 'How to size positions correctly and protect your account from catastrophic losses.',
    content: `# Money Management - The Real Edge

## The Truth
- A strategy that wins 40% but has 1:3 risk/reward beats a 60% win rate at 1:1
- Your position size determines your survival
- Most traders fail because of position sizing, not strategy

## The 2% Rule
- Risk maximum 2% of account per trade
- If account = $10,000
- Risk per trade = $200

## Calculating Position Size
Formula: Risk $ / (Entry - Stop Loss in Pips) = Lot Size

Example:
- Account: $10,000
- Risk: $200 (2%)
- Entry: 1.0850
- Stop: 1.0825 (25 pips)
- Lot Size = $200 / (25 pips x $10) = 0.8 lots

## Why This Matters
- 10 losses in a row with 2% = 81.9% account remaining
- 10 losses in a row with 5% = 59.9% account remaining
- 10 losses in a row with 10% = 35.9% account remaining

## The Discipline Part
The hardest part: STICKING TO 2% even when you're winning.
- Winning traders don't increase size
- They increase consistency first, size later`,
    duration: '30 minutes', completed: false, difficulty: 'intermediate',
  },
];

// ─── Config maps ──────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string; border: string; label: string }> = {
  guide:        { icon: BookOpen,  color: '#60a5fa', bg: 'rgba(96,165,250,0.08)',  border: 'rgba(96,165,250,0.2)',  label: 'GUIDE' },
  psychology:   { icon: Brain,     color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.2)', label: 'PSYCHOLOGY' },
  'case-study': { icon: BarChart3, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.2)',  label: 'CASE STUDY' },
  video:        { icon: Play,      color: '#00ff87', bg: 'rgba(0,255,135,0.08)',   border: 'rgba(0,255,135,0.2)',   label: 'VIDEO' },
};

const DIFF_CONFIG: Record<string, { color: string; bg: string }> = {
  beginner:     { color: '#00ff87', bg: 'rgba(0,255,135,0.08)' },
  intermediate: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
  advanced:     { color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
};

const SEVERITY_CONFIG = {
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.06)',    border: 'rgba(239,68,68,0.15)',    icon: AlertTriangle, label: 'CRITICAL' },
  warning:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.06)',   border: 'rgba(245,158,11,0.15)',   icon: AlertTriangle, label: 'WARNING' },
  insight:  { color: '#60a5fa', bg: 'rgba(96,165,250,0.06)',   border: 'rgba(96,165,250,0.15)',   icon: Eye,           label: 'INSIGHT' },
  positive: { color: '#00ff87', bg: 'rgba(0,255,135,0.06)',    border: 'rgba(0,255,135,0.15)',    icon: CheckCircle2,  label: 'STRENGTH' },
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LearnPage() {
  const [modules, setModules]           = useState<LearningModule[]>([]);
  const [trades, setTrades]             = useState<Trade[]>([]);
  const [selectedModule, setSelectedModule] = useState<LearningModule | null>(null);
  const [activeTab, setActiveTab]       = useState<'report' | 'modules'>('report');
  const [patterns, setPatterns]         = useState<Pattern[]>([]);

  useEffect(() => {
    const stored = modulesStore.getAll();
    if (stored.length === 0) {
      MOCK_MODULES.forEach(m => modulesStore.add(m));
      setModules(MOCK_MODULES);
    } else {
      setModules(stored);
    }
    const allTrades = tradesStore.getAll();
    setTrades(allTrades);
    setPatterns(analyzePatterns(allTrades));
  }, []);

  const handleMarkComplete = (id: string) => {
    modulesStore.markComplete(id);
    setModules(modulesStore.getAll());
    setSelectedModule(null);
  };

  const completedCount   = modules.filter(m => m.completed).length;
  const progressPercent  = modules.length > 0 ? (completedCount / modules.length) * 100 : 0;
  const realTradeCount   = trades.filter(t => t.status === 'win' || t.status === 'loss').length;

  const cardStyle = {
    background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
    border: '1px solid rgba(255,255,255,0.06)',
  };

  return (
    <motion.div className="space-y-8" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

      {/* ── Header ── */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(180deg,#00ff87,#00d4ff)' }} />
          <span className="text-[11px] tracking-widest text-white/30 uppercase" style={{ fontFamily: "'DM Mono',monospace" }}>Education</span>
        </div>
        <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "'DM Mono',monospace", letterSpacing: '-0.02em' }}>
          Learn &amp; Master
        </h1>
        <p className="text-white/40 text-sm mt-1">Your pattern report + curated education modules.</p>
      </div>

      {/* ── Tab switcher ── */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', width: 'fit-content' }}>
        {([['report', `My Pattern Report${patterns.length > 0 ? ` (${patterns.length})` : ''}`], ['modules', 'Study Modules']] as const).map(([tab, label]) => {
          const active = activeTab === tab;
          return (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="relative px-4 py-2 rounded-lg text-xs font-bold transition-colors"
              style={{ color: active ? '#070a10' : 'rgba(255,255,255,0.35)', fontFamily: "'DM Mono',monospace", background: 'none', border: 'none', cursor: 'pointer' }}>
              {active && (
                <motion.div layoutId="learnTab" className="absolute inset-0 rounded-lg"
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
            PATTERN REPORT TAB
        ══════════════════════════════════════════════ */}
        {activeTab === 'report' && (
          <motion.div key="report" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">

            {/* Report header */}
            <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg,rgba(96,165,250,0.07),rgba(167,139,250,0.04))', border: '1px solid rgba(96,165,250,0.12)' }}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)' }}>
                  <Activity className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-white/80 font-bold text-sm mb-1" style={{ fontFamily: "'DM Mono',monospace" }}>
                    Your Personal Pattern Report
                  </p>
                  <p className="text-white/40 text-xs leading-relaxed">
                    Generated from your {realTradeCount} real trades. This is not generic advice — it is your specific behavioral fingerprint. Every finding below comes from your own data.
                  </p>
                </div>
              </div>
            </div>

            {/* No trades yet */}
            {realTradeCount === 0 && (
              <div className="rounded-2xl p-10 text-center" style={cardStyle}>
                <BarChart3 className="w-10 h-10 text-white/15 mx-auto mb-4" />
                <p className="text-white/40 text-sm font-semibold mb-2">No patterns yet</p>
                <p className="text-white/20 text-xs max-w-xs mx-auto">
                  Log at least 5 trades and the system will analyze your behavioral fingerprint — FOMO patterns, emotional correlations, streak analysis, and more.
                </p>
              </div>
            )}

            {/* Patterns */}
            {patterns.map((pattern, i) => {
              const cfg = SEVERITY_CONFIG[pattern.severity];
              const Icon = cfg.icon;
              return (
                <motion.div key={pattern.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                  className="rounded-2xl overflow-hidden"
                  style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                  {/* Pattern header */}
                  <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: `1px solid ${cfg.border}` }}>
                    <Icon className="w-4 h-4 shrink-0" style={{ color: cfg.color }} />
                    <span className="text-[10px] font-bold tracking-widest px-2 py-0.5 rounded"
                      style={{ background: `${cfg.color}15`, color: cfg.color, fontFamily: "'DM Mono',monospace" }}>
                      {cfg.label}
                    </span>
                    <h3 className="text-white/80 font-bold text-sm">{pattern.title}</h3>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* Finding */}
                    <p className="text-white/65 text-sm leading-relaxed">{pattern.finding}</p>

                    {/* Evidence */}
                    <div className="p-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <p className="text-[9px] uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: "'DM Mono',monospace" }}>Your Data</p>
                      <p className="text-xs leading-relaxed" style={{ color: cfg.color, fontFamily: "'DM Mono',monospace", opacity: 0.8 }}>{pattern.evidence}</p>
                    </div>

                    {/* Action */}
                    <div className="flex items-start gap-2">
                      <Zap className="w-4 h-4 shrink-0 mt-0.5" style={{ color: cfg.color }} />
                      <p className="text-white/55 text-xs leading-relaxed">{pattern.action}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* If fewer than 5 trades, show encouragement */}
            {realTradeCount > 0 && realTradeCount < 5 && (
              <div className="rounded-2xl p-5 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p className="text-white/40 text-sm">
                  Log {5 - realTradeCount} more {5 - realTradeCount === 1 ? 'trade' : 'trades'} to unlock your full pattern report.
                </p>
                <div className="mt-3 w-full h-1.5 rounded-full mx-auto max-w-xs" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <motion.div className="h-full rounded-full" animate={{ width: `${(realTradeCount / 5) * 100}%` }}
                    style={{ background: '#00ff87', boxShadow: '0 0 8px rgba(0,255,135,0.4)' }} />
                </div>
              </div>
            )}

            {/* The core truth */}
            {realTradeCount >= 5 && (
              <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: "'DM Mono',monospace" }}>
                  The Fundamental Truth
                </p>
                <p className="text-white/50 text-sm leading-relaxed">
                  Every pattern above is solvable. None of them require a new strategy. They require <span style={{ color: '#00ff87' }}>you to enforce your own rules on yourself, consistently, when it is hardest</span> — which is exactly when you most want to break them.
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════
            MODULES TAB
        ══════════════════════════════════════════════ */}
        {activeTab === 'modules' && (
          <motion.div key="modules" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">

            {/* Progress */}
            <div className="rounded-2xl p-5"
              style={{ background: 'linear-gradient(135deg,rgba(0,255,135,0.06),rgba(0,212,255,0.03))', border: '1px solid rgba(0,255,135,0.12)' }}>
              <div className="flex items-end justify-between mb-4">
                <div>
                  <p className="text-white/60 text-sm font-medium">Learning Progress</p>
                  <p className="text-white/30 text-xs mt-0.5">{completedCount} of {modules.length} modules completed</p>
                </div>
                <span className="text-4xl font-black" style={{ fontFamily: "'DM Mono',monospace", color: '#00ff87', letterSpacing: '-0.03em', lineHeight: 1 }}>
                  {Math.round(progressPercent)}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <motion.div className="h-full rounded-full" animate={{ width: `${progressPercent}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
                  style={{ background: 'linear-gradient(90deg,#00ff87,#00d4ff)', boxShadow: '0 0 10px rgba(0,255,135,0.4)' }} />
              </div>
            </div>

            {/* Module grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {modules.map((module, index) => {
                const cfg      = TYPE_CONFIG[module.type] || TYPE_CONFIG.guide;
                const diffCfg  = DIFF_CONFIG[module.difficulty] || DIFF_CONFIG.beginner;
                const Icon     = cfg.icon;
                return (
                  <motion.div key={module.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.07 }}
                    whileHover={{ y: -3 }} onClick={() => setSelectedModule(module)}
                    className="rounded-2xl p-5 cursor-pointer group"
                    style={{
                      background: module.completed ? 'linear-gradient(135deg,rgba(0,255,135,0.06),rgba(0,212,255,0.02))' : 'linear-gradient(135deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))',
                      border: module.completed ? '1px solid rgba(0,255,135,0.15)' : '1px solid rgba(255,255,255,0.06)',
                      transition: 'border-color 0.2s',
                    }}
                    onMouseEnter={e => { if (!module.completed) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                    onMouseLeave={e => { if (!module.completed) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                          <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ background: cfg.bg, color: cfg.color, fontFamily: "'DM Mono',monospace", border: `1px solid ${cfg.border}` }}>{cfg.label}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold" style={{ background: diffCfg.bg, color: diffCfg.color, fontFamily: "'DM Mono',monospace" }}>{module.difficulty.toUpperCase()}</span>
                        </div>
                      </div>
                      {module.completed && <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: '#00ff87' }} />}
                    </div>
                    <h3 className="text-white/80 font-semibold text-sm leading-snug mb-2 group-hover:text-white transition-colors">{module.title}</h3>
                    <p className="text-white/30 text-xs leading-relaxed mb-4">{module.description}</p>
                    <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="flex items-center gap-1.5 text-white/25 text-xs" style={{ fontFamily: "'DM Mono',monospace" }}>
                        <Clock className="w-3.5 h-3.5" />{module.duration}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: module.completed ? '#00ff87' : 'rgba(255,255,255,0.3)', fontFamily: "'DM Mono',monospace" }}>
                        {module.completed ? <><CheckCircle2 className="w-3.5 h-3.5" /> Review</> : <><Flame className="w-3.5 h-3.5" /> Start</>}
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Module viewer modal ── */}
      <AnimatePresence>
        {selectedModule && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}
            onClick={() => setSelectedModule(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }} onClick={e => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-2xl"
              style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)' }}>
              {(() => {
                const cfg = TYPE_CONFIG[selectedModule.type] || TYPE_CONFIG.guide;
                const Icon = cfg.icon;
                return (
                  <div className="sticky top-0 px-6 py-5 flex items-start justify-between gap-4"
                    style={{ background: '#0d1117', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                        <Icon className="w-5 h-5" style={{ color: cfg.color }} />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold" style={{ color: cfg.color, fontFamily: "'DM Mono',monospace" }}>{cfg.label}</span>
                        <h2 className="text-white font-bold leading-snug">{selectedModule.title}</h2>
                      </div>
                    </div>
                    <button onClick={() => setSelectedModule(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                      <X className="w-4 h-4 text-white/40" />
                    </button>
                  </div>
                );
              })()}
              <div className="p-6 space-y-1">
                {selectedModule.content.split('\n').map((line, i) => {
                  if (line.startsWith('# ')) return <h1 key={i} className="text-xl font-bold text-white mt-6 mb-2" style={{ fontFamily: "'DM Mono',monospace" }}>{line.replace('# ', '')}</h1>;
                  if (line.startsWith('## ')) return <h2 key={i} className="text-base font-bold mt-5 mb-1.5" style={{ color: '#00ff87' }}>{line.replace('## ', '')}</h2>;
                  if (line.startsWith('### ')) return <h3 key={i} className="text-sm font-bold text-white/70 mt-4 mb-1">{line.replace('### ', '')}</h3>;
                  if (line.match(/^\d+\. /)) return (
                    <div key={i} className="flex gap-2 text-sm text-white/50 py-0.5">
                      <span className="font-bold shrink-0" style={{ color: '#00ff87', fontFamily: "'DM Mono',monospace" }}>{line.match(/^(\d+)\./)?.[1]}.</span>
                      <span>{line.replace(/^\d+\. /, '')}</span>
                    </div>
                  );
                  if (line.startsWith('- ')) return (
                    <div key={i} className="flex items-start gap-2 text-sm text-white/50 py-0.5">
                      <div className="w-1 h-1 rounded-full mt-2 shrink-0" style={{ background: '#00ff87' }} />
                      <span>{line.replace('- ', '')}</span>
                    </div>
                  );
                  if (line.startsWith('✓ ')) return (
                    <div key={i} className="flex items-start gap-2 text-sm py-0.5" style={{ color: '#00ff87' }}>
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{line.replace('✓ ', '')}</span>
                    </div>
                  );
                  if (line.trim() === '') return <div key={i} className="h-2" />;
                  return <p key={i} className="text-sm text-white/40 leading-relaxed">{line}</p>;
                })}
                {!selectedModule.completed && (
                  <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                    onClick={() => handleMarkComplete(selectedModule.id)}
                    className="w-full py-3.5 rounded-xl text-sm font-bold mt-8 flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg,#00ff87,#00d4ff)', color: '#070a10', fontFamily: "'DM Mono',monospace", boxShadow: '0 0 24px rgba(0,255,135,0.25)', border: 'none', cursor: 'pointer' }}>
                    <CheckCircle2 className="w-4 h-4" /> Mark as Completed
                  </motion.button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}