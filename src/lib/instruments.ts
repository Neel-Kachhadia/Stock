/* eslint-disable @typescript-eslint/no-explicit-any */
const ONE_SCRIP_MASTER_URL =
    'https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json';

let instrumentsCache: any[] = [];

export const loadInstruments = async () => {
    if (instrumentsCache.length > 0) return instrumentsCache;

    try {
        console.log('Fetching Angel One Scrip Master...');
        const response = await fetch(ONE_SCRIP_MASTER_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        instrumentsCache = await response.json();
        console.log(`Loaded ${instrumentsCache.length} instruments.`);
        return instrumentsCache;
    } catch (error) {
        console.error('Failed to load instruments:', error);
        return [];
    }
};

// In Angel One scrip master:
//   item.name  = clean ticker (e.g. "MARUTI", "RELIANCE")
//   item.symbol = exchange-specific code (e.g. "MARUTI-EQ", "RELIANCE-EQ")
//   item.token  = numeric token used for data fetch
//   item.exch_seg = "NSE" | "BSE" | "NFO" etc.

export const getInstrumentToken = async (
    name: string,
    exchange = 'NSE'
): Promise<string | null> => {
    const instruments = await loadInstruments();
    const instrument = instruments.find(
        (item: any) =>
            item.name === name &&
            item.exch_seg === exchange &&
            item.instrumenttype === 'EQ' // equity only
    );
    return instrument ? instrument.token : null;
};

export const searchInstruments = async (query: string) => {
    const instruments = await loadInstruments();
    const lower = query.toLowerCase();

    return instruments
        .filter(
            (item: any) =>
                (item.exch_seg === 'NSE' || item.exch_seg === 'BSE') &&
                item.instrumenttype === 'EQ' &&
                (item.name.toLowerCase().includes(lower) ||
                    item.symbol.toLowerCase().includes(lower))
        )
        .slice(0, 12)
        .map((item: any) => ({
            token: item.token,
            // Return `name` as the symbol — this is what we pass to the API route
            symbol: item.name,
            // Keep the full exchange symbol for display
            tradingSymbol: item.symbol,
            name: item.name,
            exch_seg: item.exch_seg,
        }));
};
