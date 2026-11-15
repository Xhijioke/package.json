import { NextResponse } from 'next/server';

const FALLBACK_STOCKS = [
  {
    symbol: 'NAHCO',
    name: 'Nigerian Aviation Handling Co. Plc',
    price: 136.10,
    change: 1.20,
    changePercent: 0.89,
    open: 134.90,
    high: 136.50,
    low: 133.90,
    volume: '473.20k',
    pe: '18.40',
    mktCap: '303.16B',
    high52: 226.54,
    low52: 86.76,
    avgVol: '1.12M',
    sparkline: [134.9, 135.1, 134.8, 135.4, 135.9, 135.7, 136.1],
  },
  {
    symbol: 'GTCO',
    name: 'Guaranty Trust Holding Co. Plc',
    price: 68.50,
    change: 1.50,
    changePercent: 2.24,
    open: 67.00,
    high: 68.80,
    low: 66.90,
    volume: '14.82M',
    pe: '4.12',
    mktCap: '2.02T',
    high52: 74.00,
    low52: 41.50,
    avgVol: '18.40M',
    sparkline: [67.0, 67.2, 67.8, 67.5, 68.1, 68.4, 68.5],
  },
  {
    symbol: 'SEPLAT',
    name: 'Seplat Energy Plc',
    price: 5700.00,
    change: -50.00,
    changePercent: -0.87,
    open: 5750.00,
    high: 5750.00,
    low: 5680.00,
    volume: '84.10k',
    pe: '14.20',
    mktCap: '3.35T',
    high52: 5900.00,
    low52: 3100.00,
    avgVol: '120.50k',
    sparkline:,
  },
  {
    symbol: 'MTNN',
    name: 'MTN Nigeria Communications Plc',
    price: 245.00,
    change: 4.50,
    changePercent: 1.87,
    open: 240.50,
    high: 246.00,
    low: 240.00,
    volume: '3.41M',
    pe: '16.80',
    mktCap: '5.14T',
    high52: 295.00,
    low52: 185.00,
    avgVol: '4.10M',
    sparkline: [240.5, 241.0, 242.5, 242.0, 243.8, 244.5, 245.0],
  },
  {
    symbol: 'DANGCEM',
    name: 'Dangote Cement Plc',
    price: 478.80,
    change: -3.20,
    changePercent: -0.66,
    open: 482.00,
    high: 482.00,
    low: 477.50,
    volume: '512.40k',
    pe: '15.10',
    mktCap: '8.16T',
    high52: 650.00,
    low52: 410.00,
    avgVol: '690.00k',
    sparkline: [482.0, 481.2, 480.5, 480.8, 479.5, 478.2, 478.8],
  },
  {
    symbol: 'AIRTELAFRI',
    name: 'Airtel Africa Plc',
    price: 2156.90,
    change: 12.40,
    changePercent: 0.58,
    open: 2144.50,
    high: 2160.00,
    low: 2144.50,
    volume: '42.30k',
    pe: '21.30',
    mktCap: '8.01T',
    high52: 2300.00,
    low52: 1850.00,
    avgVol: '65.00k',
    sparkline: [2144.5, 2148.0, 2150.2, 2149.0, 2153.5, 2155.1, 2156.9],
  },
  {
    symbol: 'ZENITHBANK',
    name: 'Zenith Bank Plc',
    price: 46.20,
    change: 0.85,
    changePercent: 1.87,
    open: 45.35,
    high: 46.50,
    low: 45.20,
    volume: '22.15M',
    pe: '3.40',
    mktCap: '1.45T',
    high52: 51.00,
    low52: 33.00,
    avgVol: '25.80M',
    sparkline: [45.35, 45.5, 45.8, 45.7, 46.0, 46.1, 46.2],
  },
  {
    symbol: 'UBA',
    name: 'United Bank for Africa Plc',
    price: 34.80,
    change: -0.45,
    changePercent: -1.28,
    open: 35.25,
    high: 35.30,
    low: 34.60,
    volume: '18.90M',
    pe: '2.95',
    mktCap: '1.19T',
    high52: 38.50,
    low52: 21.00,
    avgVol: '21.40M',
    sparkline: [35.25, 35.1, 35.15, 34.95, 34.85, 34.7, 34.8],
  },
];

export async function GET() {
  const apiKey = process.env.KOBO_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { stocks: FALLBACK_STOCKS, source: 'demo' },
      { headers: { 'Cache-Control': 's-maxage=1200, stale-while-revalidate=600' } }
    );
  }

  try {
    const res = await fetch('https://koboterminal.com', {
      headers: { Authorization: `Bearer ${apiKey}` },
      next: { revalidate: 1200 },
    });

    if (!res.ok) throw new Error('Kobo API error');
    const data = await res.json();
    const items = Array.isArray(data) ? data : data.data || [];

    const formatted = items.map((item) => {
      const price = Number(item.close || item.price || 0);
      const prev = Number(item.previous_close || item.open || price);
      const change = Number((price - prev).toFixed(2));
      const changePercent = prev ? Number(((change / prev) * 100).toFixed(2)) : 0;

      return {
        symbol: item.symbol || item.ticker,
        name: item.name || item.company_name || item.symbol,
        price,
        change,
        changePercent,
        open: Number(item.open || prev),
        high: Number(item.high || price),
        low: Number(item.low || price),
        volume: item.volume ? Number(item.volume).toLocaleString() : '—',
        pe: item.pe_ratio ? Number(item.pe_ratio).toFixed(2) : '—',
        mktCap: item.market_cap || '—',
        high52: Number(item.week_52_high || price),
        low52: Number(item.week_52_low || price),
        avgVol: item.avg_volume || '—',
        sparkline: item.sparkline || [prev, (prev + price) / 2, price],
      };
    });

    return NextResponse.json(
      { stocks: formatted.length ? formatted : FALLBACK_STOCKS, source: 'live' },
      { headers: { 'Cache-Control': 's-maxage=1200, stale-while-revalidate=600' } }
    );
  } catch {
    return NextResponse.json(
      { stocks: FALLBACK_STOCKS, source: 'fallback' },
      { headers: { 'Cache-Control': 's-maxage=600' } }
    );
  }
}
