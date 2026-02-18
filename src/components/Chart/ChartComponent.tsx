'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    createChart,
    ColorType,
    CandlestickSeries,
    LineSeries,
} from 'lightweight-charts';
import { calculateSMA, calculateEMA, calculateBollinger } from '@/lib/indicators';


interface OHLCBar {
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
}

interface ChartComponentProps {
    symbol: string;
}

const TIMEFRAMES = [
    { label: '1D', interval: 'FIVE_MINUTE', range: '1' },
    { label: '1W', interval: 'FIFTEEN_MINUTE', range: '7' },
    { label: '1M', interval: 'ONE_HOUR', range: '30' },
    { label: '1Y', interval: 'ONE_DAY', range: '365' },
];

const OVERLAY_INDICATORS = ['SMA', 'EMA', 'Bollinger'];

export default function ChartComponent({ symbol }: ChartComponentProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<any>(null);
    const candleSeriesRef = useRef<any>(null);
    const indicatorSeriesRef = useRef<Map<string, any>>(new Map());

    const [data, setData] = useState<OHLCBar[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTimeframe, setActiveTimeframe] = useState(TIMEFRAMES[3]);
    const [activeIndicators, setActiveIndicators] = useState<string[]>([]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(
                `/api/stock/${symbol}?interval=${activeTimeframe.interval}&range=${activeTimeframe.range}`
            );
            const json = await res.json();
            if (res.ok && Array.isArray(json)) {
                const sorted = [...json].sort(
                    (a: OHLCBar, b: OHLCBar) =>
                        new Date(a.time).getTime() - new Date(b.time).getTime()
                );
                const seen = new Set<string>();
                const unique = sorted.filter((d: OHLCBar) => {
                    if (seen.has(d.time)) return false;
                    seen.add(d.time);
                    return true;
                });
                setData(unique);
            } else {
                setError(json?.error || 'Failed to fetch data');
                setData([]);
            }
        } catch {
            setError('Network error. Check your connection.');
        } finally {
            setLoading(false);
        }
    }, [symbol, activeTimeframe]);

    useEffect(() => {
        if (symbol) fetchData();
    }, [fetchData]);

    // Initialize chart once — lightweight-charts v5 API
    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: '#0b0e11' },
                textColor: '#d1d4dc',
            },
            grid: {
                vertLines: { color: '#1e222d' },
                horzLines: { color: '#1e222d' },
            },
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
                borderColor: '#363a45',
            },
            rightPriceScale: { borderColor: '#363a45' },
        });

        // v5: use chart.addSeries(CandlestickSeries, options)
        const candleSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#089981',
            downColor: '#f23645',
            borderVisible: false,
            wickUpColor: '#089981',
            wickDownColor: '#f23645',
        });

        chartRef.current = chart;
        candleSeriesRef.current = candleSeries;

        const handleResize = () => {
            if (chartContainerRef.current) {
                chart.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
            chartRef.current = null;
            candleSeriesRef.current = null;
        };
    }, []);

    // Update candle data when data changes
    useEffect(() => {
        if (candleSeriesRef.current && data.length > 0) {
            candleSeriesRef.current.setData(data);
            chartRef.current?.timeScale().fitContent();
        }
    }, [data]);

    // Update indicators when data or activeIndicators change
    useEffect(() => {
        if (!chartRef.current || data.length === 0) return;

        // Remove all existing indicator series
        indicatorSeriesRef.current.forEach((val) => {
            if (Array.isArray(val)) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                val.forEach((s: any) => chartRef.current.removeSeries(s));
            } else {
                chartRef.current.removeSeries(val);
            }
        });
        indicatorSeriesRef.current.clear();

        // Add active indicators using v5 API
        activeIndicators.forEach((ind) => {
            if (ind === 'SMA') {
                const smaData = calculateSMA(data, 20);
                const s = chartRef.current.addSeries(LineSeries, {
                    color: '#2962ff',
                    lineWidth: 2,
                    title: 'SMA 20',
                    priceScaleId: 'right',
                });
                s.setData(smaData);
                indicatorSeriesRef.current.set(ind, s);
            }
            if (ind === 'EMA') {
                const emaData = calculateEMA(data, 20);
                const s = chartRef.current.addSeries(LineSeries, {
                    color: '#ff6d00',
                    lineWidth: 2,
                    title: 'EMA 20',
                    priceScaleId: 'right',
                });
                s.setData(emaData);
                indicatorSeriesRef.current.set(ind, s);
            }
            if (ind === 'Bollinger') {
                const bbData = calculateBollinger(data, 20, 2);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const upper = bbData.map((d: any) => ({ time: d.time, value: d.upper }));
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const lower = bbData.map((d: any) => ({ time: d.time, value: d.lower }));
                const uSeries = chartRef.current.addSeries(LineSeries, {
                    color: 'rgba(41,98,255,0.6)',
                    lineWidth: 1,
                    title: 'BB Upper',
                    priceScaleId: 'right',
                });
                const lSeries = chartRef.current.addSeries(LineSeries, {
                    color: 'rgba(41,98,255,0.6)',
                    lineWidth: 1,
                    title: 'BB Lower',
                    priceScaleId: 'right',
                });
                uSeries.setData(upper);
                lSeries.setData(lower);
                indicatorSeriesRef.current.set(ind, [uSeries, lSeries]);
            }
        });
    }, [data, activeIndicators]);

    const toggleIndicator = (ind: string) => {
        setActiveIndicators((prev) =>
            prev.includes(ind) ? prev.filter((i) => i !== ind) : [...prev, ind]
        );
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
            {/* Toolbar */}
            <div
                style={{
                    padding: '0.5rem 1rem',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    gap: '0.5rem',
                    alignItems: 'center',
                    backgroundColor: 'var(--bg-secondary)',
                    flexWrap: 'wrap',
                    flexShrink: 0,
                }}
            >
                <span style={{ fontWeight: 700, fontSize: '1rem', marginRight: '0.5rem' }}>{symbol}</span>

                {TIMEFRAMES.map((tf) => (
                    <button
                        key={tf.label}
                        onClick={() => setActiveTimeframe(tf)}
                        style={{
                            background: activeTimeframe.label === tf.label ? 'var(--accent-color)' : 'transparent',
                            color: activeTimeframe.label === tf.label ? '#fff' : 'var(--text-secondary)',
                            border: 'none',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 500,
                        }}
                    >
                        {tf.label}
                    </button>
                ))}

                <div style={{ width: '1px', height: '20px', background: 'var(--border-color)', margin: '0 0.25rem' }} />

                {OVERLAY_INDICATORS.map((ind) => {
                    const isActive = activeIndicators.includes(ind);
                    return (
                        <button
                            key={ind}
                            onClick={() => toggleIndicator(ind)}
                            style={{
                                background: isActive ? 'rgba(41,98,255,0.15)' : 'transparent',
                                color: isActive ? 'var(--accent-color)' : 'var(--text-secondary)',
                                border: isActive ? '1px solid var(--accent-color)' : '1px solid var(--border-color)',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                            }}
                        >
                            {ind}
                        </button>
                    );
                })}

                {loading && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
                        Loading...
                    </span>
                )}
            </div>

            {/* Chart area */}
            <div style={{ position: 'relative', flex: 1 }}>
                {loading && data.length === 0 && (
                    <div
                        style={{
                            position: 'absolute', top: '50%', left: '50%',
                            transform: 'translate(-50%,-50%)', zIndex: 10,
                            color: 'var(--text-secondary)', fontSize: '0.9rem',
                        }}
                    >
                        Loading {symbol}...
                    </div>
                )}
                {error && (
                    <div
                        style={{
                            position: 'absolute', top: '50%', left: '50%',
                            transform: 'translate(-50%,-50%)', zIndex: 10,
                            color: '#f23645', textAlign: 'center', padding: '1rem',
                            maxWidth: '80%',
                        }}
                    >
                        ⚠️ {error}
                    </div>
                )}
                <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
            </div>
        </div>
    );
}
