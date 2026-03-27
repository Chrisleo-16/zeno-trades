'use client';
import { a } from '@/lib/apex-styles';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  tradesStore, tagsStore,
  type Trade, type TradeStatus, type TradeTag,
} from '@/lib/store';
import { PreTradeChecklist } from '@/components/pre-trade-checklist';
import { TradeDetailModal } from '@/components/trade-detail-modal';
import { Plus, Trash2, TrendingUp, TrendingDown, X, ChevronDown, Star, Eye } from 'lucide-react';

// ─── Shared style tokens ──────────────────────────────────────────────────────

const cardStyle = {
  background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
  border: '1px solid rgba(255,255,255,0.06)',
};

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: 'rgba(255,255,255,0.8)',
  borderRadius: '10px',
  padding: '10px 14px',
  fontSize: '13px',
  width: '100%',
  outline: 'none',
  fontFamily: "'DM Mono', monospace",
};

const labelStyle: React.CSSProperties = {
  fontSize: '10px',
  color: 'rgba(255,255,255,0.3)',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  fontFamily: "'DM Mono', monospace",
  marginBottom: '6px',
  display: 'block',
};

const STATUS_CONFIG: Record<TradeStatus, { color: string; bg: string; border: string }> = {
  win:       { color: '#00ff87', bg: 'rgba(0,255,135,0.1)',  border: 'rgba(0,255,135,0.2)' },
  loss:      { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.2)' },
  breakeven: { color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)' },
  pending:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
  open:      { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.2)' },
};

// ─── Mini select ──────────────────────────────────────────────────────────────

function MiniSelect({
  value, onChange, options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value)?.label ?? value;
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between" style={inputStyle}>
        <span>{current}</span>
        <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.2)' }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            className="absolute top-full mt-1 left-0 right-0 z-50 rounded-xl overflow-hidden"
            style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 16px 40px rgba(0,0,0,0.7)' }}>
            {options.map((opt) => (
              <button key={opt.value} type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-xs transition-colors hover:bg-white/5"
                style={{ color: value === opt.value ? '#00ff87' : 'rgba(255,255,255,0.6)', fontFamily: "'DM Mono',monospace" }}>
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const defaultForm = {
  pair: '',
  type: 'long' as 'long' | 'short',
  entryPrice: '',
  exitPrice: '',
  quantity: '',
  riskAmount: '',
  pnl: '',
  currency: 'USD' as 'USD' | 'cents',
  status: 'pending' as TradeStatus,
  notes: '',
  emotionalState: 'calm' as const,
  strategyUsed: '',
  tags: [] as string[],
};

export default function JournalPage() {
  const [trades, setTrades]               = useState<Trade[]>([]);
  const [allTags, setAllTags]             = useState<TradeTag[]>([]);
  const [isOpen, setIsOpen]               = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [detailTrade, setDetailTrade]     = useState<Trade | null>(null);
  const [formData, setFormData]           = useState(defaultForm);

  useEffect(() => {
    setTrades(tradesStore.getAll());
    setAllTags(tagsStore.getAll());
  }, []);

  const refresh = () => setTrades(tradesStore.getAll());

  const handleAddTrade = () => {
    setFormData(defaultForm);
    setShowChecklist(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const entryPrice = parseFloat(formData.entryPrice);
    const exitPrice  = formData.exitPrice ? parseFloat(formData.exitPrice) : undefined;
    const quantity   = formData.quantity ? parseFloat(formData.quantity) : 1;
    const riskAmount = formData.riskAmount ? parseFloat(formData.riskAmount) : undefined;

    // Currency conversion — always store in USD internally
    // If user is trading a cents account, divide by 100 to normalise
    const toDollars = (v: number) => formData.currency === 'cents' ? v / 100 : v;

    let pnl: number | undefined;
    if (formData.pnl !== '') {
      pnl = parseFloat((toDollars(parseFloat(formData.pnl))).toFixed(2));
    } else if (exitPrice != null && quantity) {
      pnl = parseFloat(((exitPrice - entryPrice) * quantity).toFixed(2));
    }

    const riskUSD = riskAmount != null ? toDollars(riskAmount) : undefined;

    let status = formData.status;
    if (status === 'pending' && pnl != null) {
      status = pnl > 0 ? 'win' : pnl < 0 ? 'loss' : 'breakeven';
    }

    const trade: Trade = {
      id:                 Math.random().toString(36).substr(2, 9),
      user_id:            'current_user',
      date:               new Date().toISOString().split('T')[0],
      entry_time:         new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      entryPrice,
      exitPrice,
      entry_price:        entryPrice || 0,
      exit_price:         exitPrice,
      pair:               formData.pair,
      type:               formData.type,
      size:               quantity,
      pnl,
      risk_amount:        riskUSD,
      rMultiple:          riskUSD && riskUSD > 0 && pnl != null
                            ? parseFloat((pnl / riskUSD).toFixed(2))
                            : undefined,
      r_multiple:         riskUSD && riskUSD > 0 && pnl != null
                            ? parseFloat((pnl / riskUSD).toFixed(2))
                            : undefined,
      status,
      tags:               formData.tags,
      notes:              formData.notes,
      reviewed:           false,
      session:            'london',
      emotional_state:    formData.emotionalState || 'calm',
      strategy:           formData.strategyUsed,
      violations:         [],
      created_at:         new Date().toISOString(),
      updated_at:         new Date().toISOString(),
    };

    tradesStore.add(trade);
    refresh();
    setIsOpen(false);
    setFormData(defaultForm);
  };

  const handleSaveDetail = (updates: Partial<Trade>) => {
    if (!detailTrade) return;
    tradesStore.update(detailTrade.id, updates);
    refresh();
    // Keep modal open with updated data
    setDetailTrade({ ...detailTrade, ...updates });
  };

  // Summary stats
  const wins      = trades.filter((t) => t.status === 'win').length;
  const losses    = trades.filter((t) => t.status === 'loss').length;
  const totalPnL  = trades.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const winRate   = trades.length > 0 ? (wins / trades.length) * 100 : 0;

  const toggleFormTag = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(id) ? prev.tags.filter((t) => t !== id) : [...prev.tags, id],
    }));
  };

  return (
    <motion.div className="space-y-8" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(180deg,#00ff87,#00d4ff)' }} />
            <span className="text-[11px] tracking-widest text-white/30 uppercase" style={{ fontFamily: "'DM Mono',monospace" }}>Trade Journal</span>
          </div>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "'DM Mono',monospace", letterSpacing: '-0.02em' }}>Trade Log</h1>
          <p className="text-white/40 text-sm mt-1">Track every trade with discipline and purpose.</p>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={handleAddTrade}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: 'linear-gradient(135deg,#00ff87 0%,#00d4ff 100%)', color: '#070a10', fontFamily: "'DM Mono',monospace", boxShadow: '0 0 20px rgba(0,255,135,0.3)' }}>
          <Plus className="w-4 h-4" />
          Log Trade
        </motion.button>
      </div>

      {/* ── Quick stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Trades', value: trades.length },
          { label: 'Win Rate',     value: `${winRate.toFixed(1)}%`,                                             color: '#00ff87' },
          { label: 'Total P&L',    value: `${totalPnL >= 0 ? '+' : ''}$${totalPnL.toFixed(2)}`,                 color: totalPnL >= 0 ? '#00ff87' : '#ef4444' },
          { label: 'W / L',        value: `${wins} / ${losses}` },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="rounded-xl p-4" style={cardStyle}>
            <p className="text-[10px] text-white/25 uppercase tracking-widest mb-1.5" style={{ fontFamily: "'DM Mono',monospace" }}>{s.label}</p>
            <p className="text-2xl font-bold" style={{ fontFamily: "'DM Mono',monospace", color: (s as any).color || 'rgba(255,255,255,0.8)', letterSpacing: '-0.02em' }}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Trades table ── */}
      <div className="rounded-2xl overflow-hidden" style={cardStyle}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <span className="text-white/60 text-sm font-semibold">Recent Trades</span>
          <span className="text-[11px] px-2.5 py-1 rounded-md font-bold"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', fontFamily: "'DM Mono',monospace" }}>
            {trades.length} entries
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                {['Pair', 'Date', 'Type', 'Entry', 'Exit', 'P&L', 'R', 'Tags', 'Status', ''].map((h) => (
                  <th key={h} className="text-left py-3 px-3 text-[10px] uppercase tracking-widest font-semibold"
                    style={{ color: 'rgba(255,255,255,0.2)', fontFamily: "'DM Mono',monospace" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trades.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-16">
                    <p className="text-white/20 text-sm" style={{ fontFamily: "'DM Mono',monospace" }}>No trades logged yet</p>
                    <p className="text-white/10 text-xs mt-1">Start your trading journey by logging your first trade</p>
                  </td>
                </tr>
              ) : (
                trades.map((trade, i) => {
                  const sc = STATUS_CONFIG[trade.status];
                  const tradeTags = (trade.tags ?? [])
                    .map((id) => allTags.find((t) => t.id === id))
                    .filter(Boolean) as TradeTag[];

                  return (
                    <motion.tr
                      key={trade.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer' }}
                      className="hover:bg-white/2 transition-colors group"
                      onClick={() => setDetailTrade(trade)}
                    >
                      {/* Pair */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-white/80 font-bold text-sm" style={{ fontFamily: "'DM Mono',monospace" }}>{trade.pair}</span>
                          {trade.reviewed && (
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#00ff87', boxShadow: '0 0 4px #00ff87' }} title="Reviewed" />
                          )}
                        </div>
                      </td>
                      {/* Date */}
                      <td className="py-3 px-3">
                        <span className="text-white/30 text-xs" style={{ fontFamily: "'DM Mono',monospace" }}>{trade.date}</span>
                      </td>
                      {/* Type */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          {trade.type === 'long'
                            ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                            : <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
                          <span className="text-xs capitalize" style={{ color: trade.type === 'long' ? '#00ff87' : '#ef4444', fontFamily: "'DM Mono',monospace" }}>{trade.type}</span>
                        </div>
                      </td>
                      {/* Entry */}
                      <td className="py-3 px-3">
                        <span className="text-white/50 text-xs" style={{ fontFamily: "'DM Mono',monospace" }}>${(trade.entryPrice || trade.entry_price || 0).toFixed(4)}</span>
                      </td>
                      {/* Exit */}
                      <td className="py-3 px-3">
                        <span className="text-white/50 text-xs" style={{ fontFamily: "'DM Mono',monospace" }}>
                          {(trade.exitPrice || trade.exit_price) ? `$${(trade.exitPrice || trade.exit_price || 0).toFixed(4)}` : '—'}
                        </span>
                      </td>
                      {/* P&L */}
                      <td className="py-3 px-3">
                        {trade.pnl != null ? (
                          <span className="text-sm font-bold" style={{ fontFamily: "'DM Mono',monospace", color: trade.pnl >= 0 ? '#00ff87' : '#ef4444' }}>
                            {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                          </span>
                        ) : <span className="text-white/20 text-xs">—</span>}
                      </td>
                      {/* R multiple */}
                      <td className="py-3 px-3">
                        {trade.rMultiple != null ? (
                          <span className="text-xs font-bold" style={{ color: trade.rMultiple >= 0 ? '#00ff87' : '#ef4444', fontFamily: "'DM Mono',monospace" }}>
                            {trade.rMultiple >= 0 ? '+' : ''}{trade.rMultiple}R
                          </span>
                        ) : <span className="text-white/20 text-xs">—</span>}
                      </td>
                      {/* Tags */}
                      <td className="py-3 px-3">
                        <div className="flex gap-1 flex-wrap">
                          {tradeTags.slice(0, 2).map((tag) => (
                            <span key={tag.id} className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                              style={{ background: tag.color + '15', color: tag.color, border: `1px solid ${tag.color}25`, fontFamily: "'DM Mono',monospace" }}>
                              {tag.label}
                            </span>
                          ))}
                          {tradeTags.length > 2 && (
                            <span className="text-[9px] text-white/25" style={{ fontFamily: "'DM Mono',monospace" }}>+{tradeTags.length - 2}</span>
                          )}
                        </div>
                      </td>
                      {/* Status */}
                      <td className="py-3 px-3">
                        <span className="text-[10px] px-2.5 py-1 rounded-md font-bold uppercase"
                          style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, fontFamily: "'DM Mono',monospace" }}>
                          {trade.status}
                        </span>
                      </td>
                      {/* Actions */}
                      <td className="py-3 px-3">
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => { e.stopPropagation(); setDetailTrade(trade); }}
                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
                            style={{ color: 'rgba(255,255,255,0.3)' }}>
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); tradesStore.delete(trade.id); refresh(); }}
                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/10 transition-colors"
                            style={{ color: 'rgba(239,68,68,0.4)' }}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pre-trade checklist ── */}
      <PreTradeChecklist
        isOpen={showChecklist}
        onClose={() => setShowChecklist(false)}
        onConfirm={() => setIsOpen(true)}
      />

      {/* ── Trade form modal ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl"
              style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)' }}>

              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <p className="text-[10px] text-white/30 uppercase tracking-widest mb-0.5" style={{ fontFamily: "'DM Mono',monospace" }}>New Entry</p>
                  <h2 className="text-white font-bold" style={{ fontFamily: "'DM Mono',monospace" }}>Log a Trade</h2>
                </div>
                <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors">
                  <X className="w-4 h-4 text-white/40" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">

                {/* ── Account currency toggle ── */}
                <div className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: "'DM Mono',monospace" }}>
                      Account type
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      {formData.currency === 'USD'
                        ? 'Standard account — P&L entered in US dollars ($)'
                        : 'Cents account — P&L entered in US cents (¢), stored as dollars'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 p-1 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    {([
                      { value: 'USD',   label: '$ USD',   hint: 'Dollars' },
                      { value: 'cents', label: '¢ Cents', hint: 'Cents' },
                    ] as const).map(opt => {
                      const active = formData.currency === opt.value;
                      return (
                        <button key={opt.value} type="button"
                          onClick={() => setFormData(prev => ({ ...prev, currency: opt.value }))}
                          className="relative px-3 py-1.5 rounded-md text-[11px] font-bold transition-colors"
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: active ? '#070a10' : 'rgba(255,255,255,0.3)',
                            fontFamily: "'DM Mono',monospace",
                          }}>
                          {active && (
                            <motion.div layoutId="currencyPill" className="absolute inset-0 rounded-md"
                              style={{ background: 'linear-gradient(135deg,#00ff87,#00d4ff)' }}
                              transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
                          )}
                          <span className="relative z-10">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={labelStyle}>Currency Pair</label>
                    <input type="text" placeholder="EUR/USD" value={formData.pair}
                      onChange={(e) => setFormData({ ...formData, pair: e.target.value })}
                      required style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Trade Type</label>
                    <MiniSelect value={formData.type}
                      onChange={(v) => setFormData({ ...formData, type: v as 'long' | 'short' })}
                      options={[{ value: 'long', label: 'Long ↑' }, { value: 'short', label: 'Short ↓' }]} />
                  </div>
                  <div>
                    <label style={labelStyle}>Entry Price</label>
                    <input type="number" step="0.0001" placeholder="1.0850" value={formData.entryPrice}
                      onChange={(e) => setFormData({ ...formData, entryPrice: e.target.value })}
                      required style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Exit Price</label>
                    <input type="number" step="0.0001" placeholder="1.0900" value={formData.exitPrice}
                      onChange={(e) => setFormData({ ...formData, exitPrice: e.target.value })}
                      style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Quantity (Lots)</label>
                    <input type="number" step="0.01" placeholder="1.0" value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      required style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Risk Amount ($)</label>
                    <input type="number" step="0.01" placeholder="200" value={formData.riskAmount}
                      onChange={(e) => setFormData({ ...formData, riskAmount: e.target.value })}
                      style={inputStyle} />
                  </div>

                  {/* ── Direct P&L — the actual dollar result from your broker ── */}
                  <div className="col-span-2">
                    <label style={labelStyle}>
                      Actual P&L ({formData.currency === 'cents' ? '¢ cents' : '$ dollars'})
                      <span style={{ color: 'rgba(255,255,255,0.18)', marginLeft: 8, textTransform: 'none', letterSpacing: 0 }}>
                        — type your real {formData.currency === 'cents' ? 'cents' : 'dollar'} result from broker
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        placeholder={formData.currency === 'cents' ? 'e.g. +1250 or -800 (cents)' : 'e.g. +12.50 or -8.00'}
                        value={formData.pnl}
                        onChange={(e) => {
                          const v = e.target.value;
                          setFormData((prev) => {
                            const num = parseFloat(v);
                            let status = prev.status;
                            if (!isNaN(num) && v !== '') {
                              status = num > 0 ? 'win' : num < 0 ? 'loss' : 'breakeven';
                            }
                            return { ...prev, pnl: v, status };
                          });
                        }}
                        style={{
                          ...inputStyle,
                          paddingLeft: 36,
                          color: formData.pnl === ''
                            ? 'rgba(255,255,255,0.3)'
                            : parseFloat(formData.pnl) >= 0
                            ? '#00ff87'
                            : '#ef4444',
                          fontWeight: formData.pnl !== '' ? 700 : 400,
                          fontSize: 15,
                        }}
                      />
                      {/* Currency symbol prefix */}
                      <span style={{
                        position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                        color: 'rgba(255,255,255,0.25)', fontSize: 13, fontFamily: "'DM Mono',monospace",
                        pointerEvents: 'none',
                      }}>
                        {formData.currency === 'cents' ? '¢' : '$'}
                      </span>

                      {/* Live badge */}
                      {formData.pnl !== '' && (
                        <span style={{
                          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                          fontSize: 10, fontWeight: 700, fontFamily: "'DM Mono',monospace",
                          padding: '2px 8px', borderRadius: 6,
                          background: parseFloat(formData.pnl) >= 0 ? 'rgba(0,255,135,0.1)' : 'rgba(239,68,68,0.1)',
                          color: parseFloat(formData.pnl) >= 0 ? '#00ff87' : '#ef4444',
                          border: `1px solid ${parseFloat(formData.pnl) >= 0 ? 'rgba(0,255,135,0.2)' : 'rgba(239,68,68,0.2)'}`,
                        }}>
                          {parseFloat(formData.pnl) >= 0 ? 'WIN' : 'LOSS'}
                          {formData.currency === 'cents' && formData.pnl !== '' && (
                            <span style={{ marginLeft: 4, opacity: 0.7 }}>
                              = ${(parseFloat(formData.pnl) / 100).toFixed(2)}
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 5, fontFamily: "'DM Mono',monospace" }}>
                      {formData.currency === 'cents'
                        ? 'Cents account: enter raw cents (e.g. 1250 = $12.50). Automatically converted and stored in dollars.'
                        : 'Leave blank to auto-calculate from entry/exit prices · Use negative for losses (e.g. -8.00)'}
                    </p>
                  </div>

                  <div>
                    <label style={labelStyle}>
                      Status
                      {formData.pnl !== '' && (
                        <span style={{ color: parseFloat(formData.pnl) >= 0 ? '#00ff87' : '#ef4444', marginLeft: 6, textTransform: 'none', letterSpacing: 0 }}>
                          — auto-set
                        </span>
                      )}
                    </label>
                    <MiniSelect value={formData.status}
                      onChange={(v) => setFormData({ ...formData, status: v as TradeStatus })}
                      options={[
                        { value: 'pending',   label: 'Pending' },
                        { value: 'win',       label: 'Win ✓' },
                        { value: 'loss',      label: 'Loss ✗' },
                        { value: 'breakeven', label: 'Breakeven =' },
                      ]} />
                  </div>

                  <div>
                    <label style={labelStyle}>Emotional State</label>
                    <MiniSelect value={formData.emotionalState}
                      onChange={(v) => setFormData({ ...formData, emotionalState: v as any })}
                      options={[
                        { value: 'calm',       label: 'Calm 😌' },
                        { value: 'excited',    label: 'Excited ⚡' },
                        { value: 'frustrated', label: 'Frustrated 😤' },
                        { value: 'fearful',    label: 'Fearful 😰' },
                      ]} />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Strategy Used</label>
                  <input type="text" placeholder="e.g. London Breakout" value={formData.strategyUsed}
                    onChange={(e) => setFormData({ ...formData, strategyUsed: e.target.value })}
                    style={inputStyle} />
                </div>

                {/* Tag picker */}
                <div>
                  <label style={labelStyle}>Tags</label>
                  <div className="flex flex-wrap gap-1.5">
                    {allTags.map((tag) => {
                      const active = formData.tags.includes(tag.id);
                      return (
                        <button key={tag.id} type="button" onClick={() => toggleFormTag(tag.id)}
                          className="text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all"
                          style={{
                            background: active ? `${tag.color}18` : 'rgba(255,255,255,0.03)',
                            color: active ? tag.color : 'rgba(255,255,255,0.3)',
                            border: `1px solid ${active ? `${tag.color}35` : 'rgba(255,255,255,0.06)'}`,
                            fontFamily: "'DM Mono',monospace",
                          }}>
                          {tag.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Trade Notes</label>
                  <textarea placeholder="What happened? What did you learn?" value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3} style={{ ...inputStyle, resize: 'none' }} />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setIsOpen(false)} className="flex-1 py-3 rounded-xl text-sm font-semibold"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', fontFamily: "'DM Mono',monospace" }}>
                    Cancel
                  </button>
                  <motion.button type="submit" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                    className="flex-1 py-3 rounded-xl text-sm font-bold"
                    style={{ background: 'linear-gradient(135deg,#00ff87 0%,#00d4ff 100%)', color: '#070a10', fontFamily: "'DM Mono',monospace", boxShadow: '0 0 20px rgba(0,255,135,0.25)' }}>
                    Save Trade
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Trade detail modal ── */}
      {detailTrade && (
        <TradeDetailModal
          trade={detailTrade}
          allTags={allTags}
          isOpen={!!detailTrade}
          onClose={() => setDetailTrade(null)}
          onSave={handleSaveDetail}
        />
      )}
    </motion.div>
  );
}