const axios = require('axios');
const btoa = (str) => Buffer.from(str).toString('base64');

// Credentials
const CLIENT_ID = 'M23XI8B0ZDX0K_2601271403';
const CLIENT_SECRET = 'NjZmNDhiNzYtNmU1My00NGQ2LWJjMzgtZGY2MDZmOTcxOWE3';
const CLIENT_VERSION = 1;

// Endpoints
const BASE_URL = 'https://api-preprod.phonepe.com/apis/pg-sandbox';
const AUTH_ENDPOINT = '/v1/oauth/token';
const PAY_ENDPOINT = '/checkout/v2/pay';

async function testPaymentV2() {
    console.log("Starting PhonePe V2 Payment Test...");

    // Step 1: Get Access Token
    let accessToken = '';
    try {
        console.log("Step 1: Authenticating...");
        const authData = new URLSearchParams();
        authData.append('grant_type', 'client_credentials');
        authData.append('client_id', CLIENT_ID);
        authData.append('client_version', CLIENT_VERSION);
        authData.append('client_secret', CLIENT_SECRET);

        const authHeader = `Basic ${btoa(CLIENT_ID + ':' + CLIENT_SECRET)}`;

        const authRes = await axios.post(`${BASE_URL}${AUTH_ENDPOINT}`, authData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': authHeader
            }
        });
        accessToken = authRes.data.access_token;
        console.log("Auth Success.");

    } catch (error) {
        console.error("Auth Failed:", error.response?.data || error.message);
        return;
    }

    // Step 2: Create Payment Order
    try {
        console.log("\nStep 2: Creating Payment Order...");

        const transactionId = "TXN_" + Date.now();
        const payload = {
            merchantId: 'M23XI8B0ZDX0K',
            merchantOrderId: transactionId,
            merchantUserId: 'USER_' + Date.now(),
            amount: 19900,
            // redirectUrl REMOVED
            // redirectMode REMOVED
            callbackUrl: "https://www.google.com",
            mobileNumber: "9999999999",
            paymentInstrument: {
                type: "PAY_PAGE",
                targetApp: "WEB"
            },
            deviceContext: {
                deviceOS: "ANDROID"
            }
        };

        const payRes = await axios.post(`${BASE_URL}${PAY_ENDPOINT}`, payload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `O-Bearer ${accessToken}`
            }
        });

        console.log("Payment Creation Success!");
        console.log("Response Data:", JSON.stringify(payRes.data, null, 2));
        console.log("Response Headers:", JSON.stringify(payRes.headers, null, 2));

    } catch (error) {
        console.error("Payment Creation Failed:", error.response?.data || error.message);
        if (error.response?.data) {
            console.log("Full Error Data:", JSON.stringify(error.response.data, null, 2));
        }
    }
}

testPaymentV2();
