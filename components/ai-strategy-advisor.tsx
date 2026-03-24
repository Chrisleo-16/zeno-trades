'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, CheckCircle2, AlertCircle, TrendingUp, ChevronDown, ChevronUp,
} from 'lucide-react';

export interface RecommendedStrategy {
  id: string;
  name: string;
  description: string;
  confidence: number;
  reasoning: string[];
  rules: string[];
  riskLevel: 'low' | 'medium' | 'high';
  suggestedFor: string;
}

interface AIStrategyAdvisorProps {
  strategies: RecommendedStrategy[];
  onSelect: (strategy: RecommendedStrategy) => void;
  isLoading?: boolean;
}

const RISK_CONFIG = {
  low:    { label: 'LOW RISK',  color: '#00ff87', bg: 'rgba(0,255,135,0.08)',  border: 'rgba(0,255,135,0.2)' },
  medium: { label: 'MED RISK',  color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
  high:   { label: 'HIGH RISK', color: '#ef4444', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.2)' },
};

export function AIStrategyAdvisor({
  strategies,
  onSelect,
  isLoading = false,
}: AIStrategyAdvisorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <motion.div
        className="py-12 flex flex-col items-center gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Sparkles className="w-6 h-6 text-emerald-400" />
        </motion.div>
        <p
          className="text-white/40 text-sm"
          style={{ fontFamily: "'DM Mono',monospace" }}
        >
          Analyzing your trading profile…
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {strategies.map((strategy, index) => {
          const risk = RISK_CONFIG[strategy.riskLevel];
          const isSelected = selectedId === strategy.id;
          const isExpanded = expandedId === strategy.id;
          const matchPct = Math.round(strategy.confidence * 100);

          return (
            <motion.div
              key={strategy.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ delay: index * 0.08 }}
              className="rounded-2xl overflow-hidden cursor-pointer"
              style={{
                background: isSelected
                  ? 'linear-gradient(135deg,rgba(0,255,135,0.08) 0%,rgba(0,212,255,0.04) 100%)'
                  : 'linear-gradient(135deg,rgba(255,255,255,0.03) 0%,rgba(255,255,255,0.01) 100%)',
                border: `1px solid ${isSelected ? 'rgba(0,255,135,0.2)' : 'rgba(255,255,255,0.06)'}`,
                transition: 'all 0.2s',
              }}
              onClick={() => setSelectedId(strategy.id)}
            >
              {/* ── Card header ── */}
              <div className="p-4">
                <div className="flex items-start gap-3">
                  {/* Match ring */}
                  <div className="flex-shrink-0 flex flex-col items-center gap-1">
                    <div
                      className="w-12 h-12 rounded-xl flex flex-col items-center justify-center"
                      style={{
                        background: isSelected ? 'rgba(0,255,135,0.1)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${isSelected ? 'rgba(0,255,135,0.25)' : 'rgba(255,255,255,0.08)'}`,
                      }}
                    >
                      <span
                        className="text-base font-bold leading-none"
                        style={{ color: '#00ff87', fontFamily: "'DM Mono',monospace" }}
                      >
                        {matchPct}%
                      </span>
                      <span
                        className="text-[8px]"
                        style={{ color: 'rgba(255,255,255,0.25)', fontFamily: "'DM Mono',monospace" }}
                      >
                        MATCH
                      </span>
                    </div>
                  </div>

                  {/* Title & desc */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span
                        className="text-sm font-bold text-white/80"
                        style={{ fontFamily: "'DM Mono',monospace" }}
                      >
                        {strategy.name}
                      </span>
                      <span
                        className="text-[9px] px-2 py-0.5 rounded font-bold"
                        style={{
                          background: risk.bg,
                          color: risk.color,
                          border: `1px solid ${risk.border}`,
                          fontFamily: "'DM Mono',monospace",
                        }}
                      >
                        {risk.label}
                      </span>
                    </div>
                    <p className="text-white/35 text-xs leading-relaxed">
                      {strategy.description}
                    </p>
                  </div>

                  {/* Expand toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedId(isExpanded ? null : strategy.id);
                    }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 hover:bg-white/5 transition-colors"
                    style={{ color: 'rgba(255,255,255,0.3)' }}
                  >
                    {isExpanded
                      ? <ChevronUp className="w-4 h-4" />
                      : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {/* Confidence bar */}
                <div className="mt-3">
                  <div
                    className="w-full h-1 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${matchPct}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: index * 0.08 + 0.2 }}
                      style={{
                        background: 'linear-gradient(90deg,#00ff87,#00d4ff)',
                        boxShadow: '0 0 8px rgba(0,255,135,0.4)',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* ── Expanded details ── */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    style={{ borderTop: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}
                  >
                    <div className="p-4 space-y-4">
                      {/* Why this strategy */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                          <span
                            className="text-[10px] uppercase tracking-widest font-semibold"
                            style={{ color: '#00ff87', fontFamily: "'DM Mono',monospace" }}
                          >
                            Why this strategy?
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {strategy.reasoning.map((reason, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <CheckCircle2
                                className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"
                                style={{ color: 'rgba(0,255,135,0.5)' }}
                              />
                              <span className="text-xs text-white/45 leading-relaxed">
                                {reason}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Key rules */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                          <span
                            className="text-[10px] uppercase tracking-widest font-semibold"
                            style={{ color: '#f59e0b', fontFamily: "'DM Mono',monospace" }}
                          >
                            Key Rules
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {strategy.rules.map((rule, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <span
                                className="text-[10px] font-bold w-4 flex-shrink-0 mt-0.5"
                                style={{ color: '#f59e0b', fontFamily: "'DM Mono',monospace" }}
                              >
                                {i + 1}.
                              </span>
                              <span className="text-xs text-white/45 leading-relaxed">{rule}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recommended for */}
                      <div
                        className="p-3 rounded-xl"
                        style={{
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        <p
                          className="text-[9px] uppercase tracking-widest mb-1"
                          style={{ color: 'rgba(255,255,255,0.25)', fontFamily: "'DM Mono',monospace" }}
                        >
                          Recommended for
                        </p>
                        <p className="text-xs text-white/50">{strategy.suggestedFor}</p>
                      </div>

                      {/* Use this strategy button */}
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(strategy);
                        }}
                        className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                        style={{
                          background: 'linear-gradient(135deg,#00ff87 0%,#00d4ff 100%)',
                          color: '#070a10',
                          fontFamily: "'DM Mono',monospace",
                          boxShadow: '0 0 20px rgba(0,255,135,0.2)',
                        }}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Use This Strategy
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Expand hint when collapsed */}
              {!isExpanded && (
                <button
                  className="w-full py-2 text-center text-xs transition-colors"
                  style={{
                    borderTop: '1px solid rgba(255,255,255,0.04)',
                    color: 'rgba(255,255,255,0.2)',
                    fontFamily: "'DM Mono',monospace",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedId(strategy.id);
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#00ff87')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.2)')}
                >
                  View Details
                </button>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}