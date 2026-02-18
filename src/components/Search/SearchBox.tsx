'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FaSearch } from 'react-icons/fa';

interface InstrumentResult {
    token: string;
    symbol: string;
    name: string;
    exch_seg: string;
}

interface SearchBoxProps {
    onSelect: (symbol: string) => void;
}

export default function SearchBox({ onSelect }: SearchBoxProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<InstrumentResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchResults = async () => {
            if (query.length < 2) {
                setResults([]);
                setIsOpen(false);
                return;
            }
            setLoading(true);
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                const data: InstrumentResult[] = await res.json();
                setResults(Array.isArray(data) ? data : []);
                setIsOpen(true);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchResults, 300);
        return () => clearTimeout(timeoutId);
    }, [query]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={wrapperRef} style={{ position: 'relative', marginBottom: '1rem' }}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: '6px',
                    padding: '0.5rem 0.75rem',
                    border: '1px solid var(--border-color)',
                    gap: '0.5rem',
                }}
            >
                <FaSearch color="var(--text-secondary)" size={12} />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search NSE symbol (e.g. INFY)..."
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-primary)',
                        width: '100%',
                        outline: 'none',
                        fontSize: '0.875rem',
                    }}
                    onFocus={() => results.length > 0 && setIsOpen(true)}
                />
                {loading && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>...</span>
                )}
            </div>

            {isOpen && results.length > 0 && (
                <ul
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        left: 0,
                        right: 0,
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        zIndex: 1000,
                        listStyle: 'none',
                        padding: 0,
                        margin: 0,
                        maxHeight: '240px',
                        overflowY: 'auto',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    }}
                >
                    {results.map((item) => (
                        <li
                            key={item.token}
                            onClick={() => {
                                onSelect(item.symbol);
                                setQuery(item.symbol);
                                setIsOpen(false);
                            }}
                            style={{
                                padding: '0.6rem 0.75rem',
                                cursor: 'pointer',
                                borderBottom: '1px solid var(--border-color)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                            onMouseEnter={(e) =>
                                (e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)')
                            }
                            onMouseLeave={(e) =>
                                (e.currentTarget.style.backgroundColor = 'transparent')
                            }
                        >
                            <div>
                                <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{item.symbol}</span>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                    {item.name}
                                </div>
                            </div>
                            <span
                                style={{
                                    fontSize: '0.7rem',
                                    color: 'var(--accent-color)',
                                    background: 'rgba(41,98,255,0.1)',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontWeight: 600,
                                }}
                            >
                                {item.exch_seg}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
