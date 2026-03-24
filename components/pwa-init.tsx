'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { registerServiceWorker, skipWaiting, onOnline, onOffline } from '@/lib/pwa';
import { RefreshCw, WifiOff } from 'lucide-react';

export default function PWAInit() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [offline, setOffline]                 = useState(false);

  useEffect(() => {
    // Register the service worker
    registerServiceWorker();

    // Listen for SW update event (fired from pwa.ts)
    const onUpdate = () => setUpdateAvailable(true);
    window.addEventListener('apex:sw-update-available', onUpdate);

    // Online / offline indicators
    const cleanOnline  = onOnline(()  => setOffline(false));
    const cleanOffline = onOffline(() => setOffline(true));
    setOffline(!navigator.onLine);

    return () => {
      window.removeEventListener('apex:sw-update-available', onUpdate);
      cleanOnline();
      cleanOffline();
    };
  }, []);

  return (
    <>
      {/* Update banner */}
      <AnimatePresence>
        {updateAvailable && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            className="fixed top-4 left-1/2 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{
              transform: 'translateX(-50%)',
              background: 'rgba(0,255,135,0.08)',
              border: '1px solid rgba(0,255,135,0.25)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
            }}
          >
            <RefreshCw className="w-4 h-4 shrink-0" style={{ color: '#00ff87' }} />
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.7)', fontFamily: "'DM Mono',monospace" }}>
              New version available
            </span>
            <button
              onClick={() => { skipWaiting(); setUpdateAvailable(false); }}
              className="text-xs font-bold px-3 py-1.5 rounded-lg"
              style={{ background: 'linear-gradient(135deg,#00ff87,#00d4ff)', color: '#070a10', border: 'none', cursor: 'pointer', fontFamily: "'DM Mono',monospace" }}
            >
              Update now
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Offline banner */}
      <AnimatePresence>
        {offline && (
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            className="fixed bottom-20 md:bottom-4 left-1/2 z-[100] flex items-center gap-2 px-4 py-2.5 rounded-xl"
            style={{
              transform: 'translateX(-50%)',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.25)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <WifiOff className="w-4 h-4 shrink-0 text-red-400" />
            <span className="text-xs font-semibold text-red-400" style={{ fontFamily: "'DM Mono',monospace" }}>
              You're offline — trades won't sync
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}