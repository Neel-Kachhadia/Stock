import { authenticator } from 'otplib';

const API_KEY = process.env.NEXT_PUBLIC_ANGEL_API_KEY;
const CLIENT_CODE = process.env.ANGEL_CLIENT_CODE;
const CLIENT_PIN = process.env.ANGEL_CLIENT_PIN;
const TOTP_KEY = process.env.ANGEL_TOTP_KEY;

let smartApiInstance: any = null;

export const getSmartApi = async () => {
    if (smartApiInstance) return smartApiInstance;

    const { SmartAPI } = await import('smartapi-javascript');

    if (!CLIENT_CODE || !CLIENT_PIN || !TOTP_KEY) {
        throw new Error('Angel One credentials missing in Vercel env');
    }

    // ✅ CORRECT FOR OTLIB v13+
    authenticator.setOptions({ window: 1 });

    const totp = authenticator.generate(TOTP_KEY);

    const smart_api = new SmartAPI({
        api_key: API_KEY,
    });

    try {
        const data = await smart_api.generateSession(
            CLIENT_CODE,
            CLIENT_PIN,
            totp
        );

        if (data.status) {
            smartApiInstance = smart_api;
            return smartApiInstance;
        }

        throw new Error(data.message || 'Login failed');
    } catch (error) {
        console.error('Angel One Login Error:', error);
        throw error;
    }
};
