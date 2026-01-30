const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Credentials (Hardcoded for debugging)
const CLIENT_ID = 'M23XI8B0ZDX0K_2601271403';
const CLIENT_SECRET = 'NjZmNDhiNzYtNmU1My00NGQ2LWJjMzgtZGY2MDZmOTcxOWE3';
const MERCHANT_ID = 'M23XI8B0ZDX0K';
const CLIENT_VERSION = 1;

const HOST = 'https://api-preprod.phonepe.com/apis/pg-sandbox';

async function testStatusCheck() {
    console.log("Starting Status Check Test...");

    // 1. Auth
    let accessToken = '';
    try {
        console.log("1. Authenticating...");
        const authData = new URLSearchParams();
        authData.append('grant_type', 'client_credentials');
        authData.append('client_id', CLIENT_ID);
        authData.append('client_version', CLIENT_VERSION);
        authData.append('client_secret', CLIENT_SECRET);

        const authHeader = `Basic ${Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')}`;

        const authRes = await axios.post(`${HOST}/v1/oauth/token`, authData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': authHeader
            }
        });
        accessToken = authRes.data.access_token;
        console.log("Auth Success.");
    } catch (e) {
        console.error("Auth Failed:", e.response?.data || e.message);
        return;
    }

    // 2. Create Order (to have something to check)
    const transactionId = "TXN_" + Date.now();
    try {
        console.log(`2. Creating Order ${transactionId}...`);
        const payload = {
            merchantId: MERCHANT_ID,
            merchantOrderId: transactionId,
            merchantUserId: 'USER_' + Date.now(),
            amount: 19900,
            redirectUrl: "https://www.google.com",
            redirectMode: "REDIRECT",
            callbackUrl: "https://www.google.com",
            mobileNumber: "9999999999",
            paymentInstrument: { type: "PAY_PAGE" },
            deviceContext: { deviceOS: "ANDROID" }
        };

        await axios.post(`${HOST}/checkout/v2/pay`, payload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `O-Bearer ${accessToken}`
            }
        });
        console.log("Order Created.");
    } catch (e) {
        console.error("Create Order Failed:", e.response?.data || e.message);
        return;
    }

    // 3. Check Status
    try {
        console.log(`3. Checking Status for ${transactionId}...`);
        const statusRes = await axios.get(
            `${HOST}/checkout/v2/order/${transactionId}/status`,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `O-Bearer ${accessToken}`
                }
            }
        );
        console.log("Status Check Success:", JSON.stringify(statusRes.data, null, 2));
    } catch (e) {
        console.error("Status Check Failed:", e.response?.data || e.message);
        if (e.response?.data) {
            console.log("Full Error:", JSON.stringify(e.response.data, null, 2));
        }
    }
}

testStatusCheck();
