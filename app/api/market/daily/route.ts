import { NextRequest, NextResponse } from 'next/server';

function getMockData() {
  return {
    success: true,
    data: {
      'Meta Data': {
        '1. Information': 'Daily Time Series',
        '2. Symbol': 'SPY',
        '3. Last Refreshed': '2026-03-25 16:00:00'
      },
      'Time Series (Daily)': {
        '2026-03-25': {
          '1. open': '520.50',
          '2. high': '525.20',
          '3. low': '518.10',
          '4. close': '523.80',
          '5. volume': '75000000'
        },
        '2026-03-24': {
          '1. open': '518.00',
          '2. high': '521.50',
          '3. low': '517.00',
          '4. close': '520.50',
          '5. volume': '68000000'
        }
      }
    }
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol') ?? 'SPY';
  const apiKey = (process.env.ALPHA_VANTAGE_API_KEY ?? '').trim();

  // No key → mock immediately (like your Finnhub)
  if (!apiKey || apiKey === 'your_free_key_here') {
    console.log('[market] No ALPHA_VANTAGE_API_KEY — using mock data');
    return NextResponse.json(getMockData(), {
      headers: {
        'X-Data-Source': 'mock',
        'X-Mock-Reason': 'no-api-key',
      },
    });
  }

  try {
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}&outputsize=compact`;
    console.log('[market] Fetching:', url.replace(apiKey, 'REDACTED'));

    const res = await fetch(url, {
      next: { revalidate: 900 }, // 15 min cache
      headers: { 'Accept': 'application/json' },
    });

    const text = await res.text();
    console.log('[market] AlphaVantage status:', res.status, '| preview:', text.slice(0, 200));

    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      console.error('[market] Invalid JSON from AlphaVantage');
      return NextResponse.json(getMockData(), {
        headers: { 'X-Data-Source': 'mock', 'X-Mock-Reason': 'invalid-json' },
      });
    }

    if (!res.ok || !data['Time Series (Daily)']) {
      console.error('[market] AlphaVantage error:', res.status, data);
      return NextResponse.json(getMockData(), {
        headers: { 'X-Data-Source': 'mock', 'X-Mock-Reason': 'api-error' },
      });
    }

    console.log('[market] Live data for', symbol);
    return NextResponse.json({ success: true, data }, {
      headers: { 
        'X-Data-Source': 'alphavantage', 
        'Cache-Control': 's-maxage=900, stale-while-revalidate' 
      },
    });

  } catch (err) {
    console.error('[market] Network error:', err);
    return NextResponse.json(getMockData(), {
      headers: { 'X-Data-Source': 'mock', 'X-Mock-Reason': 'network-error' },
    });
  }
}
