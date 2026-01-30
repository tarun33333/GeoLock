import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const Profile = () => {
    const { user, refreshUser, loading: authLoading, setup2FA, enable2FA, disable2FA } = useAuth();
    const { theme } = useTheme();
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [image, setImage] = useState('');
    const [preview, setPreview] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // 2FA States
    const [show2FASetup, setShow2FASetup] = useState(false);
    const [qrCode, setQrCode] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [setupLoading, setSetupLoading] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login');
        } else if (user) {
            setName(user.name || '');
            setPreview(user.profileImage || '');
        }
    }, [user, authLoading, navigate]);

    const handleSetup2FA = async () => {
        setSetupLoading(true);
        setMessage({ type: '', text: '' });
        try {
            const data = await setup2FA();
            setQrCode(data.qrCode);
            setShow2FASetup(true);
        } catch (err) {
            const detailMessage = err.response?.data?.details || err.message;
            setMessage({ type: 'error', text: `${err.response?.data?.error || 'Failed to initiate 2FA setup'}: ${detailMessage}` });
        } finally {
            setSetupLoading(false);
        }
    };

    const handleEnable2FA = async () => {
        setSetupLoading(true);
        try {
            await enable2FA(verificationCode);
            await refreshUser();
            setShow2FASetup(false);
            setVerificationCode('');
            setMessage({ type: 'success', text: '2FA enabled successfully!' });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Invalid 2FA code' });
        } finally {
            setSetupLoading(false);
        }
    };

    const handleDisable2FA = async () => {
        const code = prompt('Please enter your 2FA code to disable it:');
        if (!code) return;

        setSetupLoading(true);
        try {
            await disable2FA(code);
            await refreshUser();
            setMessage({ type: 'success', text: '2FA disabled successfully!' });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to disable 2FA' });
        } finally {
            setSetupLoading(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 1024 * 1024) {
                setMessage({ type: 'error', text: 'File is too large! Please select an image smaller than 1MB.' });
                e.target.value = ''; // Reset input
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
                setImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            await axios.put(`${API_URL}/api/auth/update-profile`, {
                name,
                profileImage: image || undefined
            });
            await refreshUser();
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update profile' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-transparent flex flex-col">
            <Navbar />
            <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 pt-24">
                <div className={`max-w-md w-full space-y-8 p-8 rounded-2xl shadow-xl backdrop-blur-md border ${theme === 'dark'
                    ? 'bg-gray-900/60 border-white/10 shadow-black/30'
                    : 'bg-white border-transparent'
                    }`}>
                    <div className="text-center">
                        <h2 className={`text-3xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Your Profile</h2>
                        <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Update your personal information</p>
                    </div>

                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="flex flex-col items-center space-y-4">
                            <div className="relative group">
                                <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-blue-100 shadow-inner bg-gray-100 flex items-center justify-center">
                                    {preview ? (
                                        <img src={preview} alt="Profile" className="h-full w-full object-cover" />
                                    ) : (
                                        <span className="text-4xl text-gray-400 font-bold">
                                            {name.charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition">
                                    <span className="text-xs font-bold uppercase">Change</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                </label>
                            </div>
                            <p className="text-xs text-gray-400">Recommended: Square image, max 1MB</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Full Name</label>
                                <input
                                    type="text"
                                    required
                                    className={`w-full rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-3 border ${theme === 'dark'
                                        ? 'bg-black/20 border-white/10 text-white placeholder-gray-500'
                                        : 'bg-white border-gray-300 text-gray-900'
                                        }`}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>Email (Cannot be changed)</label>
                                <input
                                    type="email"
                                    disabled
                                    className={`w-full rounded-lg shadow-sm p-3 border ${theme === 'dark'
                                        ? 'bg-gray-800/50 border-white/5 text-gray-500'
                                        : 'bg-gray-50 border-gray-300 text-gray-500'
                                        }`}
                                    value={user?.email || ''}
                                />
                            </div>
                        </div>

                        {message.text && (
                            <div className={`p-3 rounded-lg text-sm text-center ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {message.text}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition font-bold"
                        >
                            {loading ? 'Saving Changes...' : 'Save Changes'}
                        </button>
                    </form>
                    <hr className="my-8 border-gray-100" />

                    <div className="space-y-6">
                        <div className="text-center">
                            <h3 className={`text-xl font-bold flex items-center justify-center ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                <span className="mr-2">🔐</span> Two-Factor Authentication
                            </h3>
                            <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                Enhance your account security using Microsoft Authenticator
                            </p>
                        </div>

                        {user?.twoFactorEnabled ? (
                            <div className={`border rounded-xl p-4 flex flex-col items-center ${theme === 'dark' ? 'bg-green-900/20 border-green-500/30' : 'bg-green-50 border-green-200'
                                }`}>
                                <div className="text-green-600 font-bold flex items-center mb-4">
                                    <span className="mr-2 text-xl">✅</span> 2FA is active
                                </div>
                                <button
                                    onClick={handleDisable2FA}
                                    disabled={setupLoading}
                                    className={`px-6 py-2 border rounded-lg transition font-medium ${theme === 'dark'
                                        ? 'border-red-500/50 text-red-400 hover:bg-red-500/10'
                                        : 'border-red-300 text-red-600 hover:bg-red-50'
                                        }`}
                                >
                                    Disable 2FA
                                </button>
                            </div>
                        ) : (
                            <div className={`border rounded-xl p-6 flex flex-col items-center ${theme === 'dark' ? 'bg-gray-800/50 border-white/10' : 'bg-gray-50 border-gray-200'
                                }`}>
                                {!show2FASetup ? (
                                    <>
                                        <p className="text-sm text-gray-600 mb-6 text-center">
                                            Scanning a QR code with your authenticator app will link your account.
                                        </p>
                                        <button
                                            onClick={handleSetup2FA}
                                            disabled={setupLoading}
                                            className="w-full py-3 px-4 rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition font-bold"
                                        >
                                            {setupLoading ? 'Loading QR Code...' : 'Setup Authenticator'}
                                        </button>
                                    </>
                                ) : (
                                    <div className="w-full flex flex-col items-center space-y-4">
                                        <div className="bg-white p-3 rounded-xl border-2 border-indigo-100 shadow-sm">
                                            <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm text-gray-800 font-bold mb-1">Scan this QR Code</p>
                                            <p className="text-xs text-gray-500 max-w-[250px]">
                                                Use Microsoft Authenticator or any TOTP app to scan the code above.
                                            </p>
                                        </div>
                                        <div className="w-full">
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Verification Code</label>
                                            <input
                                                type="text"
                                                placeholder="6-digit code"
                                                maxLength="6"
                                                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3 border text-center text-lg tracking-widest"
                                                value={verificationCode}
                                                onChange={(e) => setVerificationCode(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex w-full space-x-3 mt-4">
                                            <button
                                                onClick={() => setShow2FASetup(false)}
                                                className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleEnable2FA}
                                                disabled={setupLoading || verificationCode.length < 6}
                                                className="flex-1 py-3 px-4 rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition font-bold"
                                            >
                                                {setupLoading ? 'Verifying...' : 'Verify & Activate'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
