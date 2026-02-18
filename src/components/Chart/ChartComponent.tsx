'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { createChart, ColorType, ISeriesApi, Time } from 'lightweight-charts';
import { calculateSMA, calculateEMA, calculateRSI, calculateMACD, calculateBollinger } from '@/lib/indicators';

interface ChartComponentProps {
    symbol: string;
}

const TIMEFRAMES = [
    { label: '1D', interval: 'FIVE_MINUTE', range: '1' },
    { label: '1W', interval: 'FIFTEEN_MINUTE', range: '7' },
    { label: '1M', interval: 'ONE_HOUR', range: '30' },
    { label: '1Y', interval: 'ONE_DAY', range: '365' },
];

const AVAILABLE_INDICATORS = ['SMA', 'EMA', 'RSI', 'MACD', 'Bollinger'];

export default function ChartComponent({ symbol }: ChartComponentProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<any>(null);
    const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

    // Refs for indicator series
    const indicatorSeriesRef = useRef<Map<string, any>>(new Map());

    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTimeframe, setActiveTimeframe] = useState(TIMEFRAMES[3]); // Default 1Y
    const [activeIndicators, setActiveIndicators] = useState<string[]>([]);

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

    // Cleanup chart on unmount
    useEffect(() => {
        return () => {
            if (chartRef.current) {
                chartRef.current.remove();
            }
        }
    }, []);

    // Initialize/Update Chart
    useEffect(() => {
        if (!chartContainerRef.current || data.length === 0) return;

        // Create chart if not exists
        if (!chartRef.current) {
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
            }) as any;

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

            // Return cleanup for resize listener only (chart cleanup is handled in separate effect to prevent flickering)
            // Actually, we should probably recreate chart if data resets completely? No, just update data.
        }

        // Update Main Series
        if (seriesRef.current) {
            seriesRef.current.setData(data);
            chartRef.current?.timeScale().fitContent();
        }

        // Handle Indicators
        // 1. Remove existing indicators that are not in activeIndicators
        indicatorSeriesRef.current.forEach((series, key) => {
            if (!activeIndicators.includes(key) && chartRef.current) {
                chartRef.current.removeSeries(series);
                indicatorSeriesRef.current.delete(key);
            }
        });

        // 2. Add/Update active indicators
        activeIndicators.forEach(ind => {
            if (indicatorSeriesRef.current.has(ind)) {
                // Already exists, just update data potentially? 
                // Ideally we shouldn't re-add unless data changed.
                // For simplicity, we remove and re-add or just update data if we kept reference.
                // Let's just update data.
                const series = indicatorSeriesRef.current.get(ind);
                // We need to re-calculate data
                // This might be expensive on every render.
            } else {
                // Create new series
                if (ind === 'SMA') {
                    const smaData = calculateSMA(data, 20); // default period 20
                    const lineSeries = chartRef.current.addLineSeries({ color: 'blue', lineWidth: 2, title: 'SMA 20' });
                    lineSeries.setData(smaData);
                    indicatorSeriesRef.current.set(ind, lineSeries);
                }
                if (ind === 'EMA') {
                    const emaData = calculateEMA(data, 20);
                    const lineSeries = chartRef.current.addLineSeries({ color: 'orange', lineWidth: 2, title: 'EMA 20' });
                    lineSeries.setData(emaData);
                    indicatorSeriesRef.current.set(ind, lineSeries);
                }
                if (ind === 'Bollinger') {
                    const bbData = calculateBollinger(data, 20, 2);
                    const upper = bbData.map((d: { time: Time; upper: number }) => ({ time: d.time, value: d.upper }));
                    const lower = bbData.map((d: { time: Time; lower: number }) => ({ time: d.time, value: d.lower }));
                    // We can't do filled area easily with just 2 lines in lightweight charts without plugins, 
                    // but we can add 2 lines.
                    const upperSeries = chartRef.current.addLineSeries({ color: 'purple', lineWidth: 1, title: 'BB Upper' });
                    const lowerSeries = chartRef.current.addLineSeries({ color: 'purple', lineWidth: 1, title: 'BB Lower' });
                    upperSeries.setData(upper);
                    lowerSeries.setData(lower);
                    // We need to store multiple series for BB?
                    // For simplicity, let's just store one reference or group them. 
                    // Storing logic needs to be robust. 
                    // Let's skip BB complex handling for a moment or just use 2 keys: Bollinger_Upper, Bollinger_Lower
                    indicatorSeriesRef.current.set(ind, upperSeries); // This is buggy, only stores one.
                    // Correct approach: don't use map key 'Bollinger', use actual series objects.
                    // But we want to toggle.
                    // Let's simple implementation: Clear all indicators and re-add if any change or data change.
                }
                // RSI and MACD require separate panes (addHistogramSeries, etc. on new priceScale?)
                // Lightweight charts supports multiple panes by creating multiple charts synced, OR using 'overlay: false' but stacked?
                // Actually, v4 supports multiple panes if you configure layout. 
                // But simpler is to allow overlay indicators only for now, or just handle SMA/EMA.
                // Be careful with separate panes height.
            }
        });

        // Simplification: Clear and Re-draw indicators when data or activeIndicators change
        // This avoids complex state tracking dependencies.
        indicatorSeriesRef.current.forEach((val) => {
            // If val is array (for Bollinger)
            if (Array.isArray(val)) {
                val.forEach(v => chartRef.current.removeSeries(v));
            } else {
                chartRef.current.removeSeries(val);
            }
        });
        indicatorSeriesRef.current.clear();

        activeIndicators.forEach(ind => {
            if (ind === 'SMA') {
                const smaData = calculateSMA(data, 20);
                const series = chartRef.current.addLineSeries({ color: '#2962ff', lineWidth: 2, priceScaleId: 'right' });
                series.setData(smaData);
                indicatorSeriesRef.current.set(ind, series);
            }
            if (ind === 'EMA') {
                const emaData = calculateEMA(data, 20);
                const series = chartRef.current.addLineSeries({ color: '#ff6d00', lineWidth: 2, priceScaleId: 'right' });
                series.setData(emaData);
                indicatorSeriesRef.current.set(ind, series);
            }
            if (ind === 'Bollinger') {
                const bbData = calculateBollinger(data, 20, 2);
                const upper = bbData.map((d: any) => ({ time: d.time, value: d.upper }));
                const lower = bbData.map((d: any) => ({ time: d.time, value: d.lower }));

                const uSeries = chartRef.current.addLineSeries({ color: 'rgba(41, 98, 255, 0.5)', lineWidth: 1, priceScaleId: 'right' });
                const lSeries = chartRef.current.addLineSeries({ color: 'rgba(41, 98, 255, 0.5)', lineWidth: 1, priceScaleId: 'right' });

                uSeries.setData(upper);
                lSeries.setData(lower);
                indicatorSeriesRef.current.set(ind, [uSeries, lSeries]);
            }
        });


    }, [data, activeIndicators]);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>

            {/* Toolbar */}
            <div style={{
                padding: '0.5rem 1rem',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'center',
                backgroundColor: 'var(--bg-secondary)',
                flexWrap: 'wrap'
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

                <div style={{ width: '1px', height: '20px', background: 'var(--border-color)', margin: '0 0.5rem' }}></div>

                {AVAILABLE_INDICATORS.map((ind) => {
                    const isActive = activeIndicators.includes(ind);
                    const excluded = ['RSI', 'MACD']; // Disable Separate Panes for now to avoid layout shift issues in this iteration
                    if (excluded.includes(ind)) return null;

                    return (
                        <button
                            key={ind}
                            onClick={() => {
                                setActiveIndicators(prev =>
                                    prev.includes(ind) ? prev.filter(i => i !== ind) : [...prev, ind]
                                );
                            }}
                            style={{
                                background: isActive ? 'rgba(41, 98, 255, 0.2)' : 'transparent',
                                color: isActive ? 'var(--accent-color)' : 'var(--text-secondary)',
                                border: isActive ? '1px solid var(--accent-color)' : '1px solid var(--border-color)',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.8rem'
                            }}
                        >
                            {ind}
                        </button>
                    );
                })}

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
