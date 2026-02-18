# Stock Analysis App - Indian Market

A modern stock analysis web application for NSE/BSE markets.

## Features
- Real-time OHLC candlestick charts (Angel One SmartAPI)
- Technical indicators: SMA, EMA, Bollinger Bands
- Timeframes: 1D, 1W, 1M, 1Y
- Stock symbol search (NSE/BSE)
- Dark theme, responsive UI

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.local.example` to `.env.local` and fill in your Angel One credentials
4. Run development server: `npm run dev`

## Environment Variables

```
NEXT_PUBLIC_ANGEL_API_KEY=your_api_key
ANGEL_CLIENT_CODE=your_client_code
ANGEL_CLIENT_PIN=your_pin
ANGEL_TOTP_KEY=your_totp_secret
```

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

Set the environment variables in your Vercel project settings.

## Tech Stack
- Next.js 16 (App Router)
- Lightweight Charts (TradingView)
- TechnicalIndicators.js
- Angel One SmartAPI
