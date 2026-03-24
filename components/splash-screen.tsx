'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(onComplete, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 bg-[#0B0E14] flex flex-col items-center justify-center z-50 overflow-hidden px-4">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-emerald-500/10 rounded-full blur-[80px] sm:blur-[120px] pointer-events-none" />

      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-md">

        {/* Logo / Candlestick Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="w-16 h-16 sm:w-20 sm:h-20 mb-8 rounded-2xl bg-slate-900/50 border border-slate-800 flex items-center justify-center backdrop-blur-xl shadow-2xl shadow-emerald-500/10"
        >
          <svg
            className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 21h18M3 14l6-6 4 4 8-8M21 4v6M21 4h-6"
            />
          </svg>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.7, ease: 'easeOut' }}
          className="text-3xl sm:text-4xl font-semibold text-slate-50 tracking-tight mb-3 text-center"
        >
          Zeno Trading
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.7, ease: 'easeOut' }}
          className="text-slate-400 text-sm sm:text-base font-medium tracking-wide text-center"
        >
          Control your emotions, follow the system.
        </motion.p>

        {/* Progress Bar Container */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="w-48 sm:w-64 h-1 bg-slate-800 rounded-full mt-10 sm:mt-12 overflow-hidden"
        >
          <motion.div
            className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            // We set duration slightly shorter than the timeout so it finishes before unmount
            transition={{ duration: 2.8, ease: 'easeInOut' }}
          />
        </motion.div>

        {/* Footer Status */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-6 text-[10px] sm:text-xs text-slate-500 uppercase tracking-widest font-semibold text-center"
        >
          Initializing System...
        </motion.div>

      </div>
    </div>
  );
}