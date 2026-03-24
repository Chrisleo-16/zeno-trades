// lib/store-extended.ts
// Drop-in additions to your existing lib/store.ts
// Add these types and helpers alongside your existing Trade type

// ─── Extended Trade fields ───────────────────────────────────────────────────

export type TradeTag = {
  id: string;
  label: string;
  category: 'setup' | 'mistake' | 'custom';
  color: string; // hex
};

export type TradeRating = 1 | 2 | 3 | 4 | 5;

// Merge these into your existing Trade type:
export interface TradeExtended {
  tags: string[];          // array of TradeTag ids
  rating?: TradeRating;    // 1–5 execution quality
  reviewed: boolean;       // has user reviewed this trade
  commission?: number;     // fees/spread cost
  screenshots?: string[];  // base64 or URL list
  setupNotes?: string;     // pre-trade plan
  reviewNotes?: string;    // post-trade review
  riskAmount?: number;     // $ risked
  rMultiple?: number;      // pnl / riskAmount
}

// ─── Default tag library ─────────────────────────────────────────────────────

export const DEFAULT_TAGS: TradeTag[] = [
  // Setups
  { id: 'london-breakout',  label: 'London Breakout',   category: 'setup',   color: '#00ff87' },
  { id: 'ny-open',          label: 'NY Open',           category: 'setup',   color: '#60a5fa' },
  { id: 'trend-follow',     label: 'Trend Follow',      category: 'setup',   color: '#a78bfa' },
  { id: 'reversal',         label: 'Reversal',          category: 'setup',   color: '#f59e0b' },
  { id: 'range-break',      label: 'Range Break',       category: 'setup',   color: '#f472b6' },
  { id: 'news-play',        label: 'News Play',         category: 'setup',   color: '#fb923c' },
  // Mistakes
  { id: 'revenge-trade',    label: 'Revenge Trade',     category: 'mistake', color: '#ef4444' },
  { id: 'fomo',             label: 'FOMO',              category: 'mistake', color: '#ef4444' },
  { id: 'early-exit',       label: 'Early Exit',        category: 'mistake', color: '#ef4444' },
  { id: 'late-entry',       label: 'Late Entry',        category: 'mistake', color: '#f97316' },
  { id: 'no-stop',          label: 'No Stop Loss',      category: 'mistake', color: '#f97316' },
  { id: 'oversized',        label: 'Oversized',         category: 'mistake', color: '#f97316' },
];

// ─── Tags store ──────────────────────────────────────────────────────────────

const TAGS_KEY = 'apex_tags';

export const tagsStore = {
  getAll(): TradeTag[] {
    if (typeof window === 'undefined') return DEFAULT_TAGS;
    try {
      const raw = localStorage.getItem(TAGS_KEY);
      return raw ? JSON.parse(raw) : DEFAULT_TAGS;
    } catch {
      return DEFAULT_TAGS;
    }
  },
  add(tag: TradeTag): void {
    const tags = this.getAll();
    tags.push(tag);
    localStorage.setItem(TAGS_KEY, JSON.stringify(tags));
  },
  delete(id: string): void {
    const tags = this.getAll().filter((t) => t.id !== id);
    localStorage.setItem(TAGS_KEY, JSON.stringify(tags));
  },
};

// ─── Drawdown calculator ─────────────────────────────────────────────────────

export type DrawdownStats = {
  maxDrawdownDollar: number;
  maxDrawdownPercent: number;
  maxDrawdownDate: string;
  maxConsecutiveLosses: number;
  currentConsecutiveLosses: number;
  currentDrawdownFromPeak: number;
};

export function calcDrawdown(
  trades: Array<{ pnl?: number; date: string; status: string }>,
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

  // Sort by date ascending
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
  let currentConsLoss = 0;

  sorted.forEach((t) => {
    balance += t.pnl ?? 0;
    if (balance > peak) peak = balance;

    const dd = peak - balance;
    const ddPct = peak > 0 ? (dd / peak) * 100 : 0;

    if (dd > maxDD) {
      maxDD = dd;
      maxDDPercent = ddPct;
      maxDDDate = t.date;
    }

    if (t.status === 'loss') {
      consLoss++;
      if (consLoss > maxConsLoss) maxConsLoss = consLoss;
    } else {
      consLoss = 0;
    }
  });

  // Current consecutive losses (from end of list)
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

// ─── Calendar helpers ────────────────────────────────────────────────────────

export type DayStats = {
  date: string;        // YYYY-MM-DD
  pnl: number;
  tradeCount: number;
  winCount: number;
};

export function buildCalendarData(
  trades: Array<{ date: string; pnl?: number; status: string }>
): Record<string, DayStats> {
  const map: Record<string, DayStats> = {};

  trades.forEach((t) => {
    if (!map[t.date]) {
      map[t.date] = { date: t.date, pnl: 0, tradeCount: 0, winCount: 0 };
    }
    map[t.date].pnl += t.pnl ?? 0;
    map[t.date].tradeCount += 1;
    if (t.status === 'win') map[t.date].winCount += 1;
  });

  return map;
}