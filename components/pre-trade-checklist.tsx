'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2, X, ShieldCheck } from 'lucide-react';

interface PreTradeChecklistProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (checklistItems: string[]) => void;
}

const CHECKLIST_ITEMS = [
  'I have identified a clear entry signal',
  'My risk/reward ratio is at least 1:2',
  'I have set my stop loss',
  'I have set my take profit target',
  'The chart timeframe aligns with my strategy',
  'I am in the correct trading session for this pair',
  'My position size is calculated correctly',
  'I have no conflicting trades active',
  'My emotions are calm and focused',
  'I understand my exit plan',
];

export function PreTradeChecklist({ isOpen, onClose, onConfirm }: PreTradeChecklistProps) {
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const toggle = (i: number) => {
    const next = new Set(checked);
    next.has(i) ? next.delete(i) : next.add(i);
    setChecked(next);
  };

  const allChecked = checked.size === CHECKLIST_ITEMS.length;
  const progress = (checked.size / CHECKLIST_ITEMS.length) * 100;

  const handleConfirm = () => {
    if (!allChecked) return;
    onConfirm(CHECKLIST_ITEMS);
    onClose();
    setChecked(new Set());
  };

  const handleClose = () => {
    onClose();
    setChecked(new Set());
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl overflow-hidden"
            style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {/* Header */}
            <div
              className="px-5 py-4 flex items-center justify-between"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}
                >
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <p
                    className="text-white/80 font-bold text-sm"
                    style={{ fontFamily: "'DM Mono',monospace" }}
                  >
                    Pre-Trade Discipline Check
                  </p>
                  <p className="text-white/30 text-xs">Complete all items before entering</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4 text-white/30" />
              </button>
            </div>

            {/* Progress bar */}
            <div className="px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-[10px] uppercase tracking-widest"
                  style={{ color: 'rgba(255,255,255,0.25)', fontFamily: "'DM Mono',monospace" }}
                >
                  Checklist Progress
                </span>
                <span
                  className="text-xs font-bold"
                  style={{
                    color: allChecked ? '#00ff87' : 'rgba(255,255,255,0.4)',
                    fontFamily: "'DM Mono',monospace",
                  }}
                >
                  {checked.size} / {CHECKLIST_ITEMS.length}
                </span>
              </div>
              <div
                className="w-full h-1.5 rounded-full"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                <motion.div
                  className="h-full rounded-full"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                  style={{
                    background: allChecked
                      ? 'linear-gradient(90deg,#00ff87,#00d4ff)'
                      : 'linear-gradient(90deg,#f59e0b,#fbbf24)',
                    boxShadow: allChecked
                      ? '0 0 8px rgba(0,255,135,0.4)'
                      : '0 0 8px rgba(245,158,11,0.3)',
                  }}
                />
              </div>
            </div>

            {/* Checklist items */}
            <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
              {CHECKLIST_ITEMS.map((item, i) => {
                const done = checked.has(i);
                return (
                  <motion.div
                    key={i}
                    onClick={() => toggle(i)}
                    whileHover={{ x: 2 }}
                    className="flex items-center gap-3 p-3 rounded-xl cursor-pointer group transition-all"
                    style={{
                      background: done
                        ? 'rgba(0,255,135,0.05)'
                        : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${done ? 'rgba(0,255,135,0.15)' : 'rgba(255,255,255,0.05)'}`,
                    }}
                  >
                    {/* Custom checkbox */}
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all"
                      style={{
                        background: done ? '#00ff87' : 'rgba(255,255,255,0.05)',
                        border: `1.5px solid ${done ? '#00ff87' : 'rgba(255,255,255,0.15)'}`,
                        boxShadow: done ? '0 0 8px rgba(0,255,135,0.4)' : 'none',
                      }}
                    >
                      <AnimatePresence>
                        {done && (
                          <motion.svg
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ type: 'spring', bounce: 0.5, duration: 0.3 }}
                            viewBox="0 0 10 8"
                            className="w-3 h-2.5"
                            fill="none"
                          >
                            <path
                              d="M1 4L3.5 6.5L9 1"
                              stroke="#070a10"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </motion.svg>
                        )}
                      </AnimatePresence>
                    </div>

                    <span
                      className="flex-1 text-xs leading-relaxed transition-colors"
                      style={{ color: done ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.4)' }}
                    >
                      {item}
                    </span>

                    <AnimatePresence>
                      {done && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                        >
                          <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: '#00ff87' }} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>

            {/* Status message */}
            <div className="px-4 pb-2">
              <AnimatePresence mode="wait">
                {allChecked ? (
                  <motion.div
                    key="ready"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
                    style={{ background: 'rgba(0,255,135,0.06)', border: '1px solid rgba(0,255,135,0.15)', color: '#00ff87' }}
                  >
                    <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                    <span style={{ fontFamily: "'DM Mono',monospace" }}>
                      All checks passed — you're ready to enter the trade.
                    </span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="warning"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
                    style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.12)', color: 'rgba(245,158,11,0.8)' }}
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>Complete all {CHECKLIST_ITEMS.length} items before entering. No exceptions.</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer actions */}
            <div
              className="flex gap-3 px-4 py-4"
              style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
            >
              <button
                onClick={handleClose}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.4)',
                  fontFamily: "'DM Mono',monospace",
                }}
              >
                Cancel
              </button>
              <motion.button
                whileHover={allChecked ? { scale: 1.01 } : {}}
                whileTap={allChecked ? { scale: 0.98 } : {}}
                onClick={handleConfirm}
                disabled={!allChecked}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
                style={{
                  background: allChecked
                    ? 'linear-gradient(135deg,#00ff87 0%,#00d4ff 100%)'
                    : 'rgba(255,255,255,0.05)',
                  color: allChecked ? '#070a10' : 'rgba(255,255,255,0.2)',
                  fontFamily: "'DM Mono',monospace",
                  boxShadow: allChecked ? '0 0 20px rgba(0,255,135,0.25)' : 'none',
                  cursor: allChecked ? 'pointer' : 'not-allowed',
                }}
              >
                {allChecked ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Confirm & Enter Trade
                  </>
                ) : (
                  `${CHECKLIST_ITEMS.length - checked.size} remaining`
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}