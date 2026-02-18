// eslint-disable-next-line @typescript-eslint/no-require-imports
const { SMA, EMA, RSI, MACD, BollingerBands } = require('technicalindicators');

interface OHLCBar {
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
}

interface TimeValue {
    time: string;
    value: number;
}

interface BollingerBar {
    time: string;
    upper: number;
    middle: number;
    lower: number;
}

interface MACDBar {
    time: string;
    MACD?: number;
    signal?: number;
    histogram?: number;
}

const getCloseValues = (data: OHLCBar[]): number[] => data.map((d) => d.close);

export const calculateSMA = (data: OHLCBar[], period: number): TimeValue[] => {
    const values: number[] = SMA.calculate({ period, values: getCloseValues(data) });
    const diff = data.length - values.length;
    return values.map((value: number, index: number) => ({
        time: data[index + diff].time,
        value,
    }));
};

export const calculateEMA = (data: OHLCBar[], period: number): TimeValue[] => {
    const values: number[] = EMA.calculate({ period, values: getCloseValues(data) });
    const diff = data.length - values.length;
    return values.map((value: number, index: number) => ({
        time: data[index + diff].time,
        value,
    }));
};

export const calculateRSI = (data: OHLCBar[], period = 14): TimeValue[] => {
    const values: number[] = RSI.calculate({ period, values: getCloseValues(data) });
    const diff = data.length - values.length;
    return values.map((value: number, index: number) => ({
        time: data[index + diff].time,
        value,
    }));
};

export const calculateMACD = (data: OHLCBar[]): MACDBar[] => {
    const values: Array<{ MACD?: number; signal?: number; histogram?: number }> = MACD.calculate({
        values: getCloseValues(data),
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        SimpleMAOscillator: false,
        SimpleMASignal: false,
    });
    const diff = data.length - values.length;
    return values.map((item, index: number) => ({
        time: data[index + diff].time,
        ...item,
    }));
};

export const calculateBollinger = (
    data: OHLCBar[],
    period = 20,
    stdDev = 2
): BollingerBar[] => {
    const values: Array<{ upper: number; middle: number; lower: number }> = BollingerBands.calculate({
        period,
        stdDev,
        values: getCloseValues(data),
    });
    const diff = data.length - values.length;
    return values.map((item, index: number) => ({
        time: data[index + diff].time,
        ...item,
    }));
};
