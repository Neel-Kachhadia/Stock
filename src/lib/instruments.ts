import axios from 'axios';

let instrumentsCache: any[] = [];

// URL for Angel One Scrip Master
const ONE_SCRIP_MASTER_URL = 'https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json';

export const loadInstruments = async () => {
    if (instrumentsCache.length > 0) return instrumentsCache;

    try {
        console.log('Fetching Scrip Master...');
        const response = await axios.get(ONE_SCRIP_MASTER_URL);
        instrumentsCache = response.data;
        console.log(`Loaded ${instrumentsCache.length} instruments.`);
        return instrumentsCache;
    } catch (error) {
        console.error('Failed to load instruments:', error);
        return [];
    }
};

export const getInstrumentToken = async (symbol: string, exchange: string = 'NSE') => {
    const instruments = await loadInstruments();
    const instrument = instruments.find(
        (item: any) => item.symbol === symbol && item.exch_seg === exchange && item.name === symbol
    );
    return instrument ? instrument.token : null;
};

export const searchInstruments = async (query: string) => {
    const instruments = await loadInstruments();
    const lowerQuery = query.toLowerCase();

    // Filter for Equity instruments on NSE/BSE to keep it relevant
    // Adjust filter as needed for F&O etc.
    return instruments
        .filter((item: any) =>
            (item.exch_seg === 'NSE' || item.exch_seg === 'BSE') &&
            item.symbol.toLowerCase().includes(lowerQuery) &&
            item.name.toLowerCase().includes(lowerQuery)
        )
        .slice(0, 10); // Limit results
};
