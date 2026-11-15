'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, Plus, Check, Share, MoreHorizontal, ChevronUp } from 'lucide-react';

function Sparkline({ data, isPositive, width = 76, height = 30 }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const baseline = data[0];
  const baseY = height - ((baseline - min) / range) * (height - 6) - 3;

  const points = data
    .map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const color = isPositive ? '#30D158' : '#FF453A';

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <line
        x1="0"
        y1={baseY}
        x2={width}
        y2={baseY}
        stroke={color}
        strokeWidth="1"
        strokeDasharray="2 2"
        opacity="0.55"
      />
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

function DetailChart({ stock, timeframe }) {
  const series = useMemo(() => {
    const base = stock.sparkline || [stock.open, stock.price];
    const multipliers = {
      '1D': 1,
      '1W': 1.03,
      '1M': 1.08,
      '3M': 1.15,
      '6M': 1.22,
      YTD: 1.25,
      '1Y': 1.35,
      '2Y': 1.5,
    };
    const factor = multipliers[timeframe] || 1;
    if (timeframe === '1D') return base;

    const pts = [];
    const steps = 28;
    const startPrice = stock.price / factor;
    for (let i = 0; i < steps; i++) {
      const progress = i / (steps - 1);
      const wave = Math.sin(i * 0.7) * (stock.price * 0.015);
      const val = startPrice + (stock.price - startPrice) * progress + (i === steps - 1 ? 0 : wave);
      pts.push(Number(val.toFixed(2)));
    }
    return pts;
  }, [stock, timeframe]);

  const width = 320;
  const height = 190;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = max - min || 1;
  const isPositive = series[series.length - 1] >= series[0];
  const color = isPositive ? '#30D158' : '#FF453A';

  const coords = series.map((val, i) => {
    const x = (i / (series.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 24) - 12;
    return { x, y };
  });

  const linePath = coords.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;

  const yTicks = [max, min + range * 0.66, min + range * 0.33, min];

  return (
    <div style={{ display: 'flex', alignItems: 'center', marginTop: 14 }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '84%', height: 195 }}>
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.32" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {[0.2, 0.5, 0.8].map((pos, idx) => (
          <line
            key={idx}
            x1="0"
            y1={height * pos}
            x2={width}
            y2={height * pos}
            stroke="#2C2C2E"
            strokeWidth="1"
          />
        ))}

        <path d={areaPath} fill="url(#chartGrad)" />
        <path d={linePath} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" />
      </svg>

      <div
        style={{
          width: '16%',
          height: 185,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          paddingLeft: 8,
          fontSize: 12,
          fontWeight: 600,
          color: '#8E8E93',
        }}
      >
        {yTicks.map((tick, i) => (
          <span key={i}>{tick >= 100 ? tick.toFixed(0) : tick.toFixed(2)}</span>
        ))}
      </div>
    </div>
  );
}

export default function AppleStocksNGX() {
  const [allStocks, setAllStocks] = useState([]);
  const [watchlist, setWatchlist] = useState(['NAHCO', 'GTCO', 'SEPLAT', 'MTNN', 'DANGCEM', 'AIRTELAFRI', 'ZENITHBANK']);
  const [pillMode, setPillMode] = useState('change'); // 'change' | 'percent' | 'cap'
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedStock, setSelectedStock] = useState(null);
  const [timeframe, setTimeframe] = useState('1W');

  useEffect(() => {
    const saved = localStorage.getItem('ngx_watchlist');
    if (saved) {
      try {
        setWatchlist(JSON.parse(saved));
      } catch {}
    }

    fetch('/api/stocks')
      .then((r) => r.json())
      .then((d) => setAllStocks(d.stocks || []));
  }, []);

  const toggleWatchlist = (symbol, e) => {
    e?.stopPropagation();
    const updated = watchlist.includes(symbol)
      ? watchlist.filter((s) => s !== symbol)
      : [...watchlist, symbol];
    setWatchlist(updated);
    localStorage.setItem('ngx_watchlist', JSON.stringify(updated));
  };

  const cyclePillMode = (e) => {
    e.stopPropagation();
    setPillMode((prev) => (prev === 'change' ? 'percent' : prev === 'percent' ? 'cap' : 'change'));
  };

  const displayedStocks = useMemo(() => {
    return allStocks.filter((s) => watchlist.includes(s.symbol));
  }, [allStocks, watchlist]);

  const searchResults = useMemo(() => {
    if (!query.trim()) return allStocks;
    const q = query.toLowerCase();
    return allStocks.filter(
      (s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    );
  }, [allStocks, query]);

  const todayLabel = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
  });

  return (
    <div
      style={{
        maxWidth: 460,
        margin: '0 auto',
        minHeight: '100vh',
        backgroundColor: '#000000',
        padding: '18px 16px 90px',
        position: 'relative',
      }}
    >
      {/* Header matching Screenshot 1 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, letterSpacing: -0.5 }}>Stocks</h1>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#8E8E93', marginTop: -2 }}>
            {todayLabel}
          </div>
        </div>

        <button
          onClick={() => setSearchOpen(true)}
          aria-label="Search Stocks"
          style={{
            backgroundColor: '#1C1C1E',
            border: 'none',
            borderRadius: 999,
            padding: '10px 16px',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
            marginTop: 6,
          }}
        >
          <MoreHorizontal size={18} color="#AEAEB2" />
          <Search size={18} color="#FFFFFF" />
        </button>
      </div>

      {/* Subheader */}
      <div
        style={{
          marginTop: 22,
          marginBottom: 8,
          fontSize: 17,
          fontWeight: 700,
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        My Symbols <span style={{ fontSize: 12, color: '#8E8E93' }}>⌄</span>
      </div>

      {/* Watchlist Rows */}
      <div>
        {displayedStocks.map((stock) => {
          const isPositive = stock.change >= 0;
          const badgeColor = isPositive ? '#30D158' : '#FF453A';
          const pillText =
            pillMode === 'change'
              ? `${isPositive ? '+' : ''}${stock.change.toFixed(2)}`
              : pillMode === 'percent'
              ? `${isPositive ? '+' : ''}${stock.changePercent.toFixed(2)}%`
              : stock.mktCap;

          return (
            <div
              key={stock.symbol}
              onClick={() => setSelectedStock(stock)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '13px 0',
                borderBottom: '0.5px solid #2C2C2E',
                cursor: 'pointer',
              }}
            >
              {/* Left: Symbol & Truncated Name */}
              <div style={{ width: '38%', paddingRight: 8 }}>
                <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: -0.2 }}>
                  {stock.symbol}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: '#8E8E93',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    marginTop: 2,
                  }}
                >
                  {stock.name}
                </div>
              </div>

              {/* Center: Sparkline */}
              <div style={{ width: '28%', display: 'flex', justifyContent: 'center' }}>
                <Sparkline data={stock.sparkline} isPositive={isPositive} />
              </div>

              {/* Right: Price & Tap-to-Toggle Pill */}
              <div style={{ width: '34%', textAlign: 'right' }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>
                  ₦{stock.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <button
                  onClick={cyclePillMode}
                  style={{
                    marginTop: 4,
                    backgroundColor: badgeColor,
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 6,
                    padding: '3px 8px',
                    minWidth: 68,
                    fontSize: 13,
                    fontWeight: 700,
