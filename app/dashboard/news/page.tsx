'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, RefreshCw, X, TrendingUp, TrendingDown, Minus, AlertTriangle, ShieldCheck, Info, Zap } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Impact = 'high' | 'medium' | 'low';

type CalendarEvent = {
  id:        string;
  time:      string;         // HH:MM UTC
  country:   string;
  flag:      string;
  currency:  string;
  event:     string;
  impact:    Impact;
  actual:    string | null;
  forecast:  string | null;
  previous:  string | null;
  surprise:  'beat' | 'miss' | 'inline' | 'pending';
  surprisePct: number | null;
  // AI-generated fields
  laymansTitle: string;
  pairsToAvoid: string[];
  pairsOk:      string[];
  marketBias:   'bullish' | 'bearish' | 'neutral' | 'volatile';
  explanation:  string;
  whatHappened: string | null;  // only when actual is known
};

type RawEvent = {
  time?: string;
  country?: string;
  event?: string;
  impact?: number;
  actual?: string;
  estimate?: string;
  prev?: string;
  unit?: string;
};

// ─── Country → currency + flag ────────────────────────────────────────────────

const COUNTRY_MAP: Record<string, { currency: string; flag: string }> = {
  'United States':  { currency: 'USD', flag: '🇺🇸' },
  'Euro Zone':      { currency: 'EUR', flag: '🇪🇺' },
  'United Kingdom': { currency: 'GBP', flag: '🇬🇧' },
  'Japan':          { currency: 'JPY', flag: '🇯🇵' },
  'Canada':         { currency: 'CAD', flag: '🇨🇦' },
  'Australia':      { currency: 'AUD', flag: '🇦🇺' },
  'New Zealand':    { currency: 'NZD', flag: '🇳🇿' },
  'Switzerland':    { currency: 'CHF', flag: '🇨🇭' },
  'China':          { currency: 'CNH', flag: '🇨🇳' },
  'Germany':        { currency: 'EUR', flag: '🇩🇪' },
  'France':         { currency: 'EUR', flag: '🇫🇷' },
};

// ─── Event knowledge base ─────────────────────────────────────────────────────
// Each entry defines: what it is in plain English, which pairs are affected,
// how to read the surprise, and what market bias each outcome creates

type EventKnowledge = {
  laymans:     string;
  affects:     string[];
  beatBias:    'bullish' | 'bearish';
  missBias:    'bullish' | 'bearish';
  explanation: string;
};
// ─── Add these new types at the top with your other types ───
type MarketSummary = {
  symbol: string;
  change: number;
  changePct: number;
  latestPrice: string;
  prevClose: string;
  status: 'open' | 'closed' | 'premarket' | 'afterhours';
};

// ─── Add this hook right before your main component ───
function useMarketSummary() {
  const [summary, setSummary] = useState<MarketSummary | null>(null);
  const [marketLoading, setMarketLoading] = useState(true);
  const [marketMock, setMarketMock] = useState(false);

  useEffect(() => {
    fetch('/api/market/daily?symbol=SPY')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data?.['Time Series (Daily)']) {
          const series = data.data['Time Series (Daily)'];
          const dates = Object.keys(series).sort().slice(0, 2);
          const latest = series[dates[0]];
          const prev = series[dates[1]];
          
          const latestClose = parseFloat(latest['4. close']);
          const prevClose = parseFloat(prev['4. close']);
          const change = latestClose - prevClose;
          const changePct = (change / prevClose) * 100;

          setSummary({
            symbol: 'SPY',
            latestPrice: latest['4. close'],
            prevClose: prev['4. close'],
            change: change,
            changePct: changePct,
            status: 'open'
          });
          setMarketMock(false);
        } else {
          // Mock fallback
          setSummary({
            symbol: 'SPY',
            latestPrice: '523.80',
            prevClose: '520.50',
            change: 3.30,
            changePct: 0.63,
            status: 'open'
          });
          setMarketMock(true);
        }
      })
      .catch(() => {
        setSummary({
          symbol: 'SPY',
          latestPrice: '523.80',
          prevClose: '520.50',
          change: 3.30,
          changePct: 0.63,
          status: 'open'
        });
        setMarketMock(true);
      })
      .finally(() => setMarketLoading(false));
  }, []);

  return { summary, marketLoading, marketMock };
}
 
const EVENT_KB: Record<string, EventKnowledge> = {
  'Non Farm Payrolls': {
    laymans: 'How many jobs America created last month',
    affects: ['EUR/USD','GBP/USD','USD/JPY','USD/CAD','AUD/USD','XAU/USD','NAS100','USD/CHF'],
    beatBias: 'bullish',
    missBias: 'bearish',
    explanation: 'NFP measures how many non-farm jobs were added in the US. More jobs = stronger economy = USD goes up. Fewer jobs = weaker economy = USD goes down. This is the single most volatile news event in forex — spreads widen massively 5 minutes before release and price can move 100+ pips in seconds.',
  },
  'CPI': {
    laymans: 'How much prices went up — the inflation number',
    affects: ['EUR/USD','GBP/USD','USD/JPY','USD/CAD','AUD/USD','XAU/USD'],
    beatBias: 'bullish',
    missBias: 'bearish',
    explanation: 'CPI (Consumer Price Index) measures inflation — how much prices rose for everyday goods. Higher than expected inflation = Fed may raise rates = USD strengthens. Lower than expected = Fed may cut rates = USD weakens. Gold often moves opposite to USD during CPI.',
  },
  'Core CPI': {
    laymans: 'Inflation without food and energy (the Fed\'s favourite measure)',
    affects: ['EUR/USD','GBP/USD','USD/JPY','XAU/USD'],
    beatBias: 'bullish',
    missBias: 'bearish',
    explanation: 'Core CPI strips out volatile food and energy prices to show underlying inflation. The Fed focuses more on Core CPI than headline CPI because it is more stable. A beat here has strong implications for future interest rate decisions.',
  },
  'FOMC': {
    laymans: 'The US Federal Reserve\'s interest rate decision',
    affects: ['EUR/USD','GBP/USD','USD/JPY','USD/CAD','AUD/USD','NZD/USD','XAU/USD','NAS100','USD/CHF'],
    beatBias: 'bullish',
    missBias: 'bearish',
    explanation: 'FOMC meetings decide US interest rates. Higher rates = more attractive to hold USD = USD strengthens. Rate cuts = USD weakens. The statement and press conference after the decision are often MORE important than the rate itself — watch for "hawkish" (rates going up) vs "dovish" (rates going down) language.',
  },
  'Interest Rate Decision': {
    laymans: 'Central bank decides if borrowing money costs more or less',
    affects: ['EUR/USD','GBP/USD','USD/JPY','AUD/USD','NZD/USD','USD/CAD'],
    beatBias: 'bullish',
    missBias: 'bearish',
    explanation: 'When a central bank raises interest rates, their currency strengthens because investors get better returns holding it. When they cut rates, the currency weakens. The surprise relative to forecast is what drives the move — if a hike is already priced in, the currency may not move much.',
  },
  'GDP': {
    laymans: 'How much the whole economy grew or shrank',
    affects: ['EUR/USD','GBP/USD','USD/JPY','AUD/USD'],
    beatBias: 'bullish',
    missBias: 'bearish',
    explanation: 'GDP (Gross Domestic Product) is the total value of everything a country produces. Stronger-than-expected growth = stronger currency. Negative GDP two quarters in a row = recession. This is a lagging indicator — it tells you what happened, not what will happen.',
  },
  'Unemployment Rate': {
    laymans: 'What percentage of people looking for work can\'t find it',
    affects: ['EUR/USD','GBP/USD','AUD/USD','USD/CAD'],
    beatBias: 'bearish',
    missBias: 'bullish',
    explanation: 'Unlike most economic data, a LOWER unemployment number is GOOD. So a "beat" here (lower than forecast) means fewer unemployed people = stronger economy = stronger currency. A higher-than-expected unemployment rate means economic weakness.',
  },
  'Retail Sales': {
    laymans: 'How much people spent shopping last month',
    affects: ['EUR/USD','GBP/USD','USD/JPY','AUD/USD','USD/CAD'],
    beatBias: 'bullish',
    missBias: 'bearish',
    explanation: 'Retail Sales measures consumer spending — about 70% of the US economy is consumer spending. Strong retail sales = consumers are confident and spending = economy growing = stronger currency. Weak sales = economic slowdown coming.',
  },
  'PMI': {
    laymans: 'Whether factory managers think business is getting better or worse',
    affects: ['EUR/USD','GBP/USD','AUD/USD','USD/JPY'],
    beatBias: 'bullish',
    missBias: 'bearish',
    explanation: 'PMI (Purchasing Managers Index) is a survey of factory/service managers. Above 50 = expansion (growing). Below 50 = contraction (shrinking). It is a LEADING indicator — it predicts future economic activity before it shows up in GDP or employment data.',
  },
  'PPI': {
    laymans: 'How much it costs factories to make things — early inflation warning',
    affects: ['EUR/USD','USD/JPY','XAU/USD'],
    beatBias: 'bullish',
    missBias: 'bearish',
    explanation: 'PPI (Producer Price Index) measures inflation at the factory level BEFORE it reaches consumers. It is an early warning signal for CPI — if factories are paying more, that cost eventually gets passed to consumers. A PPI beat often predicts a CPI beat 1-2 months later.',
  },
  'Trade Balance': {
    laymans: 'Whether a country sells more to the world than it buys',
    affects: ['EUR/USD','AUD/USD','USD/CAD','USD/JPY'],
    beatBias: 'bullish',
    missBias: 'bearish',
    explanation: 'Trade balance = exports minus imports. A surplus (more exports) generally strengthens a currency because foreigners need to buy your currency to pay for your goods. A deficit (more imports) can weaken it. Less impactful than CPI or NFP but can cause sharp moves if the surprise is large.',
  },
  'Consumer Confidence': {
    laymans: 'How optimistic everyday people feel about the economy',
    affects: ['EUR/USD','GBP/USD','AUD/USD'],
    beatBias: 'bullish',
    missBias: 'bearish',
    explanation: 'Consumer confidence surveys ask people how they feel about the economy now and in the future. High confidence = people will spend more = economic growth ahead. Low confidence = people are worried and will save instead of spend = economic slowdown incoming.',
  },
};

function getEventKnowledge(eventName: string): EventKnowledge | null {
  const key = Object.keys(EVENT_KB).find(k =>
    eventName.toLowerCase().includes(k.toLowerCase())
  );
  return key ? EVENT_KB[key] : null;
}

// ─── Surprise calculation ─────────────────────────────────────────────────────

function calcSurprise(actual: string | null, forecast: string | null): {
  surprise: CalendarEvent['surprise'];
  surprisePct: number | null;
} {
  if (!actual || actual === '') return { surprise: 'pending', surprisePct: null };
  if (!forecast || forecast === '') return { surprise: 'pending', surprisePct: null };

  const a = parseFloat(actual.replace(/[^0-9.-]/g, ''));
  const f = parseFloat(forecast.replace(/[^0-9.-]/g, ''));
  if (isNaN(a) || isNaN(f)) return { surprise: 'pending', surprisePct: null };

  const diff = a - f;
  const pct  = f !== 0 ? (diff / Math.abs(f)) * 100 : 0;

  if (Math.abs(pct) < 2) return { surprise: 'inline', surprisePct: pct };
  return { surprise: diff > 0 ? 'beat' : 'miss', surprisePct: pct };
}

// ─── Transform raw Finnhub event into enriched CalendarEvent ─────────────────

function enrichEvent(raw: RawEvent, index: number): CalendarEvent {
  const country    = raw.country ?? 'Unknown';
  const meta       = COUNTRY_MAP[country] ?? { currency: '???', flag: '🌐' };
  const kb         = getEventKnowledge(raw.event ?? '');
  const { surprise, surprisePct } = calcSurprise(raw.actual ?? null, raw.estimate ?? null);
  const impactMap: Record<number, Impact> = { 3: 'high', 2: 'medium', 1: 'low' };
  const impact: Impact = impactMap[raw.impact ?? 1] ?? 'low';

  // Determine market bias from surprise + event type
  let marketBias: CalendarEvent['marketBias'] = 'neutral';
  if (kb && surprise === 'beat') {
    // For unemployment, beat = LOWER = good for economy but confusingly named
    const isInverse = kb.beatBias === 'bearish';
    marketBias = isInverse ? 'bearish' : 'bullish';
  } else if (kb && surprise === 'miss') {
    marketBias = kb.missBias === 'bullish' ? 'bullish' : 'bearish';
  } else if (impact === 'high' && surprise === 'pending') {
    marketBias = 'volatile';
  }

  // Pairs to avoid vs safe
  const allMajors = ['EUR/USD','GBP/USD','USD/JPY','USD/CAD','AUD/USD','NZD/USD','USD/CHF','XAU/USD'];
  const pairsToAvoid = kb ? (impact === 'high' ? kb.affects : kb.affects.slice(0, 3)) : [];
  const pairsOk = allMajors.filter(p => !pairsToAvoid.includes(p));

  // What happened description (only when actual is known)
  let whatHappened: string | null = null;
  if (raw.actual && raw.estimate && surprise !== 'pending' && kb) {
    const a = raw.actual;
    const f = raw.estimate;
    const p = raw.prev ?? '—';
    if (surprise === 'beat') {
      whatHappened = `Actual came in at ${a}, beating the forecast of ${f} (previous: ${p}). This is ${marketBias === 'bullish' ? 'positive' : 'negative'} for ${meta.currency} — expect ${marketBias === 'bullish' ? 'upward' : 'downward'} pressure on ${meta.currency} pairs.`;
    } else if (surprise === 'miss') {
      whatHappened = `Actual came in at ${a}, missing the forecast of ${f} (previous: ${p}). This disappointed markets — expect ${marketBias === 'bullish' ? 'upward' : 'downward'} pressure on ${meta.currency}.`;
    } else {
      whatHappened = `Actual came in at ${a}, in line with the forecast of ${f}. No major surprise — minimal market impact expected.`;
    }
  }

  return {
    id:          `${raw.time}-${index}`,
    time:        raw.time ? raw.time.split('T')[1]?.slice(0, 5) ?? raw.time : '—',
    country,
    flag:        meta.flag,
    currency:    meta.currency,
    event:       raw.event ?? 'Unknown Event',
    impact,
    actual:      raw.actual ?? null,
    forecast:    raw.estimate ?? null,
    previous:    raw.prev ?? null,
    surprise,
    surprisePct,
    laymansTitle: kb?.laymans ?? raw.event ?? 'Economic data release',
    pairsToAvoid,
    pairsOk,
    marketBias,
    explanation:  kb?.explanation ?? 'This economic release can affect currency markets. Monitor price action around release time.',
    whatHappened,
  };
}

// ─── Style helpers ────────────────────────────────────────────────────────────

const IMPACT_CONFIG = {
  high:   { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',    border: 'rgba(239,68,68,0.2)',    dot: '#ef4444',  label: 'HIGH' },
  medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',   border: 'rgba(245,158,11,0.2)',   dot: '#f59e0b',  label: 'MED' },
  low:    { color: '#60a5fa', bg: 'rgba(96,165,250,0.06)',   border: 'rgba(96,165,250,0.12)',  dot: '#60a5fa',  label: 'LOW' },
};

const SURPRISE_CONFIG = {
  beat:    { color: '#00ff87', icon: TrendingUp,   label: 'BEAT' },
  miss:    { color: '#ef4444', icon: TrendingDown, label: 'MISS' },
  inline:  { color: '#f59e0b', icon: Minus,        label: 'INLINE' },
  pending: { color: 'rgba(255,255,255,0.2)', icon: Info, label: 'PENDING' },
};

const BIAS_CONFIG = {
  bullish:  { color: '#00ff87', bg: 'rgba(0,255,135,0.08)',  label: '↑ BULLISH' },
  bearish:  { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',  label: '↓ BEARISH' },
  neutral:  { color: '#60a5fa', bg: 'rgba(96,165,250,0.06)', label: '→ NEUTRAL' },
  volatile: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', label: '⚡ VOLATILE' },
};

// ─── Event detail drawer ──────────────────────────────────────────────────────

function EventDrawer({ event, onClose }: { event: CalendarEvent; onClose: () => void }) {
  const imp  = IMPACT_CONFIG[event.impact];
  const surp = SURPRISE_CONFIG[event.surprise];
  const bias = BIAS_CONFIG[event.marketBias];
  const SurpIcon = surp.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
        className="w-full sm:max-w-xl rounded-t-2xl sm:rounded-2xl overflow-hidden"
        style={{ background: '#0a0e18', border: '1px solid rgba(255,255,255,0.08)', maxHeight: '88vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="px-5 py-4 flex items-start justify-between gap-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span style={{ fontSize: 20 }}>{event.flag}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded"
                style={{ background: imp.bg, color: imp.color, border: `1px solid ${imp.border}`, fontFamily: "'DM Mono',monospace" }}>
                {imp.label} IMPACT
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded"
                style={{ background: bias.bg, color: bias.color, fontFamily: "'DM Mono',monospace" }}>
                {bias.label}
              </span>
            </div>
            <h2 className="text-white font-bold text-base leading-snug">{event.event}</h2>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {event.flag} {event.country} · {event.currency} · {event.time} UTC
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">

          {/* Plain English title */}
          <div className="rounded-xl p-4" style={{ background: 'rgba(0,255,135,0.04)', border: '1px solid rgba(0,255,135,0.1)' }}>
            <p className="text-[10px] uppercase tracking-widest mb-1.5" style={{ color: 'rgba(0,255,135,0.5)', fontFamily: "'DM Mono',monospace" }}>In plain English</p>
            <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>{event.laymansTitle}</p>
          </div>

          {/* Actual / Forecast / Previous */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Previous', value: event.previous, color: 'rgba(255,255,255,0.4)' },
              { label: 'Forecast', value: event.forecast, color: '#f59e0b' },
              { label: 'Actual',   value: event.actual,   color: event.surprise === 'beat' ? '#00ff87' : event.surprise === 'miss' ? '#ef4444' : 'rgba(255,255,255,0.7)' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl p-3 text-center"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-[9px] uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: "'DM Mono',monospace" }}>{label}</p>
                <p className="text-lg font-black" style={{ color, fontFamily: "'DM Mono',monospace", letterSpacing: '-0.02em' }}>
                  {value ?? '—'}
                </p>
              </div>
            ))}
          </div>

          {/* Surprise badge */}
          {event.surprise !== 'pending' && (
            <div className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: `${surp.color}10`, border: `1px solid ${surp.color}25` }}>
              <SurpIcon className="w-5 h-5 shrink-0" style={{ color: surp.color }} />
              <div>
                <p className="text-xs font-bold" style={{ color: surp.color, fontFamily: "'DM Mono',monospace" }}>
                  {surp.label} {event.surprisePct != null ? `${event.surprisePct > 0 ? '+' : ''}${event.surprisePct.toFixed(1)}%` : ''}
                </p>
                {event.whatHappened && (
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    {event.whatHappened}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* What this event actually means */}
          <div>
            <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: "'DM Mono',monospace" }}>
              What this event means
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {event.explanation}
            </p>
          </div>

          {/* Pairs to avoid */}
          {event.pairsToAvoid.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                <p className="text-[10px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: "'DM Mono',monospace" }}>
                  Avoid during release
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {event.pairsToAvoid.map(pair => (
                  <span key={pair} className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg"
                    style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', fontFamily: "'DM Mono',monospace" }}>
                    {pair}
                  </span>
                ))}
              </div>
              <p className="text-[11px] mt-2" style={{ color: 'rgba(255,255,255,0.25)' }}>
                These pairs will be most affected by this news — spreads widen, slippage increases.
              </p>
            </div>
          )}

          {/* Safer pairs */}
          {event.pairsOk.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <p className="text-[10px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: "'DM Mono',monospace" }}>
                  Relatively safer pairs
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {event.pairsOk.slice(0, 5).map(pair => (
                  <span key={pair} className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg"
                    style={{ background: 'rgba(0,255,135,0.06)', color: '#00ff87', border: '1px solid rgba(0,255,135,0.15)', fontFamily: "'DM Mono',monospace" }}>
                    {pair}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* System reminder */}
          <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="text-[10px] uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: "'DM Mono',monospace" }}>
              Your system reminder
            </p>
            <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)' }}>
              You trade Supply & Demand + FVG + FRVP. This is a technical system — you use fundamental news to know <strong style={{ color: 'rgba(255,255,255,0.6)' }}>when to stay out</strong>, not when to enter. Close all trades 10 minutes before high-impact news and don't re-enter until price stabilises after the release.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function NewsPage() {
  const [events, setEvents]         = useState<CalendarEvent[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [isMock, setIsMock]         = useState(false);
  const [mockReason, setMockReason] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selected, setSelected]     = useState<CalendarEvent | null>(null);
  const [filter, setFilter]         = useState<Impact | 'all'>('all');
  const { summary, marketLoading, marketMock } = useMarketSummary();
  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  const fetchCalendar = useCallback(async (date: Date) => {
    setLoading(true);
    setError(null);
    try {
      const from = formatDate(date);
      const res  = await fetch(`/api/calendar?from=${from}&to=${from}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const source = res.headers.get('X-Data-Source') ?? '';
      const reason = res.headers.get('X-Mock-Reason') ?? '';
      setIsMock(source !== 'finnhub');
      setMockReason(reason);

      const raw = await res.json();

      // Finnhub returns { economicCalendar: [...] }
      const items: RawEvent[] = raw.economicCalendar ?? raw ?? [];
      const enriched = items
        .filter(e => e.country && COUNTRY_MAP[e.country ?? '']) // only major currencies
        .map((e, i) => enrichEvent(e, i))
        .sort((a, b) => {
          // Sort: high impact first, then by time
          const iOrder = { high: 0, medium: 1, low: 2 };
          if (iOrder[a.impact] !== iOrder[b.impact]) return iOrder[a.impact] - iOrder[b.impact];
          return a.time.localeCompare(b.time);
        });

      setEvents(enriched);
    } catch {
      setError('Could not load calendar. Check your FINNHUB_API_KEY in .env.local');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCalendar(selectedDate); }, [selectedDate, fetchCalendar]);

  const navigateDate = (dir: 1 | -1) => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + dir);
    setSelectedDate(next);
  };

  const filtered = filter === 'all' ? events : events.filter(e => e.impact === filter);
  const highCount   = events.filter(e => e.impact === 'high').length;
  const pendingHigh = events.filter(e => e.impact === 'high' && e.surprise === 'pending').length;

  const isToday = formatDate(selectedDate) === formatDate(new Date());

  return (
    <motion.div className="space-y-6 max-w-3xl" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

      {/* ── Header ── */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(180deg,#00ff87,#00d4ff)' }} />
          <span className="text-[11px] tracking-widest text-white/30 uppercase" style={{ fontFamily: "'DM Mono',monospace" }}>Fundamental Analysis</span>
        </div>
        <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "'DM Mono',monospace", letterSpacing: '-0.02em' }}>Market News</h1>
        <p className="text-white/40 text-sm mt-1">
          Know what's moving the market — and which pairs to avoid.
        </p>
      </div>

      {/* ── Demo mode notice ── */}
      {isMock && !loading && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl px-4 py-3 flex items-start gap-3"
          style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.18)' }}>
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-400" style={{ fontFamily: "'DM Mono',monospace" }}>
              Demo mode — showing sample data
              {mockReason === 'bad-key'           && ' (invalid API key)'}
              {mockReason === 'plan-restriction'  && ' (upgrade Finnhub plan for economic calendar)'}
              {mockReason === 'rate-limit'         && ' (rate limited — try again in 1 min)'}
              {mockReason === 'no-api-key'         && ' (no API key set)'}
              {mockReason === 'empty-response'     && ' (no events on Finnhub for this date)'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {mockReason === 'plan-restriction'
                ? 'Finnhub economic calendar requires a paid plan. The app works fully on sample data — or try a free key from '
                : 'Add '}
              {mockReason !== 'plan-restriction' && (
                <><code style={{ color: '#f59e0b', fontSize: 11 }}>FINNHUB_API_KEY=sk_...</code>
                {' to '}<code style={{ color: '#f59e0b', fontSize: 11 }}>.env.local</code>
                {' then restart the server. Free key at '}</>
              )}
              <a href="https://finnhub.io" target="_blank" rel="noreferrer"
                style={{ color: '#f59e0b', textDecoration: 'underline' }}>finnhub.io</a>.
            </p>
          </div>
        </motion.div>
      )}
      {/* ── NEW: Market Summary Section ── */}
      <div className="space-y-4">
        {/* Market status bar */}
        <div className="flex items-center justify-between p-4 rounded-2xl"
          style={{ 
            background: marketMock 
              ? 'rgba(245,158,11,0.07)' 
              : summary?.changePct && summary.changePct > 0 
                ? 'rgba(0,255,135,0.08)' 
                : 'rgba(239,68,68,0.08)',
            border: `1px solid ${marketMock ? 'rgba(245,158,11,0.2)' : summary?.changePct && summary.changePct > 0 ? 'rgba(0,255,135,0.2)' : 'rgba(239,68,68,0.2)'}`
          }}>
          
          {marketLoading ? (
            <div className="flex items-center gap-3 w-full">
              <div className="w-8 h-8 bg-white/5 rounded-xl animate-pulse" />
              <div className="flex-1 space-y-1">
                <div className="h-4 bg-white/10 rounded w-24 animate-pulse" />
                <div className="h-3 bg-white/5 rounded w-16 animate-pulse" />
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full animate-ping"
                  style={{ backgroundColor: summary?.changePct && summary.changePct > 0 ? '#00ff87' : '#ef4444' }} />
                <div>
                  <p className="text-sm font-bold text-white/80" style={{ fontFamily: "'DM Mono',monospace" }}>
                    S&P 500 {summary?.status.toUpperCase()}
                  </p>
                  <p className="text-2xl font-black" 
                    style={{ 
                      color: summary?.changePct && summary.changePct > 0 ? '#00ff87' : '#ef4444',
                      fontFamily: "'DM Mono',monospace"
                    }}>
                    ${summary?.latestPrice}
                  </p>
                </div>
              </div>

              <div className="text-center">
                <p className={`text-sm font-bold ${summary?.changePct && summary.changePct > 0 ? 'text-[#00ff87]' : 'text-[#ef4444]'} font-mono`}>
                  {summary?.changePct! > 0 ? '+' : ''}{summary?.changePct?.toFixed(2)}%
                </p>
                <p className="text-xs text-white/40" style={{ fontFamily: "'DM Mono',monospace" }}>
                  {summary?.change! > 0 ? '+' : ''}{summary?.change?.toFixed(2)} pts
                </p>
              </div>

              {marketMock && (
                <div className="ml-auto text-xs text-amber-400 font-mono" style={{ fontFamily: "'DM Mono',monospace" }}>
                  DEMO
                </div>
              )}
            </>
          )}
        </div>

        {/* Quick market context */}
        {!marketLoading && summary && (
          <div className="text-xs p-3 rounded-xl grid grid-cols-2 gap-2 text-center"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div>
              <p className="text-white/40 mb-1" style={{ fontFamily: "'DM Mono',monospace" }}>Market direction</p>
              <p style={{ 
                color: summary.changePct > 0 ? '#00ff87' : '#ef4444',
                fontFamily: "'DM Mono',monospace", fontWeight: 'bold'
              }}>
                {summary.changePct > 0 ? 'BULLISH' : 'BEARISH'}
              </p>
            </div>
            <div>
              <p className="text-white/40 mb-1" style={{ fontFamily: "'DM Mono',monospace" }}>Trading</p>
              <p className="text-[#00ff87] font-bold" style={{ fontFamily: "'DM Mono',monospace" }}>
                {summary.status.toUpperCase()}
              </p>
            </div>
          </div>
        )}
      </div>
      {/* ── Date navigator ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button onClick={() => navigateDate(-1)}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-white/5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer' }}>
            <ChevronLeft className="w-4 h-4 text-white/50" />
          </button>

          <div className="text-center px-4 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-white/80 font-bold text-sm" style={{ fontFamily: "'DM Mono',monospace" }}>
              {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
            {isToday && <p className="text-[10px]" style={{ color: '#00ff87', fontFamily: "'DM Mono',monospace" }}>TODAY</p>}
          </div>

          <button onClick={() => navigateDate(1)}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-white/5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer' }}>
            <ChevronRight className="w-4 h-4 text-white/50" />
          </button>

          {!isToday && (
            <button onClick={() => setSelectedDate(new Date())}
              className="text-xs px-3 py-2 rounded-lg"
              style={{ background: 'rgba(0,255,135,0.06)', border: '1px solid rgba(0,255,135,0.12)', color: '#00ff87', fontFamily: "'DM Mono',monospace", cursor: 'pointer' }}>
              Today
            </button>
          )}
        </div>

        <button onClick={() => fetchCalendar(selectedDate)}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer' }}>
          <RefreshCw className={`w-4 h-4 text-white/30 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* ── Summary strip ── */}
      {!loading && events.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total events',   value: events.length,  color: 'rgba(255,255,255,0.7)' },
            { label: 'High impact',    value: highCount,       color: '#ef4444' },
            { label: 'Still pending',  value: pendingHigh,     color: '#f59e0b' },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[9px] uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: "'DM Mono',monospace" }}>{s.label}</p>
              <p className="text-2xl font-black" style={{ color: s.color, fontFamily: "'DM Mono',monospace", letterSpacing: '-0.02em' }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Filter pills ── */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'high', 'medium', 'low'] as const).map(f => {
          const active = filter === f;
          const cfg = f === 'all' ? null : IMPACT_CONFIG[f];
          return (
            <button key={f} onClick={() => setFilter(f)}
              className="text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all"
              style={{
                background: active ? (cfg?.bg ?? 'rgba(255,255,255,0.08)') : 'rgba(255,255,255,0.03)',
                border: `1px solid ${active ? (cfg?.border ?? 'rgba(255,255,255,0.15)') : 'rgba(255,255,255,0.06)'}`,
                color: active ? (cfg?.color ?? 'rgba(255,255,255,0.8)') : 'rgba(255,255,255,0.3)',
                fontFamily: "'DM Mono',monospace", cursor: 'pointer',
              }}>
              {f === 'all' ? 'All events' : `${f.charAt(0).toUpperCase() + f.slice(1)} impact`}
            </button>
          );
        })}
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="rounded-xl p-4 flex items-start gap-3"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 text-sm font-bold mb-1" style={{ fontFamily: "'DM Mono',monospace" }}>API Error</p>
            <p className="text-white/50 text-xs">{error}</p>
            <p className="text-white/35 text-xs mt-1">Add <code style={{ color: '#00ff87' }}>FINNHUB_API_KEY=your_key</code> to .env.local — get a free key at finnhub.io</p>
          </div>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="rounded-xl p-4 animate-pulse"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', height: 80 }} />
          ))}
        </div>
      )}

      {/* ── No events ── */}
      {!loading && !error && filtered.length === 0 && (
        <div className="rounded-2xl p-12 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
          <p className="text-white/30 text-sm" style={{ fontFamily: "'DM Mono',monospace" }}>
            No {filter !== 'all' ? `${filter}-impact ` : ''}events for this day
          </p>
          <p className="text-white/15 text-xs mt-1">Market may be closed or no major releases scheduled</p>
        </div>
      )}

      {/* ── Events list ── */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((event, i) => {
            const imp  = IMPACT_CONFIG[event.impact];
            const surp = SURPRISE_CONFIG[event.surprise];
            const SIcon = surp.icon;
            const bias = BIAS_CONFIG[event.marketBias];

            return (
              <motion.div key={event.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                onClick={() => setSelected(event)}
                className="rounded-xl p-4 cursor-pointer group transition-all"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}>

                <div className="flex items-start gap-3">
                  {/* Impact dot */}
                  <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                    <motion.div className="w-2.5 h-2.5 rounded-full"
                      style={{ background: imp.dot, boxShadow: event.impact === 'high' ? `0 0 8px ${imp.dot}80` : 'none' }}
                      animate={event.impact === 'high' && event.surprise === 'pending'
                        ? { scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }
                        : {}}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <span className="text-[8px] font-bold" style={{ color: imp.color, fontFamily: "'DM Mono',monospace" }}>{imp.label}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <div className="flex items-center gap-2">
                          <span style={{ fontSize: 14 }}>{event.flag}</span>
                          <p className="text-white/80 font-semibold text-sm leading-tight">{event.event}</p>
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                          {event.laymansTitle}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded"
                          style={{ background: bias.bg, color: bias.color, fontFamily: "'DM Mono',monospace" }}>
                          {bias.label.slice(2)}
                        </span>
                      </div>
                    </div>

                    {/* Data row */}
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: "'DM Mono',monospace" }}>
                        {event.time} UTC
                      </span>
                      {event.previous && (
                        <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: "'DM Mono',monospace" }}>
                          Prev: {event.previous}
                        </span>
                      )}
                      {event.forecast && (
                        <span className="text-[10px]" style={{ color: '#f59e0b', fontFamily: "'DM Mono',monospace" }}>
                          Fcst: {event.forecast}
                        </span>
                      )}
                      {event.actual && (
                        <span className="text-[10px] font-bold flex items-center gap-1"
                          style={{ color: surp.color, fontFamily: "'DM Mono',monospace" }}>
                          <SIcon className="w-3 h-3" />
                          Act: {event.actual}
                        </span>
                      )}
                    </div>

                    {/* Pairs to avoid mini-row */}
                    {event.impact === 'high' && event.pairsToAvoid.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
                        <div className="flex gap-1">
                          {event.pairsToAvoid.slice(0, 4).map(p => (
                            <span key={p} className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                              style={{ background: 'rgba(239,68,68,0.08)', color: 'rgba(239,68,68,0.7)', fontFamily: "'DM Mono',monospace" }}>
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <ChevronRight className="w-4 h-4 text-white/15 group-hover:text-white/30 transition-colors shrink-0 mt-1" />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Event detail drawer ── */}
      <AnimatePresence>
        {selected && <EventDrawer event={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </motion.div>
  );
}