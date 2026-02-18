'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FaSearch } from 'react-icons/fa';

interface SearchBoxProps {
    onSelect: (symbol: string) => void;
}

export default function SearchBox({ onSelect }: SearchBoxProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchResults = async () => {
            if (query.length < 2) {
                setResults([]);
                return;
            }
            try {
                const res = await fetch(`/api/search?q=${query}`);
                const data = await res.json();
                setResults(data);
                setIsOpen(true);
            } catch (err) {
                console.error(err);
            }
        };

        const timeoutId = setTimeout(fetchResults, 300);
        return () => clearTimeout(timeoutId);
    }, [query]);

    // Click outside to close
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    return (
        <div ref={wrapperRef} style={{ position: 'relative', marginBottom: '1rem' }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: '4px',
                padding: '0.5rem',
                border: '1px solid var(--border-color)'
            }}>
                <FaSearch color="var(--text-secondary)" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search Symbol (e.g. INFOSYS)..."
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-primary)',
                        marginLeft: '0.5rem',
                        width: '100%',
                        outline: 'none'
                    }}
                    onFocus={() => setIsOpen(true)}
                />
            </div>

            {isOpen && results.length > 0 && (
                <ul style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    marginTop: '4px',
                    zIndex: 100,
                    listStyle: 'none',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                }}>
                    {results.map((item: any) => (
                        <li
                            key={item.token}
                            onClick={() => {
                                onSelect(item.symbol);
                                setQuery('');
                                setIsOpen(false);
                            }}
                            style={{
                                padding: '0.5rem',
                                cursor: 'pointer',
                                borderBottom: '1px solid var(--border-color)',
                                display: 'flex',
                                justifyContent: 'space-between'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <span style={{ fontWeight: 'bold' }}>{item.symbol}</span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{item.exch_seg}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
