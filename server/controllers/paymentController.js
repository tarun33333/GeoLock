const axios = require('axios');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User'); // Import User model

// PhonePe Credentials (Sandbox/Test)
// MERCHANT_ID: PGTESTPAYUAT
// SALT_KEY: 099eb0cd-02cf-4e2a-8aca-3e6c6aff0399
// SALT_INDEX: 1
// HOST: https://api-preprod.phonepe.com/apis/pg-sandbox

const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID || 'M23XI8B0ZDX0K'; // Extracted ID
const CLIENT_ID = process.env.PHONEPE_CLIENT_ID || 'M23XI8B0ZDX0K_2601271403';
const CLIENT_SECRET = process.env.PHONEPE_CLIENT_SECRET || 'NjZmNDhiNzYtNmU1My00NGQ2LWJjMzgtZGY2MDZmOTcxOWE3';
const CLIENT_VERSION = process.env.PHONEPE_CLIENT_VERSION || 1;
const HOST = process.env.PHONEPE_HOST || 'https://api-preprod.phonepe.com/apis/pg-sandbox';

// Helper to get Access Token
const getAccessToken = async () => {
  try {
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
    return authRes.data.access_token;
  } catch (error) {
    console.error("Auth Error:", error.response?.data || error.message);
    throw new Error("Authentication failed");
  }
};

// @desc    Create Pay Order (PhonePe V2 OAuth + Checkout)
// @route   POST /api/subscribe/create-order
exports.createOrder = async (req, res) => {
  try {
    const { plan } = req.body;
    let amount = 0;

    if (plan === 'pro') amount = 19900; // ₹199.00
    else if (plan === 'business') amount = 49900; // ₹499.00
    else return res.status(400).json({ error: 'Invalid plan' });

    // Format: TXN_USERID_TIMESTAMP (Double underscore separator to easily split)
    const transactionId = "TXN__" + req.user.id + "__" + Date.now();
    // Redirect URL after payment
    const redirectUrl = `http://localhost:5173/payment-success?tid=${transactionId}`;
    // Webhook URL
    const callbackUrl = process.env.PAYMENT_CALLBACK_URL || `https://www.google.com`;

    // Step 1: Get Access Token
    console.log("Authenticating with PhonePe V2...");
    const accessToken = await getAccessToken();
    console.log("Auth Success. Token retrieved.");

    // Step 2: Create Payment Order
    const payload = {
      merchantId: MERCHANT_ID,
      merchantOrderId: transactionId,
      merchantUserId: 'USER_' + req.user.id,
      amount: amount,
      // redirectUrl: redirectUrl, // Removed to force link generation in Sandbox
      // redirectMode: "REDIRECT",
      callbackUrl: callbackUrl,
      mobileNumber: "9999999999",
      paymentInstrument: {
        type: "PAY_PAGE",
        targetApp: "WEB"
      },
      deviceContext: {
        deviceOS: "ANDROID"
      }
    };

    console.log("Initiating V2 Payment...");
    const payRes = await axios.post(`${HOST}/checkout/v2/pay`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `O-Bearer ${accessToken}`
      }
    });

    // Check Response
    // Note: Success response structure differs slightly based on debug output?
    // Debug output: { "orderId": "...", "state": "PENDING", ... "redirectUrl": "..." }
    // Let's inspect the structure returned by debug script:
    // It seems 'data' wrapper might be missing or different?
    // Debug script logged: Response: { ... }
    // Wait, debug script used: console.log("Response:", JSON.stringify(payRes.data, null, 2));
    // And output was directly the object with orderId. So payRes.data IS the object.

    if (payRes.data && payRes.data.redirectUrl) {
      res.json({ success: true, url: payRes.data.redirectUrl, transactionId });
    } else if (payRes.data && payRes.data.data && payRes.data.data.instrumentResponse) {
      // Fallback to previous structure just in case
      const payLink = payRes.data.data.instrumentResponse.redirectInfo.url;
      res.json({ success: true, url: payLink, transactionId });
    } else {
      res.status(400).json({ error: 'Payment initiation failed', details: payRes.data });
    }

  } catch (error) {
    if (error.response) {
      console.error("PhonePe API Error Response:", {
        status: error.response.status,
        data: JSON.stringify(error.response.data),
        headers: error.response.headers
      });
      res.status(error.response.status).json({
        error: 'Payment Gateway Error',
        details: error.response.data
      });
    } else {
      console.error("PhonePe Network/Server Error:", error.message);
      res.status(500).json({ error: 'Server Error initiating payment', message: error.message });
    }
  }
};

// @desc    Check Payment Status (Server-Server)
// @route   POST /api/subscribe/check-status
// @desc    Check Payment Status (PhonePe V2 OAuth + Status API)
// @route   POST /api/subscribe/check-status
exports.verifyPayment = async (req, res) => {
  try {
    const { transactionId } = req.body;

    // Step 1: Get Access Token
    const accessToken = await getAccessToken();

    // Step 2: Check Status
    const response = await axios.get(
      `${HOST}/checkout/v2/order/${transactionId}/status`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `O-Bearer ${accessToken}`
        }
      }
    );

    if (response.data && (response.data.state === 'COMPLETED' || response.data.state === 'SUCCEEDED' || response.data.code === 'PAYMENT_SUCCESS')) {
      // Payment Success: Update Database
      console.log("Verify Payment Success Data:", JSON.stringify(response.data, null, 2));

      // Strategy: Extract User ID from Transaction ID (TXN__userId__timestamp)
      const txnParts = transactionId.split('__');
      let userId = null;
      if (txnParts.length >= 2) {
        userId = txnParts[1];
        console.log("Extracted userId from TXN:", userId);
      } else {
        console.log("Could not extract userId from TXN format:", transactionId);
      }

      const merchantUserId = response.data.data ? response.data.data.merchantUserId : response.data.merchantUserId;
      console.log("Extracted merchantUserId:", merchantUserId);

      if (userId || (merchantUserId && merchantUserId.startsWith('USER_'))) {
        if (!userId && merchantUserId && merchantUserId.startsWith('USER_')) {
          userId = merchantUserId.split('USER_')[1];
        }
        console.log("Final userId for update:", userId);

        // Determine plan from amount
        // PhonePe V2 mostly puts amount in data object
        const paidAmount = response.data.amount || (response.data.data && response.data.data.amount);
        console.log("Extracted paidAmount:", paidAmount, "Type:", typeof paidAmount);

        let newPlan = 'free';
        // handle both string and number
        if (paidAmount == 19900) newPlan = 'pro';
        if (paidAmount == 49900) newPlan = 'business';
        console.log("Determined newPlan:", newPlan);

        if (userId) {
          try {
            const updatedUser = await User.findByIdAndUpdate(userId, { plan: newPlan }, { new: true });
            console.log(`User ${userId} upgraded to ${newPlan}. DB Result:`, updatedUser ? "Success" : "User Not Found");
          } catch (dbErr) {
            console.error("DB Update Error:", dbErr);
          }
        }
      } else {
        console.log("merchantUserId format mismatch or missing");
      }

      res.json({ success: true, message: 'Payment Successful', data: response.data });
    } else if (response.data && response.data.state === 'PENDING') {
      res.json({ success: false, status: 'PENDING', message: 'Payment Pending' });
    } else {
      res.json({ success: false, status: response.data.state || 'FAILED', data: response.data });
    }

  } catch (error) {
    console.error("Verify Payment Error:", error.response?.data || error.message);
    res.status(500).json({ error: 'Server Error verifying payment' });
  }
};

// @desc    Handle PhonePe Webhook
// @route   POST /api/subscribe/callback
exports.handleWebhook = async (req, res) => {
  try {
    const { response } = req.body; // Base64 encoded JSON
    const xVerify = req.headers['x-verify'];

    if (!response || !xVerify) {
      return res.status(400).json({ error: 'Invalid Webhook Request' });
    }

    // Verify Checksum
    const calculatedChecksum = crypto.createHash('sha256')
      .update(response + SALT_KEY)
      .digest('hex') + "###" + SALT_INDEX;

    if (calculatedChecksum !== xVerify) {
      console.error('Webhook Checksum Mismatch');
      return res.status(400).json({ error: 'Checksum Mismatch' });
    }

    const decodedData = JSON.parse(Buffer.from(response, 'base64').toString('utf-8'));

    console.log('Webhook Received:', decodedData);

    if (decodedData.success && decodedData.code === 'PAYMENT_SUCCESS') {
      // Payment Success - log it
      console.log(`Payment Success for ID: ${decodedData.data.merchantTransactionId}`);
    }

    res.json({ success: true });

  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};
