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
    const range = searchParams.get('range') || '30';

    try {
        const smartApi = await getSmartApi();

        const token = await getInstrumentToken(symbol, 'NSE');
        if (!token) {
            return NextResponse.json({ error: 'Symbol not found' }, { status: 404 });
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
            return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await (smartApi as any).getCandleData({
            exchange: 'NSE',
            symboltoken: token,
            interval: interval,
            fromdate: formatDate(fromDate),
            todate: formatDate(toDate),
        });

        if (response.status && response.data) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const formattedData = response.data.map((item: any) => ({
                time: item[0].split('T')[0],
                open: item[1],
                high: item[2],
                low: item[3],
                close: item[4],
                volume: item[5],
            }));
            return NextResponse.json(formattedData);
        } else {
            return NextResponse.json(
                { error: response.message || 'Data fetch failed' },
                { status: 500 }
            );
        }
    } catch (error: unknown) {
        console.error('API Error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
