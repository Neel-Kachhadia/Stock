import { NextRequest, NextResponse } from 'next/server';
import { getSmartApi } from '@/lib/angel';
import { getInstrumentToken } from '@/lib/instruments';

type RouteContext = {
    params: Promise<{ symbol: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
    const { symbol: rawSymbol } = await context.params;
    const symbol = rawSymbol.toUpperCase();

    const searchParams = request.nextUrl.searchParams;
    const interval = searchParams.get('interval') || 'ONE_DAY';
    const range = searchParams.get('range') || '365';

    try {
        const smartApi: any = await getSmartApi();

        const token = await getInstrumentToken(symbol, 'NSE');
        if (!token) {
            return NextResponse.json(
                { error: `Symbol '${symbol}' not found on NSE.` },
                { status: 404 }
            );
        }

        const toDate = new Date();
        const fromDate = new Date();
        fromDate.setDate(toDate.getDate() - parseInt(range));

        const formatDate = (date: Date) => {
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            const hh = String(date.getHours()).padStart(2, '0');
            const min = String(date.getMinutes()).padStart(2, '0');
            const ss = String(date.getSeconds()).padStart(2, '0');

            return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
        };

        const response = await smartApi.getCandleData({
            exchange: 'NSE',
            symboltoken: token,
            interval,
            fromdate: formatDate(fromDate),
            todate: formatDate(toDate),
        });

        if (response?.data && Array.isArray(response.data)) {
            const formattedData = response.data.map((item: any) => ({
                time: item[0], // ✅ FULL TIMESTAMP
                open: item[1],
                high: item[2],
                low: item[3],
                close: item[4],
                volume: item[5],
            }));

            return NextResponse.json(formattedData);
        }

        return NextResponse.json(
            { error: response?.message || 'Angel One returned no data.' },
            { status: 500 }
        );
    } catch (error: unknown) {
        console.error('Angel One API Error:', error);

        const message =
            error instanceof Error ? error.message : 'Unknown SmartAPI error';

        return NextResponse.json({ error: message }, { status: 500 });
    }
}
