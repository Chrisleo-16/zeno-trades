'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tradesStore, strategiesStore, type Trade } from '@/lib/store';
import {
  Send, Bot, User, Sparkles, TrendingUp, TrendingDown,
  BarChart2, Brain, Zap, ChevronDown, RefreshCw, X,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  chart?: ChartData;
  timestamp: Date;
};

type ChartData = {
  type: 'fvg' | 'supply_demand' | 'scenario' | 'pattern';
  title: string;
  pair?: string;
  direction?: 'bullish' | 'bearish';
  entryZone?: [number, number];
  fvgZone?: [number, number];
  supplyZone?: [number, number];
  demandZone?: [number, number];
  stopLoss?: number;
  target?: number;
  currentPrice?: number;
};

type QuickPrompt = { label: string; prompt: string; icon: any };

// ─── SVG Chart Renderer ───────────────────────────────────────────────────────

function TradingChart({ data }: { data: ChartData }) {
  const W = 520, H = 280;
  const PAD = { top: 20, right: 20, bottom: 30, left: 50 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  // Generate realistic candles based on chart context
  const generateCandles = () => {
    const candles = [];
    const direction = data.direction === 'bearish' ? -1 : 1;
    let price = data.currentPrice ?? 1.1500;
    const step = price * 0.0005;

    // Build a meaningful price sequence that tells a story
    for (let i = 0; i < 22; i++) {
      const trend = i < 8
        ? direction * (Math.random() * step * 1.2)
        : i < 14
        ? -direction * (Math.random() * step * 0.6) // retracement
        : direction * (Math.random() * step * 1.0); // continuation

      const open = price;
      price = price + trend + (Math.random() - 0.5) * step * 0.3;
      const close = price;
      const wick = step * (0.3 + Math.random() * 0.7);
      candles.push({
        open, close,
        high: Math.max(open, close) + wick,
        low: Math.min(open, close) - wick,
        bull: close >= open,
        isFVGCandle: i >= 7 && i <= 9,
      });
    }
    return candles;
  };

  const candles = generateCandles();
  const allPrices = candles.flatMap(c => [c.high, c.low]);

  // Include zones in price range
  const zonePrices = [
    ...(data.fvgZone ?? []),
    ...(data.supplyZone ?? []),
    ...(data.demandZone ?? []),
    ...(data.entryZone ?? []),
    data.stopLoss,
    data.target,
  ].filter(Boolean) as number[];

  const allP = [...allPrices, ...zonePrices];
  const minP = Math.min(...allP) * 0.9995;
  const maxP = Math.max(...allP) * 1.0005;
  const range = maxP - minP;

  const toY = (p: number) => PAD.top + chartH - ((p - minP) / range) * chartH;
  const candleW = chartW / candles.length;

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#0a0e18', border: '1px solid rgba(0,255,135,0.12)' }}>
      {/* Chart title */}
      <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="text-[11px] font-bold" style={{ color: '#00ff87', fontFamily: "'DM Mono',monospace" }}>
          {data.title}
        </span>
        {data.pair && (
          <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'rgba(0,255,135,0.1)', color: 'rgba(0,255,135,0.7)', fontFamily: "'DM Mono',monospace" }}>
            {data.pair}
          </span>
        )}
      </div>

      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(frac => {
          const y = PAD.top + chartH * frac;
          const price = maxP - (frac * range);
          return (
            <g key={frac}>
              <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y}
                stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
              <text x={PAD.left - 4} y={y + 4} textAnchor="end" fontSize={8}
                fill="rgba(255,255,255,0.25)" fontFamily="monospace">
                {price.toFixed(4)}
              </text>
            </g>
          );
        })}

        {/* Supply zone */}
        {data.supplyZone && (
          <g>
            <rect x={PAD.left} y={toY(data.supplyZone[1])}
              width={chartW} height={toY(data.supplyZone[0]) - toY(data.supplyZone[1])}
              fill="rgba(239,68,68,0.12)" stroke="rgba(239,68,68,0.35)" strokeWidth={1}
              strokeDasharray="4,3" />
            <text x={PAD.left + 4} y={toY(data.supplyZone[1]) + 11} fontSize={9}
              fill="rgba(239,68,68,0.8)" fontFamily="monospace" fontWeight="bold">
              SUPPLY ZONE
            </text>
          </g>
        )}

        {/* Demand zone */}
        {data.demandZone && (
          <g>
            <rect x={PAD.left} y={toY(data.demandZone[1])}
              width={chartW} height={toY(data.demandZone[0]) - toY(data.demandZone[1])}
              fill="rgba(0,255,135,0.08)" stroke="rgba(0,255,135,0.35)" strokeWidth={1}
              strokeDasharray="4,3" />
            <text x={PAD.left + 4} y={toY(data.demandZone[1]) + 11} fontSize={9}
              fill="rgba(0,255,135,0.8)" fontFamily="monospace" fontWeight="bold">
              DEMAND ZONE
            </text>
          </g>
        )}

        {/* FVG zone */}
        {data.fvgZone && (
          <g>
            <rect x={PAD.left + candleW * 7} y={toY(data.fvgZone[1])}
              width={chartW * 0.55} height={toY(data.fvgZone[0]) - toY(data.fvgZone[1])}
              fill="rgba(167,139,250,0.12)" stroke="rgba(167,139,250,0.4)" strokeWidth={1.5} />
            <text x={PAD.left + candleW * 7 + 4} y={toY(data.fvgZone[1]) + 11} fontSize={9}
              fill="rgba(167,139,250,0.9)" fontFamily="monospace" fontWeight="bold">
              FVG — WAIT FOR RETEST
            </text>
          </g>
        )}

        {/* Candles */}
        {candles.map((c, i) => {
          const x = PAD.left + i * candleW + candleW * 0.15;
          const cw = candleW * 0.7;
          const top = Math.min(toY(c.open), toY(c.close));
          const bot = Math.max(toY(c.open), toY(c.close));
          const bodyH = Math.max(bot - top, 1.5);
          const color = c.bull ? '#00ff87' : '#ef4444';
          const glow = c.isFVGCandle ? `drop-shadow(0 0 3px ${c.bull ? '#00ff87' : '#ef4444'})` : 'none';

          return (
            <g key={i} style={{ filter: glow }}>
              {/* Wick */}
              <line x1={x + cw / 2} y1={toY(c.high)} x2={x + cw / 2} y2={toY(c.low)}
                stroke={color} strokeWidth={1} opacity={0.7} />
              {/* Body */}
              <rect x={x} y={top} width={cw} height={bodyH}
                fill={c.bull ? 'rgba(0,255,135,0.7)' : 'rgba(239,68,68,0.7)'}
                stroke={color} strokeWidth={0.5} />
            </g>
          );
        })}

        {/* Stop loss line */}
        {data.stopLoss && (
          <g>
            <line x1={PAD.left} y1={toY(data.stopLoss)} x2={W - PAD.right} y2={toY(data.stopLoss)}
              stroke="#ef4444" strokeWidth={1.5} strokeDasharray="6,4" opacity={0.8} />
            <rect x={W - PAD.right - 40} y={toY(data.stopLoss) - 8} width={38} height={14} rx={3}
              fill="rgba(239,68,68,0.2)" stroke="rgba(239,68,68,0.4)" strokeWidth={1} />
            <text x={W - PAD.right - 21} y={toY(data.stopLoss) + 3} textAnchor="middle" fontSize={8}
              fill="#ef4444" fontFamily="monospace" fontWeight="bold">SL</text>
          </g>
        )}

        {/* Target line */}
        {data.target && (
          <g>
            <line x1={PAD.left} y1={toY(data.target)} x2={W - PAD.right} y2={toY(data.target)}
              stroke="#00ff87" strokeWidth={1.5} strokeDasharray="6,4" opacity={0.8} />
            <rect x={W - PAD.right - 40} y={toY(data.target) - 8} width={38} height={14} rx={3}
              fill="rgba(0,255,135,0.15)" stroke="rgba(0,255,135,0.4)" strokeWidth={1} />
            <text x={W - PAD.right - 21} y={toY(data.target) + 3} textAnchor="middle" fontSize={8}
              fill="#00ff87" fontFamily="monospace" fontWeight="bold">TP</text>
          </g>
        )}

        {/* Entry zone */}
        {data.entryZone && (
          <g>
            <rect x={PAD.left + candleW * 14} y={toY(data.entryZone[1])}
              width={candleW * 3} height={toY(data.entryZone[0]) - toY(data.entryZone[1])}
              fill="rgba(245,158,11,0.2)" stroke="rgba(245,158,11,0.6)" strokeWidth={1.5} />
            <text x={PAD.left + candleW * 14 + 3} y={toY(data.entryZone[1]) + 11} fontSize={9}
              fill="rgba(245,158,11,0.9)" fontFamily="monospace" fontWeight="bold">ENTRY</text>
          </g>
        )}

        {/* Direction arrow */}
        {data.direction && (
          <g transform={`translate(${W - PAD.right - 16}, ${H / 2})`}>
            <text fontSize={20} textAnchor="middle" dominantBaseline="middle"
              fill={data.direction === 'bullish' ? '#00ff87' : '#ef4444'} opacity={0.4}>
              {data.direction === 'bullish' ? '↑' : '↓'}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

// ─── Quick prompts ────────────────────────────────────────────────────────────

const QUICK_PROMPTS: QuickPrompt[] = [
  { label: 'Review my trades', prompt: 'Look at my recent trades and tell me honestly what patterns you see. Be direct.', icon: BarChart2 },
  { label: 'Show me an FVG setup', prompt: 'Show me visually how a Fair Value Gap setup works on EUR/USD and when exactly I should enter.', icon: TrendingUp },
  { label: 'Supply & Demand zones', prompt: 'Draw me a supply and demand zone setup and explain where institutions are likely placing orders.', icon: Zap },
  { label: 'Test my discipline', prompt: 'Give me a trading scenario and ask me what I would do. Challenge my decision making.', icon: Brain },
  { label: 'Why did I lose?', prompt: 'Based on my trade history, what is the single biggest reason I keep losing? Give me the honest truth.', icon: TrendingDown },
  { label: 'Best entry right now', prompt: 'Walk me through how to find the perfect entry on GBP/JPY using Supply & Demand + FVG. Show me the setup visually.', icon: Target },
];

// Placeholder icons
function Target(props: any) { return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>; }

// ─── System prompt builder ────────────────────────────────────────────────────

function buildSystemPrompt(trades: Trade[]): string {
  const realTrades = trades.filter(t => t.status === 'win' || t.status === 'loss');
  const wins = realTrades.filter(t => t.status === 'win');
  const losses = realTrades.filter(t => t.status === 'loss');
  const fomoCount = realTrades.filter(t => (t.tags ?? []).includes('fomo')).length;
  const winRate = realTrades.length > 0 ? ((wins.length / realTrades.length) * 100).toFixed(1) : '0';

  const tradesSummary = realTrades.slice(-10).map(t =>
    `${t.date} | ${t.pair} | ${t.type} | Entry: ${t.entryPrice} | Exit: ${t.exitPrice ?? '—'} | P&L: ${t.pnl?.toFixed(2) ?? '—'} | Status: ${t.status} | Tags: ${(t.tags ?? []).join(', ')} | Notes: "${t.notes}"`
  ).join('\n');

  return `You are APEX — a world-class trading coach, analyst, and accountability partner. You are not a generic AI assistant. You are specifically the trading buddy for this trader.

## Your Personality
- Direct, honest, and encouraging — like a senior trader mentoring a student
- You never make the trader feel demoralized, but you never sugarcoat the truth
- You ask questions back — you coach through Socratic dialogue when appropriate
- You celebrate wins and analyze losses with equal energy
- You use "we" language — "let's look at this together"
- You understand that losing is part of trading — you focus on PROCESS not outcomes

## This Trader's Profile
- Strategy: Supply & Demand + Fair Value Gap + FRVP (their own stated system)
- Trading pairs: EUR/USD, GBP/JPY primarily
- Session: London session
- Experience level: Building (early stage)
- Win rate: ${winRate}% across ${realTrades.length} real trades
- Wins: ${wins.length} | Losses: ${losses.length}
- FOMO trades: ${fomoCount} (this is their primary weakness)
- Key rule they break most: "Do not enter due to FOMO — wait for price confirmation"

## Recent Trade History
${tradesSummary || 'No trades logged yet.'}

## Your Core Knowledge
You are an expert in:
- Supply & Demand zones (how institutions create order blocks)
- Fair Value Gaps (FVG) — 3-candle imbalance patterns, bullish and bearish
- FRVP (Fixed Range Volume Profile)
- ICT/Smart Money concepts
- Market structure (BOS, CHoCH, sweeps)
- Trading psychology and behavioral finance

## CRITICAL: Chart Generation
When explaining a setup visually, you MUST include a JSON chart specification in your response using this exact format:

<CHART>
{
  "type": "fvg",
  "title": "Bullish FVG — EUR/USD 15M",
  "pair": "EUR/USD",
  "direction": "bullish",
  "currentPrice": 1.0842,
  "fvgZone": [1.0820, 1.0835],
  "demandZone": [1.0810, 1.0825],
  "entryZone": [1.0820, 1.0828],
  "stopLoss": 1.0800,
  "target": 1.0890
}
</CHART>

For supply/demand scenarios use "supplyZone" and "demandZone" fields.
Adjust all prices to be realistic for the pair discussed.

## Response Style
- Keep responses focused and conversational
- Use line breaks generously — don't write walls of text
- Bold key concepts: **Supply Zone**, **FVG**, **Order Block**
- When showing a setup, ALWAYS include the chart JSON
- End responses with either a question back to the trader OR a specific action for them to take
- Never say "I cannot provide financial advice" — you ARE their trading coach, speak directly`;
}

// ─── Parse chart from response ────────────────────────────────────────────────

function parseChart(content: string): { text: string; chart: ChartData | null } {
  const match = content.match(/<CHART>([\s\S]*?)<\/CHART>/);
  if (!match) return { text: content, chart: null };
  try {
    const chart = JSON.parse(match[1].trim()) as ChartData;
    const text = content.replace(/<CHART>[\s\S]*?<\/CHART>/, '').trim();
    return { text, chart };
  } catch {
    return { text: content, chart: null };
  }
}

// ─── Markdown-ish renderer ────────────────────────────────────────────────────

function MessageText({ content }: { content: string }) {
  const lines = content.split('\n');
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith('## '))
          return <p key={i} className="font-bold text-sm mt-2" style={{ color: '#00ff87', fontFamily: "'DM Mono',monospace" }}>{line.replace('## ', '')}</p>;
        if (line.startsWith('# '))
          return <p key={i} className="font-black text-base mt-2" style={{ color: 'rgba(255,255,255,0.9)', fontFamily: "'DM Mono',monospace" }}>{line.replace('# ', '')}</p>;
        if (line.startsWith('- '))
          return (
            <div key={i} className="flex items-start gap-2 text-sm">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#00ff87' }} />
              <span style={{ color: 'rgba(255,255,255,0.7)' }} dangerouslySetInnerHTML={{ __html: line.replace('- ', '').replace(/\*\*(.*?)\*\*/g, '<strong style="color:rgba(0,255,135,0.9)">$1</strong>') }} />
            </div>
          );
        if (line.trim() === '') return <div key={i} className="h-1" />;
        return (
          <p key={i} className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}
            dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong style="color:rgba(0,255,135,0.9)">$1</strong>') }} />
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AIBuddyPage() {
  const [messages, setMessages]   = useState<Message[]>([]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [trades, setTrades]       = useState<Trade[]>([]);
  const bottomRef                 = useRef<HTMLDivElement>(null);
  const inputRef                  = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const init = async () => {
      const t = tradesStore.getAll();
      setTrades(t);

    const realTrades = t.filter(x => x.status === 'win' || x.status === 'loss');
    const wins       = realTrades.filter(x => x.status === 'win');
    const losses     = realTrades.filter(x => x.status === 'loss');
    const fomoTrades = realTrades.filter(x => (x.tags ?? []).includes('fomo'));
    const winRate    = realTrades.length > 0
      ? ((wins.length / realTrades.length) * 100).toFixed(1)
      : null;

    // Most traded pair
    const pairCounts = realTrades.reduce((acc, tr) => {
      acc[tr.pair] = (acc[tr.pair] ?? 0) + 1; return acc;
    }, {} as Record<string, number>);
    const topPair = Object.entries(pairCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'EUR/USD';

    // Last trade notes
    const lastTrade = [...realTrades].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    // Build a rich context prompt for the welcome
    const welcomePrompt = realTrades.length > 0
      ? `Generate a short, punchy, personalized opening message to this trader. You are their AI trading coach "APEX".

Their data:
- Total real trades: ${realTrades.length} (${wins.length} wins, ${losses.length} losses)
- Win rate: ${winRate}%
- Most traded pair: ${topPair}
- FOMO trades: ${fomoTrades.length} out of ${realTrades.length}
- Strategy: Supply & Demand + FVG + FRVP
- Last trade: ${lastTrade ? `${lastTrade.date} on ${lastTrade.pair} — ${lastTrade.status.toUpperCase()} — "${lastTrade.notes}"` : 'none'}

Rules:
- Be direct, warm, and specific — reference their ACTUAL numbers
- Do NOT be generic. Do not say "I'm an AI" or "I'm here to help"
- Keep it under 6 lines
- Use a tone like a sharp mentor who has studied their file
- End with ONE specific question or challenge to open the coaching conversation
- Use line breaks generously
- You can use **bold** for emphasis
- Do not use bullet points`

      : `Generate a short, punchy opening message to a brand new trader with no trades yet. You are their AI trading coach "APEX".

Rules:
- Welcome them warmly but set the tone: this is serious work
- Mention their strategy: Supply & Demand + FVG + FRVP
- Ask them what they want to start with
- Keep it under 5 lines
- Use line breaks
- You can use **bold** for emphasis
- Sound like a sharp mentor, not a customer service bot`;

    // Show typing indicator during generation
    setLoading(true);

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 300,
          messages: [{ role: 'user', content: welcomePrompt }],
        }),
      });
      const data = await res.json();
      const generatedWelcome = data.content?.[0]?.text ?? `Hey — I'm APEX, your trading coach. I've looked at your data. Let's get to work. What do you want to tackle today?`;

      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: generatedWelcome,
        timestamp: new Date(),
      }]);
    } catch {
      // Fallback if API fails
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: realTrades.length > 0
          ? `I've been through your ${realTrades.length} trades. ${winRate}% win rate. ${fomoTrades.length} FOMO entries.\n\n**The data doesn't lie — and neither will I.**\n\nWhat do you want to work on today?`
          : `Welcome to APEX. Your strategy is Supply & Demand + FVG + FRVP — solid foundation.\n\n**Let's make sure you execute it correctly.**\n\nWhat do you want to start with?`,
        timestamp: new Date(),
      }]);
      } finally {
        setLoading(false);
      }
      };
      init();
    }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;

    setInput('');
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: msg,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = messages.slice(-12).map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: buildSystemPrompt(trades),
          messages: [...history, { role: 'user', content: msg }],
        }),
      });

      const data = await response.json();
      const raw = data.content?.[0]?.text ?? 'I had trouble responding. Try again.';
      const { text: cleanText, chart } = parseChart(raw);

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: cleanText,
        chart: chart ?? undefined,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (e) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Something went wrong connecting to the AI. Check your network and try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]" style={{ maxHeight: 820 }}>

      {/* ── Header ── */}
      <div className="shrink-0 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(180deg,#00ff87,#00d4ff)' }} />
          <span className="text-[11px] tracking-widest text-white/30 uppercase" style={{ fontFamily: "'DM Mono',monospace" }}>AI Trading Buddy</span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "'DM Mono',monospace", letterSpacing: '-0.02em' }}>APEX Coach</h1>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(0,255,135,0.06)', border: '1px solid rgba(0,255,135,0.15)' }}>
            <motion.div className="w-1.5 h-1.5 rounded-full" style={{ background: '#00ff87' }}
              animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
              transition={{ duration: 2, repeat: Infinity }} />
            <span className="text-[10px] font-bold" style={{ color: '#00ff87', fontFamily: "'DM Mono',monospace" }}>AI LIVE</span>
          </div>
        </div>
        <p className="text-white/40 text-sm mt-1">Your personal trading coach — scenarios, visuals, honest feedback.</p>
      </div>

      {/* ── Quick prompts ── */}
      <div className="shrink-0 flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
        {QUICK_PROMPTS.map((qp, i) => {
          const Icon = qp.icon;
          return (
            <motion.button key={i} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => sendMessage(qp.prompt)}
              className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)', fontFamily: "'DM Mono',monospace", cursor: 'pointer', whiteSpace: 'nowrap' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,255,135,0.2)'; e.currentTarget.style.color = 'rgba(0,255,135,0.8)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}>
              <Icon className="w-3.5 h-3.5 shrink-0" />
              {qp.label}
            </motion.button>
          );
        })}
      </div>

      {/* ── Chat messages ── */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-3" style={{ scrollbarWidth: 'thin' }}>
        <AnimatePresence initial={false}>
          {messages.map(msg => (
            <motion.div key={msg.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>

              {/* Avatar */}
              <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center"
                style={msg.role === 'assistant'
                  ? { background: 'linear-gradient(135deg,#00ff87,#00d4ff)', boxShadow: '0 0 12px rgba(0,255,135,0.3)' }
                  : { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
                {msg.role === 'assistant'
                  ? <Sparkles className="w-4 h-4 text-black" />
                  : <User className="w-4 h-4 text-white/60" />}
              </div>

              {/* Bubble */}
              <div className={`max-w-[78%] space-y-3 ${msg.role === 'user' ? 'items-end' : ''}`}>
                <div className="rounded-2xl px-4 py-3"
                  style={msg.role === 'assistant'
                    ? { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }
                    : { background: 'linear-gradient(135deg,rgba(0,255,135,0.12),rgba(0,212,255,0.06))', border: '1px solid rgba(0,255,135,0.2)' }}>
                  <MessageText content={msg.content} />
                </div>

                {/* Chart */}
                {msg.chart && (
                  <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
                    <TradingChart data={msg.chart} />
                  </motion.div>
                )}

                <p className="text-[10px] px-1" style={{ color: 'rgba(255,255,255,0.15)', fontFamily: "'DM Mono',monospace" }}>
                  {msg.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#00ff87,#00d4ff)', boxShadow: '0 0 12px rgba(0,255,135,0.3)' }}>
              <Sparkles className="w-4 h-4 text-black" />
            </div>
            <div className="rounded-2xl px-4 py-3 flex items-center gap-2"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              {[0, 1, 2].map(i => (
                <motion.div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: '#00ff87' }}
                  animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }} />
              ))}
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input area ── */}
      <div className="shrink-0 relative rounded-2xl overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
        {/* Focus glow */}
        <div className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 transition-opacity"
          style={{ background: 'linear-gradient(135deg,rgba(0,255,135,0.05),rgba(0,212,255,0.03))' }} />

        <div className="flex items-end gap-3 p-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything — setups, scenarios, why you're losing, what to do next..."
            rows={1}
            className="flex-1 resize-none"
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              color: 'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 1.5,
              fontFamily: "'DM Mono',monospace", maxHeight: 120,
            }}
            onInput={e => {
              const el = e.target as HTMLTextAreaElement;
              el.style.height = 'auto';
              el.style.height = Math.min(el.scrollHeight, 120) + 'px';
            }}
          />
          <motion.button
            whileHover={input.trim() ? { scale: 1.05 } : {}}
            whileTap={input.trim() ? { scale: 0.95 } : {}}
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: input.trim() && !loading
                ? 'linear-gradient(135deg,#00ff87,#00d4ff)'
                : 'rgba(255,255,255,0.06)',
              border: 'none',
              cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
              boxShadow: input.trim() ? '0 0 16px rgba(0,255,135,0.3)' : 'none',
              transition: 'all 0.2s',
            }}>
            <Send className="w-4 h-4" style={{ color: input.trim() ? '#070a10' : 'rgba(255,255,255,0.2)' }} />
          </motion.button>
        </div>

        <div className="px-3 pb-2 flex items-center gap-3">
          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.15)', fontFamily: "'DM Mono',monospace" }}>
            Enter to send · Shift+Enter for new line
          </span>
        </div>
      </div>
    </div>
  );
}