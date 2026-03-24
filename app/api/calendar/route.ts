import { NextRequest, NextResponse } from 'next/server';

// ─────────────────────────────────────────────────────────────────────────────
// Rich mock data — used automatically when:
//  • FINNHUB_API_KEY is not set
//  • Finnhub returns an error / empty response
//  • You are running locally and just want the UI to work
// ─────────────────────────────────────────────────────────────────────────────

function getMockData() {
  const today = new Date().toISOString().split('T')[0];
  return {
    economicCalendar: [
      { time: `${today}T08:30:00.000Z`, country: 'United States', event: 'Non Farm Payrolls',     impact: 3, actual: '',       estimate: '185K',  prev: '151K',  unit: 'K' },
      { time: `${today}T08:30:00.000Z`, country: 'United States', event: 'Unemployment Rate',     impact: 3, actual: '',       estimate: '4.1%',  prev: '4.1%',  unit: '%' },
      { time: `${today}T08:30:00.000Z`, country: 'United States', event: 'Core CPI',              impact: 3, actual: '3.2%',   estimate: '3.1%',  prev: '3.1%',  unit: '%' },
      { time: `${today}T09:00:00.000Z`, country: 'Euro Zone',     event: 'CPI',                   impact: 3, actual: '2.3%',   estimate: '2.2%',  prev: '2.4%',  unit: '%' },
      { time: `${today}T09:30:00.000Z`, country: 'United Kingdom',event: 'CPI',                   impact: 3, actual: '3.0%',   estimate: '2.9%',  prev: '3.1%',  unit: '%' },
      { time: `${today}T12:00:00.000Z`, country: 'United Kingdom',event: 'GDP',                   impact: 3, actual: '',       estimate: '0.1%',  prev: '-0.1%', unit: '%' },
      { time: `${today}T14:00:00.000Z`, country: 'United States', event: 'FOMC Meeting Minutes',  impact: 3, actual: '',       estimate: '',      prev: '',      unit: '' },
      { time: `${today}T13:30:00.000Z`, country: 'United States', event: 'Retail Sales',          impact: 2, actual: '',       estimate: '0.5%',  prev: '-0.9%', unit: '%' },
      { time: `${today}T13:30:00.000Z`, country: 'United States', event: 'PPI',                   impact: 2, actual: '0.2%',   estimate: '0.3%',  prev: '0.6%',  unit: '%' },
      { time: `${today}T08:00:00.000Z`, country: 'Germany',       event: 'PMI Manufacturing',     impact: 2, actual: '48.3',   estimate: '48.0',  prev: '46.5',  unit: '' },
      { time: `${today}T09:30:00.000Z`, country: 'United Kingdom',event: 'Unemployment Rate',     impact: 2, actual: '',       estimate: '4.4%',  prev: '4.4%',  unit: '%' },
      { time: `${today}T00:30:00.000Z`, country: 'Australia',     event: 'Consumer Confidence',   impact: 1, actual: '',       estimate: '92.5',  prev: '90.1',  unit: '' },
      { time: `${today}T23:50:00.000Z`, country: 'Japan',         event: 'Trade Balance',         impact: 1, actual: '',       estimate: '-¥200B',prev: '-¥150B',unit: 'B' },
    ],
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from') ?? new Date().toISOString().split('T')[0];
  const to   = searchParams.get('to')   ?? from;

  const apiKey = (process.env.FINNHUB_API_KEY ?? '').trim();

  // ── No key configured → mock immediately ─────────────────────────────────
  if (!apiKey || apiKey === 'your_key_here') {
    console.log('[calendar] No FINNHUB_API_KEY — using mock data');
    return NextResponse.json(getMockData(), {
      headers: {
        'X-Data-Source': 'mock',
        'X-Mock-Reason': 'no-api-key',
      },
    });
  }

  try {
    const url = `https://finnhub.io/api/v1/calendar/economic?from=${from}&to=${to}&token=${apiKey}`;
    console.log('[calendar] Fetching:', url.replace(apiKey, 'REDACTED'));

    const res = await fetch(url, {
      next: { revalidate: 300 },
      headers: { 'Accept': 'application/json' },
    });

    const text = await res.text();
    console.log('[calendar] Finnhub status:', res.status, '| body preview:', text.slice(0, 200));

    // ── Parse response ──────────────────────────────────────────────────────
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      console.error('[calendar] Invalid JSON from Finnhub');
      return NextResponse.json(getMockData(), {
        headers: { 'X-Data-Source': 'mock', 'X-Mock-Reason': 'invalid-json' },
      });
    }

    // ── Finnhub error codes ─────────────────────────────────────────────────
    if (!res.ok || data?.error) {
      console.error('[calendar] Finnhub error:', res.status, data?.error);
      // 403 = plan restriction, 429 = rate limit, 401 = bad key
      const reason = res.status === 401 ? 'bad-key'
                   : res.status === 403 ? 'plan-restriction'
                   : res.status === 429 ? 'rate-limit'
                   : 'api-error';
      return NextResponse.json(getMockData(), {
        headers: { 'X-Data-Source': 'mock', 'X-Mock-Reason': reason },
      });
    }

    // ── Empty calendar (no events for this date) ────────────────────────────
    const events = data?.economicCalendar ?? [];
    if (events.length === 0) {
      console.log('[calendar] Finnhub returned 0 events — using mock');
      return NextResponse.json(getMockData(), {
        headers: { 'X-Data-Source': 'mock', 'X-Mock-Reason': 'empty-response' },
      });
    }

    console.log('[calendar] Live data — events:', events.length);
    return NextResponse.json(data, {
      headers: { 'X-Data-Source': 'finnhub', 'X-Event-Count': String(events.length) },
    });

  } catch (err) {
    console.error('[calendar] Network error:', err);
    return NextResponse.json(getMockData(), {
      headers: { 'X-Data-Source': 'mock', 'X-Mock-Reason': 'network-error' },
    });
  }
}