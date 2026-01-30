const axios = require('axios');
const btoa = (str) => Buffer.from(str).toString('base64');

// Credentials
// const CLIENT_ID = 'M23XI8B0ZDX0K_2601271403'; // Extracted from USER env but USER provided snippet used this so relying on it.
// Actually let's use the USER's snippet logic: Access Token auth, no Salt.
const CLIENT_ID = 'M23XI8B0ZDX0K_2601271403';
const CLIENT_SECRET = 'NjZmNDhiNzYtNmU1My00NGQ2LWJjMzgtZGY2MDZmOTcxOWE3';
const CLIENT_VERSION = 1;
const HOST = 'https://api-preprod.phonepe.com/apis/pg-sandbox';

async function testConfig(name, payloadOverrides) {
    console.log(`\n--- Testing Config: ${name} ---`);
    console.log("Overrides:", JSON.stringify(payloadOverrides, null, 2));

    try {
        // 1. Auth
        const authData = new URLSearchParams();
        authData.append('grant_type', 'client_credentials');
        authData.append('client_id', CLIENT_ID);
        authData.append('client_version', CLIENT_VERSION);
        authData.append('client_secret', CLIENT_SECRET);
        const authHeader = `Basic ${btoa(CLIENT_ID + ':' + CLIENT_SECRET)}`;

        const authRes = await axios.post(`${HOST}/v1/oauth/token`, authData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': authHeader }
        });
        const accessToken = authRes.data.access_token;

        // 2. Pay
        const transactionId = "TXN_" + Date.now();
        const basePayload = {
            merchantId: 'M23XI8B0ZDX0K',
            merchantOrderId: transactionId,
            merchantUserId: 'USER_' + Date.now(),
            amount: 19900,
            callbackUrl: "https://www.google.com",
            mobileNumber: "9999999999",
            paymentInstrument: { type: "PAY_PAGE", targetApp: "WEB" },
            deviceContext: { deviceOS: "ANDROID" }
        };

        const payload = { ...basePayload, ...payloadOverrides };

        const payRes = await axios.post(`${HOST}/checkout/v2/pay`, payload, {
            headers: { 'Content-Type': 'application/json', 'Authorization': `O-Bearer ${accessToken}` }
        });

        console.log("Success Response Data:", JSON.stringify(payRes.data, null, 2));

        if (payRes.data?.data?.instrumentResponse?.redirectInfo?.url) {
            console.log(">>> GOT REDIRECT URL:", payRes.data.data.instrumentResponse.redirectInfo.url);
        } else if (payRes.data?.redirectUrl) {
            console.log(">>> GOT RESPONSE REDIRECT URL (Likely completion):", payRes.data.redirectUrl);
        } else {
            console.log(">>> NO URL FOUND in standard paths.");
        }

    } catch (e) {
        console.error("Error:", e.response?.data || e.message);
    }
}

async function runTests() {
    // Test 1: With redirectUrl, NO redirectMode
    await testConfig("With RedirectUrl, No Mode", {
        redirectUrl: "https://www.google.com"
    });

    // Test 2: With redirectUrl, With redirectMode: REDIRECT (This failed before?)
    await testConfig("With RedirectUrl + Mode: REDIRECT", {
        redirectUrl: "https://www.google.com",
        redirectMode: "REDIRECT"
    });

    // Test 3: With redirectUrl, With redirectMode: POST
    await testConfig("With RedirectUrl + Mode: POST", {
        redirectUrl: "https://www.google.com",
        redirectMode: "POST"
    });
}

runTests();
