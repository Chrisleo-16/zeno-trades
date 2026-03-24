/**
 * lib/import-historical.ts
 *
 * Run this ONCE on first load to seed your APEX system with all
 * historical trades from your TRADING_JOURNAL_2026.xlsx
 *
 * Usage — call importHistoricalTrades() from your app/page.tsx
 * or dashboard layout useEffect. It checks a flag so it only
 * runs once and never overwrites trades you add after.
 */

import { tradesStore, type Trade } from '@/lib/store';

const IMPORT_FLAG = 'apex_historical_imported';

// ── All 11 trades from TRADING_JOURNAL_2026.xlsx (March 2026) ─────────────────

const HISTORICAL_TRADES: Trade[] = [
  {
    id: 'hist-1',
    date: '2026-03-02',
    entryTime: '09:00 AM',
    pair: 'GBP/JPY',
    type: 'long',
    entryPrice: 209.921,
    exitPrice: 210.062,
    quantity: 1,
    pnl: -0.96,
    status: 'loss',
    tags: ['fomo'],
    notes: 'A loss of 0.90 due to FOMO',
    checklistCompleted: true,
    violations: ['emotional'],
    strategyUsed: 'Supply & Demand + FVG + FRVP',
    emotionalState: 'excited',
    sessionType: 'london',
    reviewed: true,
    reviewNotes: 'A loss of 0.90 due to FOMO',
  },
  {
    id: 'hist-2',
    date: '2026-03-05',
    entryTime: '09:00 AM',
    pair: 'GBP/JPY',
    type: 'short',
    entryPrice: 209.848,
    exitPrice: 209.789,
    quantity: 1,
    pnl: -0.38,
    status: 'loss',
    tags: ['late-entry'],
    notes: 'It hit stop loss.',
    checklistCompleted: true,
    violations: [],
    strategyUsed: 'Supply & Demand + FVG + FRVP',
    emotionalState: 'calm',
    sessionType: 'london',
    reviewed: true,
    reviewNotes: 'It hit stop loss.',
  },
  {
    id: 'hist-3',
    date: '2026-03-06',
    entryTime: '09:00 AM',
    pair: 'GBP/JPY',
    type: 'short',
    entryPrice: 210.664,
    exitPrice: 210.6,
    quantity: 1,
    pnl: -0.41,
    status: 'loss',
    tags: ['fomo', 'late-entry'],
    notes: 'I missed an entry and got stopped out by entering due to fomo',
    checklistCompleted: true,
    violations: ['emotional'],
    strategyUsed: 'Supply & Demand + FVG + FRVP',
    emotionalState: 'excited',
    sessionType: 'london',
    reviewed: true,
    reviewNotes: 'I missed an entry and got stopped out by entering due to fomo',
  },
  {
    id: 'hist-4',
    date: '2026-03-09',
    entryTime: '09:00 AM',
    pair: 'EUR/USD',
    type: 'long',
    entryPrice: 1.15788,
    exitPrice: 1.16001,
    quantity: 1,
    pnl: 2.13,
    status: 'win',
    tags: ['trend-follow'],
    notes: 'Followed the market structure 15min',
    checklistCompleted: true,
    violations: [],
    strategyUsed: 'Supply & Demand + FVG + FRVP',
    emotionalState: 'calm',
    sessionType: 'london',
    reviewed: true,
    reviewNotes: 'Followed the market structure 15min',
  },
  {
    id: 'hist-5',
    date: '2026-03-10',
    entryTime: '09:00 AM',
    pair: 'EUR/USD',
    type: 'short',
    entryPrice: 1.16409,
    exitPrice: 1.16365,
    quantity: 1,
    pnl: -0.44,
    status: 'loss',
    tags: ['late-entry'],
    notes: 'I was stopped due to stop loss',
    checklistCompleted: true,
    violations: [],
    strategyUsed: 'Supply & Demand + FVG + FRVP',
    emotionalState: 'calm',
    sessionType: 'london',
    reviewed: true,
    reviewNotes: 'I was stopped due to stop loss',
  },
  {
    id: 'hist-6',
    date: '2026-03-11',
    entryTime: '09:00 AM',
    pair: 'EUR/USD',
    type: 'long',
    entryPrice: 1.15925,
    exitPrice: 1.1603,
    quantity: 1,
    pnl: -1.05,
    status: 'loss',
    tags: ['late-entry', 'trend-follow'],
    notes: 'I was stopped due to stop loss. I did not wait to see market structure',
    checklistCompleted: true,
    violations: [],
    strategyUsed: 'Supply & Demand + FVG + FRVP',
    emotionalState: 'calm',
    sessionType: 'london',
    reviewed: true,
    reviewNotes: 'I was stopped due to stop loss. I did not wait to see market structure',
  },
  {
    id: 'hist-7',
    date: '2026-03-12',
    entryTime: '09:00 AM',
    pair: 'EUR/USD',
    type: 'short',
    entryPrice: 1.15481,
    exitPrice: 1.15443,
    quantity: 1,
    pnl: -0.38,
    status: 'loss',
    tags: ['fomo', 'late-entry'],
    notes: 'I entered due to greed and FOMO and got stopped out in a second',
    checklistCompleted: true,
    violations: ['emotional'],
    strategyUsed: 'Supply & Demand + FVG + FRVP',
    emotionalState: 'excited',
    sessionType: 'london',
    reviewed: true,
    reviewNotes: 'I entered due to greed and FOMO and got stopped out in a second',
  },
  {
    id: 'hist-8',
    date: '2026-03-13',
    entryTime: '09:00 AM',
    pair: 'EUR/USD',
    type: 'short',
    entryPrice: 1.14733,
    exitPrice: 1.14671,
    quantity: 1,
    pnl: -0.62,
    status: 'loss',
    tags: ['fomo'],
    notes: 'FOMO — entered emotionally',
    checklistCompleted: true,
    violations: ['emotional'],
    strategyUsed: 'Supply & Demand + FVG + FRVP',
    emotionalState: 'excited',
    sessionType: 'london',
    reviewed: true,
    reviewNotes: 'Pure FOMO trade. No setup confirmed.',
  },
  {
    id: 'hist-9',
    date: '2026-03-16',
    entryTime: '09:00 AM',
    pair: 'EUR/USD',
    type: 'long',
    entryPrice: 1.14488,
    exitPrice: 1.14549,
    quantity: 1,
    pnl: -0.61,
    status: 'loss',
    tags: [],
    notes: 'I never looked the trades well',
    checklistCompleted: true,
    violations: [],
    strategyUsed: 'Supply & Demand + FVG + FRVP',
    emotionalState: 'calm',
    sessionType: 'london',
    reviewed: true,
    reviewNotes: 'Did not analyse the chart properly before entering.',
  },
  {
    id: 'hist-10',
    date: '2026-03-17',
    entryTime: '09:00 AM',
    pair: 'GBP/JPY',
    type: 'short',
    entryPrice: 211.836,
    exitPrice: 211.671,
    quantity: 1,
    pnl: -1.03,
    status: 'loss',
    tags: ['early-exit'],
    notes: 'I entered too early, never waited for price to retrace back',
    checklistCompleted: true,
    violations: [],
    strategyUsed: 'Supply & Demand + FVG + FRVP',
    emotionalState: 'calm',
    sessionType: 'london',
    reviewed: true,
    reviewNotes: 'Patience issue — entered before confirmation.',
  },
  {
    id: 'hist-11',
    date: '2026-03-19',
    entryTime: '09:00 AM',
    pair: 'EUR/USD',
    type: 'short',
    entryPrice: 1.14663,
    exitPrice: 1.14629,
    quantity: 1,
    pnl: -0.43,
    status: 'loss',
    tags: ['fomo', 'late-entry'],
    notes: 'I entered due to greed and FOMO and got stopped out in a second',
    checklistCompleted: true,
    violations: ['emotional'],
    strategyUsed: 'Supply & Demand + FVG + FRVP',
    emotionalState: 'excited',
    sessionType: 'london',
    reviewed: true,
    reviewNotes: 'Same FOMO pattern repeating. Need discipline enforcement.',
  },
];

/**
 * Call this once — checks the import flag so it never double-imports.
 * Returns true if it ran the import, false if already done.
 */
export function importHistoricalTrades(): boolean {
  if (typeof window === 'undefined') return false;
  if (localStorage.getItem(IMPORT_FLAG)) return false;

  // Get existing trade IDs so we don't duplicate
  const existing = tradesStore.getAll();
  const existingIds = new Set(existing.map(t => t.id));

  let added = 0;
  for (const trade of HISTORICAL_TRADES) {
    if (!existingIds.has(trade.id)) {
      tradesStore.add(trade);
      added++;
    }
  }

  localStorage.setItem(IMPORT_FLAG, 'true');
  console.log(`[APEX] Imported ${added} historical trades from TRADING_JOURNAL_2026.xlsx`);
  return true;
}

/**
 * Force re-import — clears the flag and re-runs.
 * Only use for debugging or reset.
 */
export function forceReimportHistoricalTrades(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(IMPORT_FLAG);
  importHistoricalTrades();
}

/**
 * Check if historical import has already run
 */
export function isHistoricalImportDone(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(IMPORT_FLAG);
}