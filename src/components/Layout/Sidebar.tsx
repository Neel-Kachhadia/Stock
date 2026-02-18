'use client';

import React from 'react';
import SearchBox from '@/components/Search/SearchBox';

interface SidebarProps {
    onSelectSymbol: (symbol: string) => void;
}

export default function Sidebar({ onSelectSymbol }: SidebarProps) {
    return (
        <aside className="sidebar">
            <div style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                <h3 style={{ marginBottom: '0.5rem' }}>Search</h3>
                <SearchBox onSelect={onSelectSymbol} />
            </div>

            <h3>Watchlist</h3>
            <div style={{ padding: '1rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                No symbols added.
            </div>
        </aside>
    );
}
