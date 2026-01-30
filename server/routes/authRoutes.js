const express = require('express');
const { register, login, getMe, updateProfile, socialLogin, generate2FASetup, verifyAndEnable2FA, disable2FA, verify2FALogin } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/social-login', socialLogin);
router.get('/me', protect, getMe);
router.put('/update-profile', protect, updateProfile);

// 2FA Routes
router.get('/2fa/setup', protect, generate2FASetup);
router.post('/2fa/enable', protect, verifyAndEnable2FA);
router.post('/2fa/disable', protect, disable2FA);
router.post('/2fa/verify-login', verify2FALogin);

module.exports = router;
