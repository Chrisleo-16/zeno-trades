// lib/store.ts
// Trading Journal Data Store with localStorage persistence

export type TradeStatus = 'pending' | 'win' | 'loss' | 'breakeven';
export type SessionType = 'london' | 'newyork' | 'tokyo' | 'sydney';
export type DisciplineViolation = 'no-checklist' | 'wrong-size' | 'revenge-trade' | 'no-plan' | 'emotional';
export type TradeRating = 1 | 2 | 3 | 4 | 5;

// ─── Tag types ───────────────────────────────────────────────────────────────

export type TradeTag = {
  id: string;
  label: string;
  category: 'setup' | 'mistake' | 'custom';
  color: string;
};

export const DEFAULT_TAGS: TradeTag[] = [
  // Setups
  { id: 'london-breakout', label: 'London Breakout',  category: 'setup',   color: '#00ff87' },
  { id: 'ny-open',         label: 'NY Open',          category: 'setup',   color: '#60a5fa' },
  { id: 'trend-follow',    label: 'Trend Follow',     category: 'setup',   color: '#a78bfa' },
  { id: 'reversal',        label: 'Reversal',         category: 'setup',   color: '#f59e0b' },
  { id: 'range-break',     label: 'Range Break',      category: 'setup',   color: '#f472b6' },
  { id: 'news-play',       label: 'News Play',        category: 'setup',   color: '#fb923c' },
  // Mistakes
  { id: 'revenge-trade',   label: 'Revenge Trade',    category: 'mistake', color: '#ef4444' },
  { id: 'fomo',            label: 'FOMO',             category: 'mistake', color: '#ef4444' },
  { id: 'early-exit',      label: 'Early Exit',       category: 'mistake', color: '#ef4444' },
  { id: 'late-entry',      label: 'Late Entry',       category: 'mistake', color: '#f97316' },
  { id: 'no-stop',         label: 'No Stop Loss',     category: 'mistake', color: '#f97316' },
  { id: 'oversized',       label: 'Oversized',        category: 'mistake', color: '#f97316' },
];

// ─── Core types ───────────────────────────────────────────────────────────────

export interface Trade {
  id: string;
  date: string;
  entryTime: string;
  exitTime?: string;
  pair: string;
  type: 'long' | 'short';
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  pnl?: number;
  status: TradeStatus;

  // Original fields
  tags: string[];           // tag ids from DEFAULT_TAGS or custom tags
  notes: string;
  checklistCompleted: boolean;
  violations: DisciplineViolation[];
  strategyUsed: string;
  emotionalState: 'calm' | 'excited' | 'frustrated' | 'fearful';
  sessionType: SessionType;

  // ── Extended (Tradezella-style) fields ────────────────────────────────────
  rating?: TradeRating;     // 1–5 execution quality score
  reviewed?: boolean;       // has user written a post-trade review
  commission?: number;      // fees/spread cost in $
  riskAmount?: number;      // $ amount risked on this trade
  rMultiple?: number;       // pnl / riskAmount — auto-calculated on save
  reviewNotes?: string;     // post-trade review text
  setupNotes?: string;      // pre-trade plan/notes
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  rules: string[];
  timeframe: string;
  targetPair: string;
  riskReward: string;
  winRate: number;
  trades: number;
  personalizedFor: string;
  category: 'scalping' | 'swing' | 'day' | 'position';
}

export interface LearningModule {
  id: string;
  type: 'guide' | 'case-study' | 'psychology' | 'video';
  title: string;
  description: string;
  content: string;
  duration: string;
  completed: boolean;
  strategy?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  tradingStyle: string;
  experience: string;
  riskTolerance: string;
  preferredSession: SessionType;
  targetAccount: number;
  createdAt: string;
  startingBalance?: number; // used for drawdown calculation
}

// ─── Calendar & Drawdown types ────────────────────────────────────────────────

export type DayStats = {
  date: string;
  pnl: number;
  tradeCount: number;
  winCount: number;
};

export type DrawdownStats = {
  maxDrawdownDollar: number;
  maxDrawdownPercent: number;
  maxDrawdownDate: string;
  maxConsecutiveLosses: number;
  currentConsecutiveLosses: number;
  currentDrawdownFromPeak: number;
};

// ─── Storage keys ─────────────────────────────────────────────────────────────

const STORAGE_KEYS = {
  TRADES:     'sniper_trades',
  STRATEGIES: 'sniper_strategies',
  MODULES:    'sniper_modules',
  PROFILE:    'sniper_profile',
  TAGS:       'sniper_tags',
};

// ─── Profile store ────────────────────────────────────────────────────────────

export const profileStore = {
  get: (): UserProfile | null => {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
    return data ? JSON.parse(data) : null;
  },
  set: (profile: UserProfile) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  },
};

// ─── Tags store ───────────────────────────────────────────────────────────────

export const tagsStore = {
  getAll(): TradeTag[] {
    if (typeof window === 'undefined') return DEFAULT_TAGS;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.TAGS);
      return raw ? JSON.parse(raw) : DEFAULT_TAGS;
    } catch {
      return DEFAULT_TAGS;
    }
  },
  add(tag: TradeTag): void {
    if (typeof window === 'undefined') return;
    const tags = this.getAll();
    tags.push(tag);
    localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(tags));
  },
  delete(id: string): void {
    if (typeof window === 'undefined') return;
    const tags = this.getAll().filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(tags));
  },
};

// ─── Trades store ─────────────────────────────────────────────────────────────

export const tradesStore = {
  getAll: (): Trade[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.TRADES);
    return data ? JSON.parse(data) : [];
  },

  add: (trade: Trade) => {
    if (typeof window === 'undefined') return;
    // Auto-calculate R-multiple if riskAmount provided
    const enriched: Trade = {
      ...trade,
      rMultiple:
        trade.riskAmount && trade.riskAmount > 0 && trade.pnl != null
          ? parseFloat((trade.pnl / trade.riskAmount).toFixed(2))
          : trade.rMultiple,
      reviewed: trade.reviewed ?? false,
      tags: trade.tags ?? [],
    };
    const trades = tradesStore.getAll();
    trades.push(enriched);
    localStorage.setItem(STORAGE_KEYS.TRADES, JSON.stringify(trades));
  },

  update: (id: string, updates: Partial<Trade>) => {
    if (typeof window === 'undefined') return;
    const trades = tradesStore.getAll();
    const index = trades.findIndex((t) => t.id === id);
    if (index !== -1) {
      const merged = { ...trades[index], ...updates };
      // Recalculate R-multiple on update if risk info present
      if (merged.riskAmount && merged.riskAmount > 0 && merged.pnl != null) {
        merged.rMultiple = parseFloat((merged.pnl / merged.riskAmount).toFixed(2));
      }
      trades[index] = merged;
      localStorage.setItem(STORAGE_KEYS.TRADES, JSON.stringify(trades));
    }
  },

  delete: (id: string) => {
    if (typeof window === 'undefined') return;
    const trades = tradesStore.getAll().filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TRADES, JSON.stringify(trades));
  },
};

// ─── Strategies store ─────────────────────────────────────────────────────────

export const strategiesStore = {
  getAll: (): Strategy[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.STRATEGIES);
    return data ? JSON.parse(data) : [];
  },
  add: (strategy: Strategy) => {
    if (typeof window === 'undefined') return;
    const strategies = strategiesStore.getAll();
    strategies.push(strategy);
    localStorage.setItem(STORAGE_KEYS.STRATEGIES, JSON.stringify(strategies));
  },
  update: (id: string, updates: Partial<Strategy>) => {
    if (typeof window === 'undefined') return;
    const strategies = strategiesStore.getAll();
    const index = strategies.findIndex((s) => s.id === id);
    if (index !== -1) {
      strategies[index] = { ...strategies[index], ...updates };
      localStorage.setItem(STORAGE_KEYS.STRATEGIES, JSON.stringify(strategies));
    }
  },
};

// ─── Modules store ────────────────────────────────────────────────────────────

export const modulesStore = {
  getAll: (): LearningModule[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.MODULES);
    return data ? JSON.parse(data) : [];
  },
  add: (module: LearningModule) => {
    if (typeof window === 'undefined') return;
    const modules = modulesStore.getAll();
    modules.push(module);
    localStorage.setItem(STORAGE_KEYS.MODULES, JSON.stringify(modules));
  },
  markComplete: (id: string) => {
    if (typeof window === 'undefined') return;
    const modules = modulesStore.getAll();
    const index = modules.findIndex((m) => m.id === id);
    if (index !== -1) {
      modules[index].completed = true;
      localStorage.setItem(STORAGE_KEYS.MODULES, JSON.stringify(modules));
    }
  },
};

// ─── Analytics store ──────────────────────────────────────────────────────────

export const analyticsStore = {
  getWinRate: (): number => {
    const trades = tradesStore.getAll();
    if (trades.length === 0) return 0;
    const wins = trades.filter((t) => t.status === 'win').length;
    return (wins / trades.length) * 100;
  },

  getTotalPnL: (): number => {
    return tradesStore.getAll().reduce((sum, t) => sum + (t.pnl || 0), 0);
  },

  getDisciplineScore: (): number => {
    const trades = tradesStore.getAll();
    if (trades.length === 0) return 100;
    const violatingTrades = trades.filter((t) => t.violations.length > 0).length;
    return Math.max(0, 100 - (violatingTrades / trades.length) * 50);
  },

  getTradesByPair: (): Record<string, number> => {
    const trades = tradesStore.getAll();
    return trades.reduce((acc, t) => {
      acc[t.pair] = (acc[t.pair] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  },

  // ── New helpers ─────────────────────────────────────────────────────────────

  getProfitFactor: (): number => {
    const trades = tradesStore.getAll();
    const grossProfit = trades.filter((t) => (t.pnl ?? 0) > 0).reduce((s, t) => s + (t.pnl ?? 0), 0);
    const grossLoss   = Math.abs(trades.filter((t) => (t.pnl ?? 0) < 0).reduce((s, t) => s + (t.pnl ?? 0), 0));
    return grossLoss === 0 ? grossProfit > 0 ? 999 : 0 : parseFloat((grossProfit / grossLoss).toFixed(2));
  },

  getAvgWin: (): number => {
    const wins = tradesStore.getAll().filter((t) => (t.pnl ?? 0) > 0);
    if (wins.length === 0) return 0;
    return wins.reduce((s, t) => s + (t.pnl ?? 0), 0) / wins.length;
  },

  getAvgLoss: (): number => {
    const losses = tradesStore.getAll().filter((t) => (t.pnl ?? 0) < 0);
    if (losses.length === 0) return 0;
    return losses.reduce((s, t) => s + (t.pnl ?? 0), 0) / losses.length;
  },

  getTradesByTag: (): Record<string, { count: number; pnl: number; wins: number }> => {
    const trades = tradesStore.getAll();
    const result: Record<string, { count: number; pnl: number; wins: number }> = {};
    trades.forEach((t) => {
      (t.tags ?? []).forEach((tagId) => {
        if (!result[tagId]) result[tagId] = { count: 0, pnl: 0, wins: 0 };
        result[tagId].count += 1;
        result[tagId].pnl   += t.pnl ?? 0;
        if (t.status === 'win') result[tagId].wins += 1;
      });
    });
    return result;
  },
};

// ─── Drawdown calculator ─────────────────────────────────────────────────────

export function calcDrawdown(
  trades: Trade[],
  startingBalance = 10000
): DrawdownStats {
  if (trades.length === 0) {
    return {
      maxDrawdownDollar: 0,
      maxDrawdownPercent: 0,
      maxDrawdownDate: '',
      maxConsecutiveLosses: 0,
      currentConsecutiveLosses: 0,
      currentDrawdownFromPeak: 0,
    };
  }

  const sorted = [...trades].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let balance = startingBalance;
  let peak = startingBalance;
  let maxDD = 0;
  let maxDDPercent = 0;
  let maxDDDate = '';
  let consLoss = 0;
  let maxConsLoss = 0;

  sorted.forEach((t) => {
    balance += t.pnl ?? 0;
    if (balance > peak) peak = balance;

    const dd    = peak - balance;
    const ddPct = peak > 0 ? (dd / peak) * 100 : 0;

    if (dd > maxDD) {
      maxDD        = dd;
      maxDDPercent = ddPct;
      maxDDDate    = t.date;
    }

    if (t.status === 'loss') {
      consLoss++;
      if (consLoss > maxConsLoss) maxConsLoss = consLoss;
    } else {
      consLoss = 0;
    }
  });

  // Current consecutive losses (from tail)
  let currentConsLoss = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i].status === 'loss') currentConsLoss++;
    else break;
  }

  const currentDD = peak > 0 ? ((peak - balance) / peak) * 100 : 0;

  return {
    maxDrawdownDollar: maxDD,
    maxDrawdownPercent: maxDDPercent,
    maxDrawdownDate: maxDDDate,
    maxConsecutiveLosses: maxConsLoss,
    currentConsecutiveLosses: currentConsLoss,
    currentDrawdownFromPeak: currentDD,
  };
}

// ─── Calendar builder ─────────────────────────────────────────────────────────

export function buildCalendarData(trades: Trade[]): Record<string, DayStats> {
  const map: Record<string, DayStats> = {};
  trades.forEach((t) => {
    if (!map[t.date]) map[t.date] = { date: t.date, pnl: 0, tradeCount: 0, winCount: 0 };
    map[t.date].pnl        += t.pnl ?? 0;
    map[t.date].tradeCount += 1;
    if (t.status === 'win') map[t.date].winCount += 1;
  });
  return map;
}