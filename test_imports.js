try {
    console.log('Testing otplib...');
    const otplib = require('otplib');
    console.log('otplib loaded:', !!otplib);

    console.log('Testing smartapi-javascript...');
    const SmartAPI = require('smartapi-javascript');
    console.log('smartapi-javascript loaded:', !!SmartAPI);
} catch (e) {
    console.error('Import Error:', e);
}
