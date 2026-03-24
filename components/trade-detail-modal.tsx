'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, TrendingUp, TrendingDown, Star, Tag,
  CheckCircle2, AlertCircle, FileText, Edit3, Save,
} from 'lucide-react';
import type { Trade } from '@/lib/store';
import type { TradeTag } from '@/lib/store-extended';
import { DEFAULT_TAGS } from '@/lib/store-extended';

interface TradeDetailModalProps {
  trade: Trade & {
    tags?: string[];
    rating?: number;
    reviewed?: boolean;
    commission?: number;
    rMultiple?: number;
    riskAmount?: number;
    reviewNotes?: string;
  };
  allTags?: TradeTag[];
  isOpen: boolean;
  onClose: () => void;
  onSave?: (updates: Partial<Trade>) => void;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  win:       { color: '#00ff87', bg: 'rgba(0,255,135,0.1)',  border: 'rgba(0,255,135,0.2)' },
  loss:      { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.2)' },
  breakeven: { color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)' },
  pending:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
};

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
        >
          <Star
            className="w-5 h-5 transition-colors"
            fill={(hover || value) >= n ? '#f59e0b' : 'none'}
            style={{ color: (hover || value) >= n ? '#f59e0b' : 'rgba(255,255,255,0.2)' }}
          />
        </button>
      ))}
    </div>
  );
}

export function TradeDetailModal({
  trade,
  allTags = DEFAULT_TAGS,
  isOpen,
  onClose,
  onSave,
}: TradeDetailModalProps) {
  const [reviewNotes, setReviewNotes] = useState(trade.reviewNotes ?? '');
  const [rating, setRating] = useState(trade.rating ?? 0);
  const [activeTags, setActiveTags] = useState<string[]>(trade.tags ?? []);
  const [editing, setEditing] = useState(false);

  const sc = STATUS_CONFIG[trade.status] ?? STATUS_CONFIG.pending;
  const pnl = trade.pnl ?? 0;
  const rMultiple = trade.riskAmount && trade.riskAmount > 0
    ? (pnl / trade.riskAmount).toFixed(2)
    : trade.rMultiple?.toFixed(2) ?? '—';

  const handleSave = () => {
    onSave?.({ ...trade, tags: activeTags, rating, reviewNotes } as any);
    setEditing(false);
  };

  const toggleTag = (id: string) => {
    setActiveTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const setupTags = allTags.filter((t) => t.category === 'setup');
  const mistakeTags = allTags.filter((t) => t.category === 'mistake');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl"
            style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {/* ── Header band ── */}
            <div
              className="px-5 py-4 flex items-center justify-between"
              style={{
                background: `linear-gradient(135deg,${sc.bg} 0%,transparent 100%)`,
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div className="flex items-center gap-3">
                {trade.type === 'long'
                  ? <TrendingUp className="w-5 h-5 text-emerald-400" />
                  : <TrendingDown className="w-5 h-5 text-red-400" />}
                <div>
                  <p className="text-white font-bold" style={{ fontFamily: "'DM Mono',monospace" }}>
                    {trade.pair}
                  </p>
                  <p className="text-white/30 text-xs">{trade.date} · {trade.entryTime}</p>
                </div>
                <span
                  className="text-[10px] px-2.5 py-1 rounded-lg font-bold uppercase ml-2"
                  style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, fontFamily: "'DM Mono',monospace" }}
                >
                  {trade.status}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {editing ? (
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
                    style={{ background: 'linear-gradient(135deg,#00ff87,#00d4ff)', color: '#070a10', fontFamily: "'DM Mono',monospace" }}
                  >
                    <Save className="w-3.5 h-3.5" /> Save
                  </button>
                ) : (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-white/5 transition-colors"
                    style={{ color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: "'DM Mono',monospace" }}
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Review
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
                >
                  <X className="w-4 h-4 text-white/30" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {/* ── Core stats ── */}
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {[
                  { label: 'P&L', value: `${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`, color: pnl >= 0 ? '#00ff87' : '#ef4444' },
                  { label: 'R MULTIPLE', value: typeof rMultiple === 'string' ? rMultiple : `${Number(rMultiple) > 0 ? '+' : ''}${rMultiple}R`, color: Number(rMultiple) > 0 ? '#00ff87' : '#ef4444' },
                  { label: 'ENTRY', value: `$${trade.entryPrice.toFixed(4)}`, color: 'rgba(255,255,255,0.7)' },
                  { label: 'EXIT', value: trade.exitPrice ? `$${trade.exitPrice.toFixed(4)}` : '—', color: 'rgba(255,255,255,0.7)' },
                  { label: 'QTY', value: String(trade.quantity), color: 'rgba(255,255,255,0.7)' },
                  { label: 'COMMISSION', value: trade.commission ? `-$${trade.commission.toFixed(2)}` : '—', color: 'rgba(255,255,255,0.4)' },
                ].map((s, i) => (
                  <div
                    key={i}
                    className="rounded-xl p-3"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    <p className="text-[9px] uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: "'DM Mono',monospace" }}>{s.label}</p>
                    <p className="text-sm font-bold" style={{ color: s.color, fontFamily: "'DM Mono',monospace" }}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* ── Execution rating ── */}
              <div
                className="rounded-xl p-4"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-white/50 text-xs font-semibold flex items-center gap-2">
                    <Star className="w-3.5 h-3.5 text-amber-400" />
                    Execution Quality
                  </p>
                  {!editing && rating > 0 && (
                    <span className="text-[10px] text-white/20" style={{ fontFamily: "'DM Mono',monospace" }}>
                      {['', 'Very Poor', 'Poor', 'Average', 'Good', 'Perfect'][rating]}
                    </span>
                  )}
                </div>
                <StarRating value={rating} onChange={editing ? setRating : () => {}} />
              </div>

              {/* ── Tags ── */}
              <div
                className="rounded-xl p-4"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <p className="text-white/50 text-xs font-semibold flex items-center gap-2 mb-3">
                  <Tag className="w-3.5 h-3.5 text-blue-400" />
                  Tags
                </p>

                {['setup', 'mistake'].map((cat) => {
                  const tagList = cat === 'setup' ? setupTags : mistakeTags;
                  return (
                    <div key={cat} className="mb-3">
                      <p className="text-[9px] uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: "'DM Mono',monospace" }}>
                        {cat === 'setup' ? '▲ Setups' : '✕ Mistakes'}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {tagList.map((tag) => {
                          const isActive = activeTags.includes(tag.id);
                          return (
                            <button
                              key={tag.id}
                              onClick={() => editing && toggleTag(tag.id)}
                              className="text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all"
                              style={{
                                background: isActive ? `${tag.color}18` : 'rgba(255,255,255,0.03)',
                                color: isActive ? tag.color : 'rgba(255,255,255,0.3)',
                                border: `1px solid ${isActive ? `${tag.color}35` : 'rgba(255,255,255,0.06)'}`,
                                fontFamily: "'DM Mono',monospace",
                                cursor: editing ? 'pointer' : 'default',
                              }}
                            >
                              {tag.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── Strategy used ── */}
              {trade.strategyUsed && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(0,255,135,0.05)', border: '1px solid rgba(0,255,135,0.1)' }}>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="text-xs text-emerald-400/80" style={{ fontFamily: "'DM Mono',monospace" }}>
                    {trade.strategyUsed}
                  </span>
                </div>
              )}

              {/* ── Emotional state ── */}
              {trade.emotionalState && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <AlertCircle className="w-4 h-4 text-white/30 flex-shrink-0" />
                  <span className="text-xs text-white/40 capitalize">{trade.emotionalState}</span>
                </div>
              )}

              {/* ── Trade notes ── */}
              {trade.notes && (
                <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <p className="text-white/40 text-xs font-semibold mb-2 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" />
                    Trade Notes
                  </p>
                  <p className="text-white/50 text-sm leading-relaxed">{trade.notes}</p>
                </div>
              )}

              {/* ── Review notes ── */}
              <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p className="text-white/40 text-xs font-semibold mb-2 flex items-center gap-2">
                  <Edit3 className="w-3.5 h-3.5" />
                  Post-Trade Review
                </p>
                {editing ? (
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="What did you learn? What would you do differently?"
                    rows={4}
                    className="w-full text-sm rounded-xl resize-none"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.7)',
                      padding: '10px 12px',
                      outline: 'none',
                      fontFamily: "'DM Mono',monospace",
                      fontSize: '12px',
                    }}
                  />
                ) : reviewNotes ? (
                  <p className="text-white/50 text-sm leading-relaxed">{reviewNotes}</p>
                ) : (
                  <p className="text-white/20 text-xs italic">
                    No review yet. Click "Review" to add your post-trade analysis.
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}