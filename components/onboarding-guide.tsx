'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, CheckCircle2, ArrowRight, ArrowLeft,
  BookOpen, Brain, BarChart3, X,
} from 'lucide-react';

interface OnboardingGuideProps {
  isOpen: boolean;
  onComplete: () => void;
}

const STEPS = [
  {
    title: 'Welcome to Zeno Trading',
    sub: 'The most disciplined trading system on the planet.',
    icon: Zap,
    iconColor: '#00ff87',
    iconBg: 'rgba(0,255,135,0.1)',
    iconBorder: 'rgba(0,255,135,0.2)',
    content:
      "This isn't just a trading journal. It's a complete system designed to eliminate emotional trading and enforce discipline through data.",
    extra: [
      '✓ Enforce trading discipline every entry',
      '✓ AI-powered strategy selection',
      '✓ Psychology of successful trading',
      '✓ Advanced analytics & insights',
    ],
  },
  {
    title: 'Log Trades with Discipline',
    sub: 'Pre-trade checklist protects your account.',
    icon: CheckCircle2,
    iconColor: '#00ff87',
    iconBg: 'rgba(0,255,135,0.1)',
    iconBorder: 'rgba(0,255,135,0.2)',
    content:
      'Every trade requires completing a 10-item discipline checklist. No exceptions. This single feature has saved traders more money than any indicator.',
    warning: "The pre-trade checklist is NOT optional. It's designed to stop you from trading emotionally. Answer YES to every item.",
  },
  {
    title: 'AI Strategy Recommendations',
    sub: 'Based on your unique trading profile.',
    icon: Brain,
    iconColor: '#a78bfa',
    iconBg: 'rgba(167,139,250,0.1)',
    iconBorder: 'rgba(167,139,250,0.2)',
    content:
      "Click \"Get AI Recommendations\" to receive 3 personalized strategies. Each includes a confidence score, reasoning, and specific entry/exit rules.",
    tip: 'Instead of asking 20 questions, the AI analyzes your profile and surfaces your top 3 strategies. Choose one and execute.',
  },
  {
    title: 'Learn the Right Way',
    sub: 'Interactive guides, case studies, psychology.',
    icon: BookOpen,
    iconColor: '#60a5fa',
    iconBg: 'rgba(96,165,250,0.1)',
    iconBorder: 'rgba(96,165,250,0.2)',
    content:
      'Study real trades — wins and losses — and understand the psychology behind each decision. Not videos. Real, actionable knowledge built for execution.',
  },
  {
    title: 'Track Your Progress',
    sub: 'Advanced analytics show exactly what is working.',
    icon: BarChart3,
    iconColor: '#f59e0b',
    iconBg: 'rgba(245,158,11,0.1)',
    iconBorder: 'rgba(245,158,11,0.2)',
    content:
      'See your equity curve, win rate, discipline score, and emotional trading patterns over time. The data never lies — let it guide your decisions.',
    metrics: ['Win Rate', 'Total P&L', 'Discipline Score', 'Emotion Map'],
  },
];

export function OnboardingGuide({ isOpen, onComplete }: OnboardingGuideProps) {
  const [step, setStep] = useState(0);

  const current = STEPS[step];
  const Icon = current.icon;
  const progress = ((step + 1) / STEPS.length) * 100;
  const isLast = step === STEPS.length - 1;

  const next = () => (isLast ? onComplete() : setStep((s) => s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg rounded-2xl overflow-hidden"
            style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(0,255,135,0.1)', border: '1px solid rgba(0,255,135,0.2)' }}
                >
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <span
                  className="text-white/60 text-sm font-semibold"
                  style={{ fontFamily: "'DM Mono',monospace" }}
                >
                  Getting Started
                </span>
              </div>
              <button
                onClick={onComplete}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4 text-white/25" />
              </button>
            </div>

            {/* Step content */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5"
                >
                  {/* Icon */}
                  <div className="flex justify-center">
                    <motion.div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{
                        background: current.iconBg,
                        border: `1px solid ${current.iconBorder}`,
                        boxShadow: `0 0 30px ${current.iconBg}`,
                      }}
                      animate={{ scale: [1, 1.06, 1] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <Icon className="w-7 h-7" style={{ color: current.iconColor }} />
                    </motion.div>
                  </div>

                  {/* Title */}
                  <div className="text-center">
                    <h2
                      className="text-xl font-bold text-white mb-1"
                      style={{ fontFamily: "'DM Mono',monospace", letterSpacing: '-0.02em' }}
                    >
                      {current.title}
                    </h2>
                    <p style={{ color: current.iconColor }} className="text-sm font-medium">
                      {current.sub}
                    </p>
                  </div>

                  {/* Content */}
                  <div
                    className="p-4 rounded-xl text-sm text-white/50 leading-relaxed"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    {current.content}
                  </div>

                  {/* Extra bullets (step 0) */}
                  {current.extra && (
                    <div className="space-y-2">
                      {current.extra.map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div
                            className="w-1 h-1 rounded-full flex-shrink-0"
                            style={{ background: '#00ff87' }}
                          />
                          <span className="text-xs text-white/40">{item}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Warning (step 1) */}
                  {current.warning && (
                    <div
                      className="p-3 rounded-xl text-xs leading-relaxed"
                      style={{
                        background: 'rgba(239,68,68,0.06)',
                        border: '1px solid rgba(239,68,68,0.15)',
                        color: '#ef4444',
                      }}
                    >
                      <span className="font-bold" style={{ fontFamily: "'DM Mono',monospace" }}>
                        NOT OPTIONAL:{' '}
                      </span>
                      {current.warning}
                    </div>
                  )}

                  {/* Tip (step 2) */}
                  {current.tip && (
                    <div
                      className="p-3 rounded-xl text-xs leading-relaxed"
                      style={{
                        background: 'rgba(167,139,250,0.06)',
                        border: '1px solid rgba(167,139,250,0.15)',
                        color: 'rgba(167,139,250,0.8)',
                      }}
                    >
                      {current.tip}
                    </div>
                  )}

                  {/* Metrics grid (step 4) */}
                  {current.metrics && (
                    <div className="grid grid-cols-2 gap-2">
                      {current.metrics.map((m) => (
                        <div
                          key={m}
                          className="p-2.5 rounded-xl text-center text-xs font-semibold"
                          style={{
                            background: 'rgba(245,158,11,0.06)',
                            border: '1px solid rgba(245,158,11,0.12)',
                            color: 'rgba(245,158,11,0.8)',
                            fontFamily: "'DM Mono',monospace",
                          }}
                        >
                          {m}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Progress + nav */}
            <div
              className="px-5 pb-5 space-y-4"
              style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}
            >
              {/* Progress */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex gap-1">
                    {STEPS.map((_, i) => (
                      <div
                        key={i}
                        className="rounded-full transition-all"
                        style={{
                          width: i === step ? 20 : 6,
                          height: 6,
                          background:
                            i === step
                              ? '#00ff87'
                              : i < step
                              ? 'rgba(0,255,135,0.4)'
                              : 'rgba(255,255,255,0.1)',
                        }}
                      />
                    ))}
                  </div>
                  <span
                    className="text-[10px]"
                    style={{ color: 'rgba(255,255,255,0.2)', fontFamily: "'DM Mono',monospace" }}
                  >
                    {step + 1} / {STEPS.length}
                  </span>
                </div>
                <div
                  className="w-full h-1 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.4 }}
                    style={{
                      background: 'linear-gradient(90deg,#00ff87,#00d4ff)',
                      boxShadow: '0 0 8px rgba(0,255,135,0.4)',
                    }}
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={back}
                  disabled={step === 0}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: step === 0 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.4)',
                    fontFamily: "'DM Mono',monospace",
                    cursor: step === 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={next}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold"
                  style={{
                    background: 'linear-gradient(135deg,#00ff87 0%,#00d4ff 100%)',
                    color: '#070a10',
                    fontFamily: "'DM Mono',monospace",
                    boxShadow: '0 0 20px rgba(0,255,135,0.25)',
                  }}
                >
                  {isLast ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Start Trading
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}