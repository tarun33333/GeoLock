const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment, handleWebhook } = require('../controllers/paymentController');

const { protect } = require('../middleware/auth');

router.post('/create-order', protect, createOrder);
router.post('/check-status', verifyPayment);
router.post('/callback', handleWebhook);

module.exports = router;
