import { SMA, EMA, RSI, MACD, BollingerBands } from 'technicalindicators';

// Helper to extract values from data for technicalindicators library
const getCloseValues = (data: any[]) => data.map((d) => d.close);
const getHighValues = (data: any[]) => data.map((d) => d.high);
const getLowValues = (data: any[]) => data.map((d) => d.low);

export const calculateSMA = (data: any[], period: number) => {
    const closeValues = getCloseValues(data);
    const sma = SMA.calculate({ period, values: closeValues });
    // TechnicalIndicators returns array of values. We need to align them with time.
    // The first (period-1) values will be empty/undefined in the output.
    // We align by slicing the original data from index = (data.length - sma.length)

    const diff = data.length - sma.length;
    return sma.map((value, index) => ({
        time: data[index + diff].time,
        value,
    }));
};

export const calculateEMA = (data: any[], period: number) => {
    const closeValues = getCloseValues(data);
    const ema = EMA.calculate({ period, values: closeValues });

    const diff = data.length - ema.length;
    return ema.map((value, index) => ({
        time: data[index + diff].time,
        value,
    }));
};

export const calculateRSI = (data: any[], period: number = 14) => {
    const closeValues = getCloseValues(data);
    const rsi = RSI.calculate({ period, values: closeValues });

    const diff = data.length - rsi.length;
    return rsi.map((value, index) => ({
        time: data[index + diff].time,
        value,
    }));
};

export const calculateMACD = (data: any[]) => {
    const closeValues = getCloseValues(data);
    // Default: fast 12, slow 26, signal 9
    const macd = MACD.calculate({
        values: closeValues,
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        SimpleMAOscillator: false,
        SimpleMASignal: false,
    });

    const diff = data.length - macd.length;
    return macd.map((item, index) => ({
        time: data[index + diff].time,
        ...item, // returns {MACD, signal, histogram}
    }));
};

export const calculateBollinger = (data: any[], period: number = 20, stdDev: number = 2) => {
    const closeValues = getCloseValues(data);
    const bb = BollingerBands.calculate({ period, stdDev, values: closeValues });

    const diff = data.length - bb.length;
    return bb.map((item, index) => ({
        time: data[index + diff].time,
        ...item // {middle, upper, lower}
    }));
}
