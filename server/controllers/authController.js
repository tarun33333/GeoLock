const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');
const { authenticator } = require('otplib');
const qrcode = require('qrcode');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @desc    Generate 2FA secret and QR code
// @route   GET /api/auth/2fa/setup
// @access  Private
exports.generate2FASetup = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const secret = authenticator.generateSecret();
        const otpauth = authenticator.keyuri(user.email, 'GeoQR', secret);

        console.log('2FA Setup initiated for:', user.email);

        // Store secret temporarily but don't enable yet
        user.twoFactorSecret = secret;
        await user.save();

        const qrCodeDataUri = await qrcode.toDataURL(otpauth);

        res.status(200).json({
            success: true,
            qrCode: qrCodeDataUri,
            secret: secret
        });
    } catch (err) {
        console.error('2FA Setup Error Detail:', {
            message: err.message,
            stack: err.stack,
            user: req.user?.id
        });
        res.status(500).json({ error: 'Server Error', details: err.message });
    }
};

// @desc    Verify and enable 2FA
// @route   POST /api/auth/2fa/enable
// @access  Private
exports.verifyAndEnable2FA = async (req, res) => {
    try {
        const { token } = req.body;
        const user = await User.findById(req.user.id).select('+twoFactorSecret');

        if (!user.twoFactorSecret) {
            return res.status(400).json({ error: '2FA setup not initiated' });
        }

        const isValid = authenticator.check(token, user.twoFactorSecret);

        if (!isValid) {
            return res.status(400).json({ error: 'Invalid 2FA token' });
        }

        user.twoFactorEnabled = true;
        await user.save();

        res.status(200).json({
            success: true,
            message: '2FA enabled successfully'
        });
    } catch (err) {
        console.error('2FA Enable Error Detail:', {
            message: err.message,
            stack: err.stack,
            user: req.user?.id
        });
        res.status(500).json({ error: 'Server Error', details: err.message });
    }
};

// @desc    Disable 2FA
// @route   POST /api/auth/2fa/disable
// @access  Private
exports.disable2FA = async (req, res) => {
    try {
        const { token } = req.body;
        const user = await User.findById(req.user.id).select('+twoFactorSecret');

        const isValid = authenticator.check(token, user.twoFactorSecret);

        if (!isValid) {
            return res.status(400).json({ error: 'Invalid 2FA token' });
        }

        user.twoFactorEnabled = false;
        user.twoFactorSecret = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            message: '2FA disabled successfully'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
};

// @desc    Verify 2FA login
// @route   POST /api/auth/2fa/verify-login
// @access  Public
exports.verify2FALogin = async (req, res) => {
    try {
        const { email, token } = req.body;
        const user = await User.findOne({ email }).select('+twoFactorSecret');

        if (!user || !user.twoFactorEnabled) {
            return res.status(400).json({ error: '2FA not enabled for this user' });
        }

        const isValid = authenticator.check(token, user.twoFactorSecret);

        if (!isValid) {
            return res.status(400).json({ error: 'Invalid 2FA token' });
        }

        sendTokenResponse(user, 200, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        console.log('Registration attempt:', { name, email });

        // Create user
        const user = await User.create({
            name,
            email,
            password
        });

        sendTokenResponse(user, 200, res);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ error: 'Email already exists' });
        }
        console.error('Registration Error Detail:', {
            message: err.message,
            stack: err.stack,
            errors: err.errors
        });
        res.status(500).json({ error: 'Server Error', details: err.message });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate email & password
        if (!email || !password) {
            return res.status(400).json({ error: 'Please provide an email and password' });
        }

        // Check for user
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check if password matches
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check if 2FA is enabled
        const userWith2FA = await User.findById(user._id).select('+twoFactorEnabled');
        if (userWith2FA.twoFactorEnabled) {
            return res.status(200).json({
                success: true,
                twoFactorRequired: true,
                email: user.email
            });
        }

        sendTokenResponse(user, 200, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.status(200).json({
            success: true,
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                plan: user.plan,
                profileImage: user.profileImage,
                role: user.role
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/update-profile
// @access  Private
exports.updateProfile = async (req, res) => {
    try {
        const { name, profileImage } = req.body;
        const fieldsToUpdate = {};
        if (name) fieldsToUpdate.name = name;
        if (profileImage !== undefined) fieldsToUpdate.profileImage = profileImage;

        const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                plan: user.plan,
                profileImage: user.profileImage,
                role: user.role
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
};

// @desc    Social Login (Google/Facebook)
// @route   POST /api/auth/social-login
// @access  Public
exports.socialLogin = async (req, res) => {
    try {
        const { type, accessToken, idToken } = req.body;
        let userData = {};

        if (type === 'google') {
            // Verify Google Token
            // If we have an idToken, verify it. Otherwise use accessToken to fetch userinfo.
            if (idToken) {
                const ticket = await googleClient.verifyIdToken({
                    idToken,
                    audience: process.env.GOOGLE_CLIENT_ID
                });
                const payload = ticket.getPayload();
                userData = {
                    email: payload.email,
                    name: payload.name,
                    profileImage: payload.picture
                };
            } else {
                const response = await axios.get(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`);
                userData = {
                    email: response.data.email,
                    name: response.data.name,
                    profileImage: response.data.picture
                };
            }
        } else if (type === 'facebook') {
            // Verify Facebook Token
            const response = await axios.get(`https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`);
            userData = {
                email: response.data.email,
                name: response.data.name,
                profileImage: response.data.picture?.data?.url
            };
        }

        if (!userData.email) {
            return res.status(400).json({ error: `Could not retrieve email from ${type}` });
        }

        // Check if user exists
        let user = await User.findOne({ email: userData.email });

        if (!user) {
            // Create user for social login (no password needed initially, or set a random one)
            user = await User.create({
                name: userData.name,
                email: userData.email,
                password: Math.random().toString(36).slice(-10), // Random password
                profileImage: userData.profileImage || ''
            });
        } else if (userData.profileImage && !user.profileImage) {
            user.profileImage = userData.profileImage;
            await user.save();
        }

        sendTokenResponse(user, 200, res);
    } catch (err) {
        console.error('Social Login Error Detail:', {
            message: err.message,
            stack: err.stack,
            response: err.response?.data
        });
        res.status(401).json({
            error: 'Social authentication failed',
            details: err.response?.data?.error?.message || err.message
        });
    }
};

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret123', {
        expiresIn: process.env.JWT_EXPIRE || '30d'
    });

    const options = {
        expires: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
        ),
        httpOnly: true
    };

    res
        .status(statusCode)
        // .cookie('token', token, options) // Simple response for now, client stores in localStorage
        .json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                plan: user.plan,
                profileImage: user.profileImage
            }
        });
};
