import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import FacebookLogin from 'react-facebook-login/dist/facebook-login-render-props';
import Navbar from '../components/Navbar';
import './AuthForm.css';

const AuthForm = () => {
    const { login, register, socialLogin, verify2FALogin } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [isSignup, setIsSignup] = useState(location.pathname === '/signup');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [twoFactorRequired, setTwoFactorRequired] = useState(false);
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [twoFactorEmail, setTwoFactorEmail] = useState('');
    const fbLoginTrigger = useRef(null);

    // Form states
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    const [signupName, setSignupName] = useState('');
    const [signupEmail, setSignupEmail] = useState('');
    const [signupPassword, setSignupPassword] = useState('');

    useEffect(() => {
        setIsSignup(location.pathname === '/signup');
        setError('');
    }, [location.pathname]);

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await login(loginEmail, loginPassword);
            if (data.twoFactorRequired) {
                setTwoFactorRequired(true);
                setTwoFactorEmail(data.email);
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            const detailMessage = err.response?.data?.details || err.message;
            setError(`${err.response?.data?.error || 'Login failed'}: ${detailMessage}`);
        } finally {
            setLoading(false);
        }
    };

    const handle2FAVerify = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await verify2FALogin(twoFactorEmail, twoFactorCode);
            navigate('/dashboard');
        } catch (err) {
            const detailMessage = err.response?.data?.details || err.message;
            setError(`${err.response?.data?.error || '2FA Verification failed'}: ${detailMessage}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSignupSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await register(signupName, signupEmail, signupPassword);
            navigate('/dashboard');
        } catch (err) {
            const detailMessage = err.response?.data?.details || err.message;
            setError(`${err.response?.data?.error || 'Registration failed'}: ${detailMessage}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSocialLogin = async (type) => {
        setError('');
        setLoading(true);
        try {
            await socialLogin(type);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || `${type} login failed`);
        } finally {
            setLoading(false);
        }
    };

    const googleLoginTrigger = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setError('');
            setLoading(true);
            try {
                // For Google, we send the access_token or code
                await socialLogin('google', { accessToken: tokenResponse.access_token });
                navigate('/dashboard');
            } catch (err) {
                setError(err.response?.data?.error || 'Google login failed');
            } finally {
                setLoading(false);
            }
        },
        onError: () => setError('Google login failed'),
    });

    const onFacebookSuccess = async (response) => {
        setError('');

        // Handle case where user cancels or login fails
        if (!response || response.status === 'unknown' || response.error) {
            return;
        }

        setLoading(true);
        try {
            const token = response.accessToken || response.authResponse?.accessToken;
            if (!token) {
                console.error('Facebook Response:', response);
                throw new Error('No access token received from Facebook. Please try again.');
            }
            await socialLogin('facebook', { accessToken: token });
            navigate('/dashboard');
        } catch (err) {
            const detailMessage = err.response?.data?.details || err.message;
            setError(`${err.response?.data?.error || 'Facebook login failed'}: ${detailMessage}`);
        } finally {
            setLoading(false);
        }
    };

    const SocialButtons = () => (
        <div className="social-container">
            <a href="#" className="social" onClick={(e) => {
                e.preventDefault();
                if (fbLoginTrigger.current) fbLoginTrigger.current();
            }}>
                <i className="fab fa-facebook-f"></i>
            </a>
            <a href="#" className="social" onClick={(e) => { e.preventDefault(); googleLoginTrigger(); }}>
                <i className="fab fa-google"></i>
            </a>
        </div>
    );

    return (
        <div className="auth-page">
            <Navbar />
            {/* Hidden Facebook Login Instance to prevent multiple SDK initializations */}
            <div style={{ display: 'none' }}>
                <FacebookLogin
                    appId={import.meta.env.VITE_FACEBOOK_APP_ID || "YOUR_FB_APP_ID"}
                    callback={onFacebookSuccess}
                    scope="public_profile,email"
                    fields="name,email,picture"
                    render={(renderProps) => {
                        fbLoginTrigger.current = renderProps.onClick;
                        return null;
                    }}
                />
            </div>

            <div className="auth-container-wrapper">
                {twoFactorRequired ? (
                    <div className="auth-container two-factor-container">
                        <div className="form-container sign-in-container" style={{ width: '100%', opacity: 1, zIndex: 5, left: 0 }}>
                            <form onSubmit={handle2FAVerify}>
                                <h1>Two-Factor Auth</h1>
                                <p style={{ margin: '15px 0' }}>Enter the 6-digit code from your authenticator app.</p>
                                <div className="input-group">
                                    <input
                                        type="text"
                                        placeholder="000000"
                                        value={twoFactorCode}
                                        onChange={(e) => setTwoFactorCode(e.target.value)}
                                        maxLength="6"
                                        required
                                        style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '5px' }}
                                    />
                                </div>
                                {error && <p className="error-text">{error}</p>}
                                <button type="submit" disabled={loading}>
                                    {loading ? 'Verifying...' : 'Verify & Login'}
                                </button>
                                <button
                                    type="button"
                                    className="ghost auth-btn"
                                    style={{ color: '#333', marginTop: '10px' }}
                                    onClick={() => setTwoFactorRequired(false)}
                                >
                                    Back to Login
                                </button>
                            </form>
                        </div>
                    </div>
                ) : (
                    <div className={`auth-container ${isSignup ? 'right-panel-active' : ''}`}>
                        {/* Sign Up Form */}
                        <div className="form-container sign-up-container">
                            <form onSubmit={handleSignupSubmit}>
                                <img src="/logo.svg" alt="GeoQR Logo" className="auth-logo" style={{ width: '60px', marginBottom: '10px' }} />
                                <h1>Create Account</h1>
                                <SocialButtons />
                                <span>or use your email for registration</span>
                                <div className="input-group">
                                    <input
                                        type="text"
                                        placeholder="Full Name"
                                        value={signupName}
                                        onChange={(e) => setSignupName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <input
                                        type="email"
                                        placeholder="Email"
                                        value={signupEmail}
                                        onChange={(e) => setSignupEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <input
                                        type="password"
                                        placeholder="Password"
                                        value={signupPassword}
                                        onChange={(e) => setSignupPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                {isSignup && error && <p className="error-text">{error}</p>}
                                <button type="submit" disabled={loading}>
                                    {loading ? 'Creating...' : 'Signup'}
                                </button>
                            </form>
                        </div>

                        {/* Sign In Form */}
                        <div className="form-container sign-in-container">
                            <form onSubmit={handleLoginSubmit}>
                                <img src="/logo.svg" alt="GeoQR Logo" className="auth-logo" style={{ width: '60px', marginBottom: '10px' }} />
                                <h1>Welcome Back</h1>
                                <SocialButtons />
                                <span>or use your email account</span>
                                <div className="input-group">
                                    <input
                                        type="email"
                                        placeholder="Email"
                                        value={loginEmail}
                                        onChange={(e) => setLoginEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <input
                                        type="password"
                                        placeholder="Password"
                                        value={loginPassword}
                                        onChange={(e) => setLoginPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                {!isSignup && error && <p className="error-text">{error}</p>}
                                <button type="submit" disabled={loading}>
                                    {loading ? 'Logging In...' : 'Login'}
                                </button>
                            </form>
                        </div>

                        {/* Overlay */}
                        <div className="overlay-container">
                            <div className="overlay">
                                <div className="overlay-panel overlay-left">
                                    <h1>Hello, Friend!</h1>
                                    <p>Enter your personal details and start your journey with us</p>
                                    <button className="ghost auth-btn" id="signIn" onClick={() => navigate('/login')}>
                                        Login
                                    </button>
                                </div>
                                <div className="overlay-panel overlay-right">
                                    <h1>Welcome Back!</h1>
                                    <p>To keep connected with us please login with your personal info</p>
                                    <button className="ghost auth-btn" id="signUp" onClick={() => navigate('/signup')}>
                                        Signup
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuthForm;
