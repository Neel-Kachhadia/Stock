'use client';

import React, { useState } from 'react';
import Layout from '@/components/Layout/Layout';
import Header from '@/components/Layout/Header';
import Sidebar from '@/components/Layout/Sidebar';
import ChartComponent from '@/components/Chart/ChartComponent';

export default function Home() {
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  return (
    <Layout>
      <Header />
      <div className="main-content">
        <Sidebar onSelectSymbol={setSelectedSymbol} />
        <main className="chart-area">
          {selectedSymbol ? (
            <ChartComponent symbol={selectedSymbol} />
          ) : (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              color: 'var(--text-secondary)',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <div style={{ fontSize: '1.2rem' }}>Welcome to TradeX India</div>
              <div>Search and select a stock to view its chart</div>
            </div>
          )}
        </main>
      </div>
    </Layout>
  );
}
