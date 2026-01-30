const axios = require('axios');
const crypto = require('crypto');

// Constants (Sandbox Defaults)
const MERCHANT_ID = 'PGTESTPAYUAT';
const SALT_KEY = '099eb0cd-02cf-4e2a-8aca-3e6c6aff0399';
const SALT_INDEX = 1;
const HOST = 'https://api-preprod.phonepe.com/apis/hermes';

async function testPayment() {
    console.log("Starting Payment Test...");

    const transactionId = "TXN_" + Date.now();
    const payload = {
        merchantId: MERCHANT_ID,
        merchantTransactionId: transactionId,
        merchantUserId: 'MUID_' + Date.now(),
        amount: 19900, // ₹199.00
        redirectUrl: `https://www.google.com`, // Valid HTTPS
        redirectMode: "REDIRECT",
        callbackUrl: `https://www.google.com`, // Valid HTTPS
        mobileNumber: "9999999999",
        paymentInstrument: {
            type: "PAY_PAGE"
        }
    };

    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');

    // VARIATION 1: Standard
    const path1 = "/pg/v1/pay";
    const xVerify1 = crypto.createHash('sha256').update(base64Payload + path1 + SALT_KEY).digest('hex') + "###" + SALT_INDEX;

    // VARIATION 2: Full Path (Sandbox specific)
    const path2 = "/apis/pg-sandbox/pg/v1/pay";
    const xVerify2 = crypto.createHash('sha256').update(base64Payload + path2 + SALT_KEY).digest('hex') + "###" + SALT_INDEX;

    console.log("Testing with PGTESTPAYUAT defaults...");

    try {
        console.log("Attempt 1: Standard Path (/pg/v1/pay)");
        const r1 = await axios.post(
            `${HOST}/pg/v1/pay`,
            { request: base64Payload },
            { headers: { 'Content-Type': 'application/json', 'X-VERIFY': xVerify1, 'X-MERCHANT-ID': MERCHANT_ID } }
        );
        console.log("Success 1:", r1.data);
    } catch (e) {
        console.log("Fail 1:", e.response?.data || e.message);
    }

    try {
        console.log("Attempt 2: Full Path (/apis/pg-sandbox/pg/v1/pay)");
        const r2 = await axios.post(
            `${HOST}/pg/v1/pay`,
            { request: base64Payload },
            { headers: { 'Content-Type': 'application/json', 'X-VERIFY': xVerify2, 'X-MERCHANT-ID': MERCHANT_ID } }
        );
        console.log("Success 2:", r2.data);
    } catch (e) {
        console.log("Fail 2:", e.response?.data || e.message);
    }
}

testPayment();
