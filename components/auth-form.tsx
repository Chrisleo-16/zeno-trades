'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { authStore } from '@/lib/auth';
import { ArrowRight, Eye, EyeOff, Activity, TrendingUp, Award, BarChart2 } from 'lucide-react';

interface AuthFormProps {
  onSuccess: () => void;
}

// ── Candlestick canvas (right panel background) ───────────────────────────────

function CandlestickBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    type Candle = { x: number; open: number; close: number; high: number; low: number; bull: boolean };
    const candles: Candle[] = [];
    const COUNT = 55;
    let price = 0.5;

    for (let i = 0; i < COUNT; i++) {
      const change = (Math.random() - 0.47) * 0.05;
      const open   = price;
      price        = Math.max(0.12, Math.min(0.88, price + change));
      const close  = price;
      const wick   = Math.random() * 0.025;
      candles.push({
        x: i / COUNT, open, close,
        high: Math.max(open, close) + wick,
        low:  Math.min(open, close) - wick,
        bull: close >= open,
      });
    }

    let offset = 0;
    let raf: number;

    const draw = () => {
      if (!canvas || !ctx) return;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // Base — deep forest green gradient (matching Fillianta right panel)
      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, '#071a0f');
      bg.addColorStop(0.5, '#0a2416');
      bg.addColorStop(1, '#051209');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Grid
      ctx.strokeStyle = 'rgba(0,255,135,0.04)';
      ctx.lineWidth = 1;
      for (let y = 0; y < h; y += 64) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }
      for (let x = 0; x < w; x += 80) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }

      // Candles
      const gap     = w / COUNT;
      const candleW = gap * 0.45;

      candles.forEach((c) => {
        const cx  = ((c.x * w + offset) % (w + gap * 2)) - gap;
        const oY  = h - c.open  * h * 0.55 - h * 0.18;
        const cY  = h - c.close * h * 0.55 - h * 0.18;
        const hiY = h - c.high  * h * 0.55 - h * 0.18;
        const loY = h - c.low   * h * 0.55 - h * 0.18;
        const a   = 0.15 + Math.random() * 0.08;

        const color = c.bull ? `rgba(0,255,135,${a})` : `rgba(239,68,68,${a * 0.7})`;

        ctx.strokeStyle = color;
        ctx.lineWidth   = 1;
        ctx.beginPath(); ctx.moveTo(cx, hiY); ctx.lineTo(cx, loY); ctx.stroke();

        ctx.fillStyle = color;
        const top   = Math.min(oY, cY);
        const bodyH = Math.max(Math.abs(oY - cY), 2);
        ctx.fillRect(cx - candleW / 2, top, candleW, bodyH);
      });

      // Radial glows
      const g1 = ctx.createRadialGradient(w * 0.2, h * 0.3, 0, w * 0.2, h * 0.3, w * 0.5);
      g1.addColorStop(0, 'rgba(0,200,100,0.1)');
      g1.addColorStop(1, 'transparent');
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, w, h);

      const g2 = ctx.createRadialGradient(w * 0.8, h * 0.7, 0, w * 0.8, h * 0.7, w * 0.4);
      g2.addColorStop(0, 'rgba(0,100,60,0.15)');
      g2.addColorStop(1, 'transparent');
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, w, h);

      offset += 0.28;
      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
  );
}

// ── Ticker tape ───────────────────────────────────────────────────────────────

const TICKERS = [
  { pair: 'EUR/USD', val: '1.0842', chg: '+0.12%', bull: true },
  { pair: 'GBP/USD', val: '1.2634', chg: '-0.08%', bull: false },
  { pair: 'USD/JPY', val: '149.82', chg: '+0.31%', bull: true },
  { pair: 'BTC/USD', val: '67,420', chg: '+1.24%', bull: true },
  { pair: 'XAU/USD', val: '2,341',  chg: '-0.19%', bull: false },
  { pair: 'USD/CAD', val: '1.3621', chg: '+0.07%', bull: true },
  { pair: 'AUD/USD', val: '0.6548', chg: '-0.14%', bull: false },
  { pair: 'NAS100',  val: '18,204', chg: '+0.52%', bull: true },
];

function TickerTape() {
  return (
    <div className="absolute bottom-0 left-0 right-0 overflow-hidden"
      style={{ height: 32, background: 'rgba(5,14,8,0.8)', borderTop: '1px solid rgba(0,255,135,0.08)', zIndex: 10 }}>
      <motion.div className="flex items-center gap-8 h-full whitespace-nowrap"
        style={{ width: 'max-content', paddingLeft: '100%' }}
        animate={{ x: '-50%' }}
        transition={{ duration: 28, repeat: Infinity, ease: 'linear', repeatType: 'loop' }}>
        {[...TICKERS, ...TICKERS, ...TICKERS].map((t, i) => (
          <div key={i} className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: "'DM Mono',monospace" }}>{t.pair}</span>
            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: "'DM Mono',monospace" }}>{t.val}</span>
            <span className="text-[10px] font-bold" style={{ color: t.bull ? '#00ff87' : '#ef4444', fontFamily: "'DM Mono',monospace" }}>{t.chg}</span>
            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.1)' }}>·</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// ── Stat card (right panel) ───────────────────────────────────────────────────

function StatCard({ label, value, sub, color, delay }: { label: string; value: string; sub: string; color: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl p-4"
      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}
    >
      <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: "'DM Mono',monospace" }}>{label}</p>
      <p className="text-2xl font-black" style={{ color, fontFamily: "'DM Mono',monospace", letterSpacing: '-0.03em', lineHeight: 1.1 }}>{value}</p>
      <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{sub}</p>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AuthForm({ onSuccess }: AuthFormProps) {
  const [isLogin, setIsLogin]           = useState(true);
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [name, setName]                 = useState('');
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused]           = useState<string | null>(null);
  const [success, setSuccess]           = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        authStore.login(email, password);
      } else {
        authStore.register(email, password, name);
      }
      setSuccess(true);
      setTimeout(onSuccess, 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
      setLoading(false);
    }
  };

  // Shared field style
  const fieldWrap = (id: string): React.CSSProperties => ({
    position: 'relative',
    borderBottom: `1.5px solid ${focused === id ? '#1a7a4a' : '#e2e8f0'}`,
    paddingBottom: 4,
    transition: 'border-color 0.2s',
  });

  const fieldLabel: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 600,
    color: '#94a3b8', marginBottom: 6, letterSpacing: '0.05em',
    textTransform: 'uppercase', fontFamily: "'DM Mono',monospace",
  };

  const fieldInput: React.CSSProperties = {
    width: '100%', background: 'transparent', border: 'none', outline: 'none',
    fontSize: 15, color: '#0f172a', fontFamily: "'DM Mono',monospace",
    padding: '2px 0 4px',
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#f8fafc' }}>

      {/* ════════════════════════════════════════
          LEFT — Form panel (light)
      ════════════════════════════════════════ */}
      <div className="flex flex-col w-full lg:w-[45%] relative bg-white"
        style={{ minHeight: '100vh', boxShadow: '4px 0 40px rgba(0,0,0,0.06)' }}>

        {/* Top left logo */}
        <div className="px-10 pt-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#0a3d20,#1a7a4a)', boxShadow: '0 4px 16px rgba(10,61,32,0.3)' }}>
            <Activity className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-black text-slate-800 text-lg tracking-tight" style={{ fontFamily: "'DM Mono',monospace", letterSpacing: '-0.03em' }}>
            ZENO
          </span>
        </div>

        {/* Form area — vertically centred */}
        <div className="flex-1 flex flex-col justify-center px-10 lg:px-14 pb-16">
          <div style={{ maxWidth: 380 }}>

            {/* Heading */}
            <AnimatePresence mode="wait">
              <motion.div
                key={isLogin ? 'h-login' : 'h-signup'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                style={{ marginBottom: 36 }}
              >
                <h1 style={{
                  fontSize: 30, fontWeight: 800, color: '#0f172a', lineHeight: 1.2,
                  letterSpacing: '-0.03em', marginBottom: 8, fontFamily: "'DM Mono',monospace",
                }}>
                  {isLogin ? 'Welcome back.' : 'Get started.'}
                </h1>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
                  {isLogin
                    ? 'Sign in to your trading dashboard and pick up where you left off.'
                    : 'Create your account and start trading with discipline and precision.'}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

                {/* Name — signup only */}
                <AnimatePresence>
                  {!isLogin && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={fieldWrap('name')}>
                        <label style={fieldLabel}>Full Name</label>
                        <input
                          type="text" value={name} required={!isLogin}
                          placeholder="John Doe"
                          onChange={e => setName(e.target.value)}
                          onFocus={() => setFocused('name')}
                          onBlur={() => setFocused(null)}
                          style={{ ...fieldInput, caretColor: '#1a7a4a' }}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Email */}
                <div style={fieldWrap('email')}>
                  <label style={fieldLabel}>Email</label>
                  <input
                    type="email" value={email} required
                    placeholder="you@example.com"
                    onChange={e => setEmail(e.target.value)}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused(null)}
                    style={{ ...fieldInput, caretColor: '#1a7a4a' }}
                  />
                </div>

                {/* Password */}
                <div style={fieldWrap('password')}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label style={{ ...fieldLabel, marginBottom: 0 }}>Password</label>
                    {isLogin && (
                      <button type="button" style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: 12, color: '#1a7a4a', fontWeight: 600,
                        fontFamily: "'DM Mono',monospace",
                      }}>
                        Forgot?
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password} required
                      placeholder="••••••••"
                      onChange={e => setPassword(e.target.value)}
                      onFocus={() => setFocused('password')}
                      onBlur={() => setFocused(null)}
                      style={{ ...fieldInput, flex: 1, caretColor: '#1a7a4a' }}
                    />
                    <button type="button" onClick={() => setShowPassword(v => !v)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0 2px', display: 'flex' }}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{ marginTop: 16, padding: '10px 14px', borderRadius: 10,
                      background: '#fef2f2', border: '1px solid #fecaca',
                      color: '#ef4444', fontSize: 12, fontFamily: "'DM Mono',monospace" }}>
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={loading || success}
                whileHover={!loading && !success ? { scale: 1.01, y: -1 } : {}}
                whileTap={!loading && !success ? { scale: 0.99 } : {}}
                style={{
                  marginTop: 32, width: '100%', height: 52, borderRadius: 12,
                  border: 'none', cursor: loading || success ? 'not-allowed' : 'pointer',
                  background: success ? '#16a34a'
                    : loading ? 'rgba(10,61,32,0.4)'
                    : 'linear-gradient(135deg,#0a3d20 0%,#1a7a4a 100%)',
                  color: '#fff', fontWeight: 800, fontSize: 14,
                  fontFamily: "'DM Mono',monospace", letterSpacing: '0.03em',
                  boxShadow: !loading && !success ? '0 4px 20px rgba(10,61,32,0.35), 0 1px 0 rgba(255,255,255,0.1) inset' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  position: 'relative', overflow: 'hidden',
                  transition: 'background 0.3s, box-shadow 0.3s',
                }}
              >
                {/* Shimmer */}
                {!loading && !success && (
                  <motion.div style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    background: 'linear-gradient(110deg,transparent 35%,rgba(255,255,255,0.12) 50%,transparent 65%)',
                  }}
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 3, repeat: Infinity, repeatDelay: 2.5, ease: 'easeInOut' }} />
                )}

                {success ? (
                  <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>✓</span> Entering dashboard…
                  </motion.span>
                ) : loading ? (
                  <motion.div animate={{ rotate: 360 }}
                    transition={{ duration: 0.75, repeat: Infinity, ease: 'linear' }}
                    style={{ width: 18, height: 18, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.25)', borderTopColor: '#fff' }} />
                ) : (
                  <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {isLogin ? 'Sign In' : 'Create Account'}
                    <ArrowRight size={15} />
                  </span>
                )}
              </motion.button>
            </form>

            {/* Switch */}
            <p style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: '#64748b' }}>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button onClick={() => { setIsLogin(!isLogin); setError(''); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer',
                  fontWeight: 700, color: '#0a3d20', fontSize: 13,
                  fontFamily: "'DM Mono',monospace" }}>
                {isLogin ? 'Sign up' : 'Log in'}
              </button>
            </p>
          </div>
        </div>

        {/* Bottom left security note */}
        <div className="px-10 pb-8 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#1a7a4a' }} />
          <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: "'DM Mono',monospace" }}>
            256-bit encryption · Your data is private
          </span>
        </div>
      </div>

      {/* ════════════════════════════════════════
          RIGHT — Dark branded panel
      ════════════════════════════════════════ */}
      <div className="hidden lg:flex lg:flex-col lg:flex-1 relative overflow-hidden">

        {/* Candlestick canvas fills the panel */}
        <CandlestickBackground />

        {/* Content layer */}
        <div className="relative z-10 flex flex-col h-full p-12 pb-10">

          {/* Top right live badge */}
          <div className="flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(0,255,135,0.1)', border: '1px solid rgba(0,255,135,0.2)' }}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#00ff87' }} />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: '#00ff87' }} />
              </span>
              <span className="text-[10px] font-bold tracking-widest" style={{ color: '#00ff87', fontFamily: "'DM Mono',monospace" }}>
                MARKETS LIVE
              </span>
            </motion.div>
          </div>

          {/* Centre headline — Fillianta style big italic */}
          <div className="flex-1 flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="text-sm mb-4 font-medium" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: "'DM Mono',monospace", letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Professional Trading
              </p>
              <h2 style={{
                fontSize: 56, fontWeight: 900, lineHeight: 1.05,
                letterSpacing: '-0.04em', marginBottom: 24, fontFamily: "'DM Mono',monospace",
              }}>
                <span style={{ color: '#ffffff' }}>Trade with</span>
                <br />
                <span style={{
                  background: 'linear-gradient(90deg,#00ff87,#00d4ff)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                  Precision.
                </span>
              </h2>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, maxWidth: 340 }}>
                The discipline-first journal that enforces your system, tracks your psychology, and surfaces your edge.
              </p>
            </motion.div>
          </div>

          {/* Stat cards row — like Fillianta's cards */}
          <div className="grid grid-cols-3 gap-3 mb-10">
            <StatCard label="Win Rate"    value="+64.2%" sub="Last 30 days"    color="#00ff87" delay={0.5} />
            <StatCard label="Discipline"  value="94/100" sub="Consistency score" color="#60a5fa" delay={0.6} />
            <StatCard label="Avg P&L"     value="+$340"  sub="Per trade"        color="#f59e0b" delay={0.7} />
          </div>
        </div>

        {/* Ticker tape at bottom of right panel */}
        <TickerTape />
      </div>

    </div>
  );
}