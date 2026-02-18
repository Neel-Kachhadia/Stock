import { NextRequest, NextResponse } from 'next/server';
import { getSmartApi } from '@/lib/angel';
import { getInstrumentToken } from '@/lib/instruments';

export async function GET(request: NextRequest, { params }: { params: { symbol: string } }) {
    const symbol = params.symbol.toUpperCase();
    const searchParams = request.nextUrl.searchParams;
    const interval = searchParams.get('interval') || 'ONE_DAY';
    const range = searchParams.get('range') || '30'; // days

    try {
        const smartApi = await getSmartApi();

        // 1. Get Token
        const token = await getInstrumentToken(symbol, 'NSE');
        if (!token) {
            return NextResponse.json({ error: 'Symbol not found' }, { status: 404 });
        }

        // 2. Calculate Dates
        const toDate = new Date();
        const fromDate = new Date();
        fromDate.setDate(toDate.getDate() - parseInt(range));

        const formatDate = (date: Date) => {
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            const hh = String(date.getHours()).padStart(2, '0');
            const min = String(date.getMinutes()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
        }

        // 3. Fetch Data
        // Angel One requires specific interval strings: ONE_MINUTE, ONE_DAY, etc.
        const response = await smartApi.getCandleData({
            exchange: 'NSE',
            symboltoken: token,
            interval: interval,
            fromdate: formatDate(fromDate),
            todate: formatDate(toDate)
        });

        if (response.status && response.data) {
            // Format for Lightweight Charts
            // [timestamp, open, high, low, close, volume]
            const formattedData = response.data.map((item: any) => ({
                time: item[0].split('T')[0], // YYYY-MM-DD for daily
                open: item[1],
                high: item[2],
                low: item[3],
                close: item[4],
                volume: item[5]
            }));
            return NextResponse.json(formattedData);
        } else {
            return NextResponse.json({ error: response.message || 'Data fetch failed' }, { status: 500 });
        }

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
