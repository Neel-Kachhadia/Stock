'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, ColorType, ISeriesApi, Time } from 'lightweight-charts';

interface ChartComponentProps {
    symbol: string;
}

const TIMEFRAMES = [
    { label: '1D', interval: 'FIVE_MINUTE', range: '1' },
    { label: '1W', interval: 'FIFTEEN_MINUTE', range: '7' },
    { label: '1M', interval: 'ONE_HOUR', range: '30' },
    { label: '1Y', interval: 'ONE_DAY', range: '365' },
];

export default function ChartComponent({ symbol }: ChartComponentProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<any>(null);
    const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTimeframe, setActiveTimeframe] = useState(TIMEFRAMES[3]); // Default 1Y

    // Fetch Data
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/stock/${symbol}?interval=${activeTimeframe.interval}&range=${activeTimeframe.range}`);
            const result = await response.json();

            if (response.ok) {
                const sortedData = result.sort((a: any, b: any) => new Date(a.time).getTime() - new Date(b.time).getTime());
                // Unique check
                const uniqueData = sortedData.filter((v: any, i: any, a: any) => a.findIndex((t: any) => (t.time === v.time)) === i);
                setData(uniqueData);
            } else {
                setError(result.error || 'Failed to fetch data');
                setData([]);
            }
        } catch (err) {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    }, [symbol, activeTimeframe]);

    useEffect(() => {
        if (symbol) {
            fetchData();
        }
    }, [fetchData]);

    // Initialize Chart logic (same as before but memoized chart creation to avoid dupes if strict mode)
    useEffect(() => {
        if (!chartContainerRef.current) return;

        // cleanup previous chart
        if (chartRef.current) {
            chartRef.current.remove();
        }

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
            rightPriceScale: {
                borderColor: '#363a45',
            }
        });

        const candlestickSeries = chart.addCandlestickSeries({
            upColor: '#089981',
            downColor: '#f23645',
            borderVisible: false,
            wickUpColor: '#089981',
            wickDownColor: '#f23645',
        });

        seriesRef.current = candlestickSeries;
        chartRef.current = chart;

        const handleResize = () => {
            if (chartContainerRef.current) {
                chart.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, []); // Run once on mount (or when container ref changes, effectively)

    // Update Data
    useEffect(() => {
        if (seriesRef.current && data.length > 0) {
            seriesRef.current.setData(data);
            chartRef.current?.timeScale().fitContent();
        }
    }, [data]);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>

            {/* Toolbar */}
            <div style={{
                padding: '0.5rem 1rem',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'center',
                backgroundColor: 'var(--bg-secondary)'
            }}>
                <span style={{ fontWeight: 'bold', marginRight: '1rem' }}>{symbol}</span>
                {TIMEFRAMES.map((tf) => (
                    <button
                        key={tf.label}
                        onClick={() => setActiveTimeframe(tf)}
                        style={{
                            background: activeTimeframe.label === tf.label ? 'var(--accent-color)' : 'transparent',
                            color: activeTimeframe.label === tf.label ? 'white' : 'var(--text-secondary)',
                            border: 'none',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 500
                        }}
                    >
                        {tf.label}
                    </button>
                ))}
                {loading && <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: 'auto' }}>Updating...</span>}
            </div>

            <div style={{ position: 'relative', flex: 1 }}>
                {loading && data.length === 0 && <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 10,
                    color: '#d1d4dc'
                }}>Loading data...</div>}

                {error && <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 10,
                    color: '#f23645'
                }}>{error}</div>}

                <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
            </div>
        </div>
    );
}
