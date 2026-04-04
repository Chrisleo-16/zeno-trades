// lib/store.ts - Main data store with localStorage fallback and Supabase sync

export interface Trade {
  id: string
  user_id: string
  pair: string
  type: 'buy' | 'sell' | 'long' | 'short'
  status: 'win' | 'loss' | 'breakeven' | 'pending' | 'open'
  entry_price: number
  entryPrice?: number // Legacy support
  exit_price?: number
  exitPrice?: number // Legacy support
  stop_loss?: number
  take_profit?: number
  pnl?: number
  size: number
  date: string
  session: string
  entry_time?: string
  emotional_state: string
  strategy?: string
  violations?: string[]
  notes?: string
  tags?: string[]
  rating?: 1 | 2 | 3 | 4 | 5
  reviewed: boolean
  commission?: number
  screenshots?: string[]
  setup_notes?: string
  review_notes?: string
  risk_amount?: number
  r_multiple?: number
  rMultiple?: number // Legacy support
  created_at: string
  updated_at: string
}

export type TradeStatus = 'win' | 'loss' | 'breakeven' | 'pending' | 'open'

export interface TradeTag {
  id: string
  label: string
  category: 'setup' | 'mistake' | 'custom'
  color: string
}

export interface Strategy {
  id: string
  user_id: string
  name: string
  description: string
  rules: string[]
  risk_level: 'low' | 'medium' | 'high'
  confidence: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface UserAnalytics {
  id: string
  user_id: string
  total_trades: number
  win_rate: number
  total_pnl: number
  max_drawdown: number
  current_drawdown: number
  consecutive_wins: number
  consecutive_losses: number
  avg_win: number
  avg_loss: number
  profit_factor: number
  sharpe_ratio?: number
  updated_at: string
}

export interface UserProfile {
  id: string
  user_id: string
  name: string
  email: string
  trading_style?: string
  experience?: string
  risk_tolerance?: string
  preferred_session: 'london' | 'newyork' | 'tokyo' | 'sydney'
  target_account: number
  created_at: string
  updated_at: string
}

export interface DrawdownStats {
  max_drawdown: number
  current_drawdown: number
  drawdown_periods: number
  recovery_time: number
  maxDrawdownDollar: number
  maxDrawdownPercent: number
  maxDrawdownDate: string
  maxConsecutiveLosses: number
  currentConsecutiveLosses: number
  currentDrawdownFromPeak: number
}

export interface DayStats {
  date: string
  trades: number
  pnl: number
  win_rate: number
  max_drawdown: number
  tradeCount: number
  winCount: number
}

export interface LearningModule {
  id: string
  type: 'psychology' | 'strategy' | 'risk' | 'technical'
  title: string
  description: string
  content: string
  duration: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  prerequisites?: string[]
  tags?: string[]
  created_at: string
  updated_at: string
}

// Store keys
const TRADES_KEY = 'zeno_trades'
const STRATEGIES_KEY = 'zeno_strategies'
const ANALYTICS_KEY = 'zeno_analytics'
const TAGS_KEY = 'zeno_tags'
const PROFILE_KEY = 'zeno_profile'

// Base store class
abstract class BaseStore<T> {
  protected key: string
  
  constructor(key: string) {
    this.key = key
  }

  protected isClient(): boolean {
    return typeof window !== 'undefined'
  }

  protected getFromStorage(): T[] {
    if (!this.isClient()) return []
    try {
      const raw = localStorage.getItem(this.key)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  }

  protected saveToStorage(data: T[]): void {
    if (!this.isClient()) return
    try {
      localStorage.setItem(this.key, JSON.stringify(data))
    } catch {
      // Silently fail for read-only mode
    }
  }

  abstract getAll(): T[]
  abstract add(item: Omit<T, 'id' | 'created_at' | 'updated_at'>): T
  abstract update(id: string, updates: Partial<T>): T | null
  abstract delete(id: string): boolean
}

// Trades Store
export class TradesStore extends BaseStore<Trade> {
  constructor() {
    super(TRADES_KEY)
  }

  getAll(): Trade[] {
    return this.getFromStorage()
  }

  add(tradeData: Omit<Trade, 'id' | 'created_at' | 'updated_at'>): Trade {
    const trade: Trade = {
      ...tradeData,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    
    const trades = this.getAll()
    trades.push(trade)
    this.saveToStorage(trades)
    
    return trade
  }

  update(id: string, updates: Partial<Trade>): Trade | null {
    const trades = this.getAll()
    const index = trades.findIndex(t => t.id === id)
    
    if (index === -1) return null
    
    trades[index] = {
      ...trades[index],
      ...updates,
      updated_at: new Date().toISOString(),
    }
    
    this.saveToStorage(trades)
    return trades[index]
  }

  delete(id: string): boolean {
    const trades = this.getAll()
    const filtered = trades.filter(t => t.id !== id)
    
    if (filtered.length === trades.length) return false
    
    this.saveToStorage(filtered)
    return true
  }

  getByDateRange(startDate: string, endDate: string): Trade[] {
    return this.getAll().filter(trade => 
      trade.date >= startDate && trade.date <= endDate
    )
  }

  getByPair(pair: string): Trade[] {
    return this.getAll().filter(trade => trade.pair === pair)
  }

  getWinRate(): number {
    const trades = this.getAll()
    if (trades.length === 0) return 0
    const wins = trades.filter(t => t.status === 'win').length
    return (wins / trades.length) * 100
  }

  getTotalPnL(): number {
    return this.getAll().reduce((sum, trade) => sum + (trade.pnl || 0), 0)
  }
}

// Strategies Store
export class StrategiesStore extends BaseStore<Strategy> {
  constructor() {
    super(STRATEGIES_KEY)
  }

  getAll(): Strategy[] {
    return this.getFromStorage()
  }

  add(strategyData: Omit<Strategy, 'id' | 'created_at' | 'updated_at'>): Strategy {
    const strategy: Strategy = {
      ...strategyData,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    
    const strategies = this.getAll()
    strategies.push(strategy)
    this.saveToStorage(strategies)
    
    return strategy
  }

  update(id: string, updates: Partial<Strategy>): Strategy | null {
    const strategies = this.getAll()
    const index = strategies.findIndex(s => s.id === id)
    
    if (index === -1) return null
    
    strategies[index] = {
      ...strategies[index],
      ...updates,
      updated_at: new Date().toISOString(),
    }
    
    this.saveToStorage(strategies)
    return strategies[index]
  }

  delete(id: string): boolean {
    const strategies = this.getAll()
    const filtered = strategies.filter(s => s.id !== id)
    
    if (filtered.length === strategies.length) return false
    
    this.saveToStorage(filtered)
    return true
  }

  getActive(): Strategy[] {
    return this.getAll().filter(s => s.active)
  }
}

// Tags Store
export class TagsStore extends BaseStore<TradeTag> {
  constructor() {
    super(TAGS_KEY)
  }

  getAll(): TradeTag[] {
    return this.getFromStorage()
  }

  add(tagData: Omit<TradeTag, 'id'>): TradeTag {
    const tag: TradeTag = {
      ...tagData,
      id: crypto.randomUUID(),
    }
    
    const tags = this.getAll()
    tags.push(tag)
    this.saveToStorage(tags)
    
    return tag
  }

  update(id: string, updates: Partial<TradeTag>): TradeTag | null {
    const tags = this.getAll()
    const index = tags.findIndex(t => t.id === id)
    
    if (index === -1) return null
    
    tags[index] = { ...tags[index], ...updates }
    this.saveToStorage(tags)
    return tags[index]
  }

  delete(id: string): boolean {
    const tags = this.getAll()
    const filtered = tags.filter(t => t.id !== id)
    
    if (filtered.length === tags.length) return false
    
    this.saveToStorage(filtered)
    return true
  }
}

// Modules Store
export class ModulesStore extends BaseStore<LearningModule> {
  constructor() {
    super('zeno_modules')
  }

  getAll(): LearningModule[] {
    return this.getFromStorage()
  }

  add(moduleData: Omit<LearningModule, 'id' | 'created_at' | 'updated_at'>): LearningModule {
    const module: LearningModule = {
      ...moduleData,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    
    const modules = this.getAll()
    modules.push(module)
    this.saveToStorage(modules)
    
    return module
  }

  update(id: string, updates: Partial<LearningModule>): LearningModule | null {
    const modules = this.getAll()
    const index = modules.findIndex(m => m.id === id)
    
    if (index === -1) return null
    
    modules[index] = {
      ...modules[index],
      ...updates,
      updated_at: new Date().toISOString(),
    }
    
    this.saveToStorage(modules)
    return modules[index]
  }

  delete(id: string): boolean {
    const modules = this.getAll()
    const filtered = modules.filter(m => m.id !== id)
    
    if (filtered.length === modules.length) return false
    
    this.saveToStorage(filtered)
    return true
  }

  getByType(type: LearningModule['type']): LearningModule[] {
    return this.getAll().filter(m => m.type === type)
  }

  getCompleted(): LearningModule[] {
    return this.getAll().filter(m => m.tags?.includes('completed'))
  }
}

// Profile Store (singleton pattern - different from BaseStore)
export class ProfileStore {
  private static instance: ProfileStore;
  private profile: UserProfile | null = null;
  private readonly PROFILE_KEY = 'zeno_profile';

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): ProfileStore {
    if (!ProfileStore.instance) {
      ProfileStore.instance = new ProfileStore();
    }
    return ProfileStore.instance;
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(this.PROFILE_KEY);
      if (stored) {
        this.profile = JSON.parse(stored);
      }
    } catch {
      // Silently fail
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined' || !this.profile) return;
    try {
      localStorage.setItem(this.PROFILE_KEY, JSON.stringify(this.profile));
    } catch {
      // Silently fail
    }
  }

  get(): UserProfile | null {
    return this.profile;
  }

  set(profile: UserProfile): void {
    this.profile = { ...profile, updated_at: new Date().toISOString() };
    this.saveToStorage();
  }

  update(updates: Partial<UserProfile>): UserProfile | null {
    if (!this.profile) return null;
    this.profile = { ...this.profile, ...updates, updated_at: new Date().toISOString() };
    this.saveToStorage();
    return this.profile;
  }

  clear(): void {
    this.profile = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.PROFILE_KEY);
    }
  }
}

// Analytics Store (calculated from trades)
export class AnalyticsStore {
  private tradesStore: TradesStore

  constructor(tradesStore: TradesStore) {
    this.tradesStore = tradesStore
  }

  calculate(): UserAnalytics {
    const trades = this.tradesStore.getAll()
    const wins = trades.filter(t => t.status === 'win')
    const losses = trades.filter(t => t.status === 'loss')
    
    const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0)
    const totalRisked = trades.reduce((sum, t) => sum + (t.risk_amount || 0), 0)
    
    const winRate = trades.length > 0 ? (wins.length / trades.length) * 100 : 0
    const avgWin = wins.length > 0 ? wins.reduce((sum, t) => sum + (t.pnl || 0), 0) / wins.length : 0
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((sum, t) => sum + (t.pnl || 0), 0) / losses.length) : 0
    
    const profitFactor = avgLoss > 0 ? avgWin / avgLoss : 0
    
    return {
      id: crypto.randomUUID(),
      user_id: 'current_user', // This would come from auth
      total_trades: trades.length,
      win_rate: winRate,
      total_pnl: totalPnL,
      max_drawdown: 0, // Would need more complex calculation
      current_drawdown: 0, // Would need more complex calculation
      consecutive_wins: 0, // Would need calculation
      consecutive_losses: 0, // Would need calculation
      avg_win: avgWin,
      avg_loss: avgLoss,
      profit_factor: profitFactor,
      sharpe_ratio: 0, // Would need risk-free rate and periods
      updated_at: new Date().toISOString(),
    }
  }

  getWinRate(): number {
    return this.calculate().win_rate
  }

  getTotalPnL(): number {
    return this.calculate().total_pnl
  }

  getDisciplineScore(): number {
    // Simple calculation based on violations
    const trades = this.tradesStore.getAll()
    if (trades.length === 0) return 100

    const tradesWithViolations = trades.filter(t =>
      t.violations && t.violations.length > 0
    ).length

    const violationRate = tradesWithViolations / trades.length
    return Math.max(0, 100 - (violationRate * 100))
  }

  getTradesByPair(): Record<string, number> {
    const trades = this.tradesStore.getAll()
    const pairCount: Record<string, number> = {}
    
    trades.forEach(trade => {
      pairCount[trade.pair] = (pairCount[trade.pair] || 0) + 1
    })
    
    return pairCount
  }

  getProfitFactor(): number {
    return this.calculate().profit_factor
  }

  getAvgWin(): number {
    return this.calculate().avg_win
  }

  getAvgLoss(): number {
    return this.calculate().avg_loss
  }

  getTradesByTag(): Record<string, { count: number; pnl: number; wins: number }> {
    const trades = this.tradesStore.getAll()
    const tagStats: Record<string, { count: number; pnl: number; wins: number }> = {}

    trades.forEach(trade => {
      if (trade.tags) {
        trade.tags.forEach(tag => {
          if (!tagStats[tag]) {
            tagStats[tag] = { count: 0, pnl: 0, wins: 0 }
          }
          tagStats[tag].count++
          tagStats[tag].pnl += trade.pnl || 0
          if (trade.status === 'win') {
            tagStats[tag].wins++
          }
        })
      }
    })

    return tagStats
  }
}

// Export singleton instances
export const tradesStore = new TradesStore()
export const strategiesStore = new StrategiesStore()
export const tagsStore = new TagsStore()
export const modulesStore = new ModulesStore()
export const analyticsStore = new AnalyticsStore(tradesStore)
export const profileStore = ProfileStore.getInstance()

// Utility functions for analytics
export function calcDrawdown(trades: Trade[], startingBalance?: number): DrawdownStats {
  if (trades.length === 0) {
    return {
      max_drawdown: 0,
      current_drawdown: 0,
      drawdown_periods: 0,
      recovery_time: 0,
      currentDrawdownFromPeak: 0,
      maxDrawdownDollar: 0,
      maxDrawdownPercent: 0,
      maxDrawdownDate: '',
      maxConsecutiveLosses: 0,
      currentConsecutiveLosses: 0,
    };
  }

  let peak = startingBalance || 0;
  let maxDrawdownDollar = 0;
  let maxDrawdownPercent = 0;
  let maxDrawdownDate = '';
  let drawdownPeriods = 0;
  let inDrawdown = false;
  let consecutiveLossCount = 0;
  let maxConsecutiveLosses = 0;
  let currentConsecutiveLosses = 0;
  let currentDrawdownFromPeak = 0;

  // Sort trades by date to ensure chronological order
  const sortedTrades = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  for (const trade of sortedTrades) {
    const pnl = trade.pnl || 0;
    const newEquity = peak + pnl;

    // Update peak if equity reaches new high
    if (newEquity > peak) {
      peak = newEquity;
      // When a new peak is reached, we are no longer in drawdown
      if (inDrawdown) {
        inDrawdown = false;
      }
    }

    // Calculate current drawdown from the most recent peak
    const currentDD = peak - newEquity;
    if (currentDD > 0) {
      currentDrawdownFromPeak = currentDD;
      if (!inDrawdown) {
        inDrawdown = true;
        drawdownPeriods++;
      }
      // Track maximum drawdown in dollars and percent
      if (currentDD > maxDrawdownDollar) {
        maxDrawdownDollar = currentDD;
        maxDrawdownPercent = (maxDrawdownDollar / peak) * 100;
        maxDrawdownDate = trade.date;
      }
    } else {
      currentDrawdownFromPeak = 0;
      inDrawdown = false;
    }

    // Consecutive losses tracking
    if (trade.status === 'loss') {
      consecutiveLossCount++;
      currentConsecutiveLosses = consecutiveLossCount;
      if (consecutiveLossCount > maxConsecutiveLosses) {
        maxConsecutiveLosses = consecutiveLossCount;
      }
    } else {
      consecutiveLossCount = 0;
      currentConsecutiveLosses = 0;
    }
  }

  // Final current drawdown (if still in drawdown after last trade)
  const finalEquity = sortedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) + (startingBalance || 0);
  const finalPeak = Math.max(peak, finalEquity);
  const finalDrawdown = finalPeak - finalEquity;

  return {
    max_drawdown: maxDrawdownDollar,
    current_drawdown: finalDrawdown,
    drawdown_periods: drawdownPeriods,
    recovery_time: 0, // Requires additional logic (tracking time between peak and new ATH)
    currentDrawdownFromPeak: currentDrawdownFromPeak,
    maxDrawdownDollar: maxDrawdownDollar,
    maxDrawdownPercent: maxDrawdownPercent,
    maxDrawdownDate: maxDrawdownDate,
    maxConsecutiveLosses: maxConsecutiveLosses,
    currentConsecutiveLosses: currentConsecutiveLosses,
  };
}

export function buildCalendarData(trades: Trade[]): DayStats[] {
  const dailyMap = new Map<string, DayStats>()

  trades.forEach(trade => {
    const date = trade.date
    const existing = dailyMap.get(date) || {
      date,
      trades: 0,
      pnl: 0,
      win_rate: 0,
      max_drawdown: 0,
      tradeCount: 0,
      winCount: 0,
    }

    existing.trades++
    existing.tradeCount++
    existing.pnl += trade.pnl || 0

    dailyMap.set(date, existing)
  })

  // Calculate win rates and drawdowns
  dailyMap.forEach((day, date) => {
    const dayTrades = trades.filter(t => t.date === date)
    const wins = dayTrades.filter(t => t.status === 'win').length
    day.win_rate = day.trades > 0 ? (wins / day.trades) * 100 : 0
    day.winCount = wins
    
    // Simple drawdown calculation for the day
    day.max_drawdown = Math.min(0, day.pnl)
  })

  return Array.from(dailyMap.values()).sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )
}