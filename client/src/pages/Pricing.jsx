import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Confetti from 'react-confetti';
import Navbar from '../components/Navbar';

import { useTheme } from '../context/ThemeContext';

const Pricing = () => {
    const rawApiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    const API_URL = rawApiUrl.replace(/\/$/, '');
    const { user, refreshUser } = useAuth();
    const { theme } = useTheme();

    const [showVerification, setShowVerification] = React.useState(false);
    const [currentTxnId, setCurrentTxnId] = React.useState(null);
    const [verificationStatus, setVerificationStatus] = React.useState('idle'); // idle, verifying, success, failed

    const handleSubscribe = async (plan) => {
        try {
            const res = await axios.post(`${API_URL}/api/subscribe/create-order`, { plan });

            if (res.data.success && res.data.url) {
                // Open PhonePe in new tab
                window.open(res.data.url, '_blank');
                // Show verification modal
                setCurrentTxnId(res.data.transactionId);
                setShowVerification(true);
                setVerificationStatus('idle');
            } else {
                alert('Failed to initiate payment');
            }
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.details?.message || err.response?.data?.error || 'Payment Initialization Failed';
            alert(`Payment Failed: ${msg}`);
        }
    };

    const verifyTransaction = async () => {
        if (!currentTxnId) return;
        setVerificationStatus('verifying');
        try {
            const res = await axios.post(`${API_URL}/api/subscribe/check-status`, { transactionId: currentTxnId });
            if (res.data.success) {
                setVerificationStatus('success');
                if (refreshUser) refreshUser();
                // Optionally auto-close after a delay
                // setTimeout(() => setShowVerification(false), 5000);
            } else if (res.data.status === 'PENDING') {
                setVerificationStatus('idle'); // Reset to allow retry
                alert("Payment is still Pending. Please wait a moment and try 'Check Status' again.");
            } else {
                setVerificationStatus('failed');
                alert("Payment status: " + (res.data.message || res.data.status));
            }
        } catch (e) {
            console.error(e);
            setVerificationStatus('failed');
            alert("Error checking status");
        }
    };

    return (
        <div className="min-h-screen bg-transparent relative">
            {/* Show Confetti on Success */}
            {verificationStatus === 'success' && (
                <Confetti
                    width={window.innerWidth}
                    height={window.innerHeight}
                    recycle={false}
                    numberOfPieces={500}
                    gravity={0.2}
                />
            )}

            {/* Verification Modal */}
            {showVerification && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className={`p-8 rounded-2xl max-w-md w-full text-center shadow-2xl border ${theme === 'dark' ? 'bg-gray-900/90 border-white/10 text-white' : 'bg-white border-transparent text-gray-900'
                        }`}>
                        {verificationStatus === 'success' ? (
                            <>
                                <div className="text-6xl mb-4">🎉</div>
                                <h3 className="text-2xl font-bold mb-2 text-green-500">Payment Successful!</h3>
                                <p className={`mb-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                    Your plan has been upgraded. Thank you for subscribing!
                                </p>
                                <button
                                    onClick={() => setShowVerification(false)}
                                    className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 font-bold transition-transform hover:scale-105"
                                >
                                    Continue
                                </button>
                            </>
                        ) : (
                            <>
                                <h3 className="text-xl font-bold mb-4">Complete Your Payment</h3>
                                <p className={`mb-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                    A new tab has opened for payment. Once you complete the payment there, come back here and click verify.
                                </p>
                                <div className="flex flex-col space-y-3">
                                    <button
                                        onClick={verifyTransaction}
                                        disabled={verificationStatus === 'verifying'}
                                        className={`px-6 py-2 rounded-full font-bold text-white transition-all ${verificationStatus === 'verifying'
                                                ? 'bg-gray-400 cursor-not-allowed'
                                                : 'bg-green-600 hover:bg-green-700 hover:shadow-lg hover:-translate-y-0.5'
                                            }`}
                                    >
                                        {verificationStatus === 'verifying' ? 'Verifying...' : 'Check Payment Status'}
                                    </button>
                                    <button
                                        onClick={() => setShowVerification(false)}
                                        className={`text-sm underline ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}
                                    >
                                        Close / Cancel
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Navbar */}
            <Navbar />

            <div className="pt-24 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto text-center">
                    <h2 className={`text-3xl font-extrabold sm:text-4xl ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Simple, Transparent Pricing
                    </h2>
                    <p className={`mt-4 text-xl ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        Choose the plan that fits your needs.
                    </p>
                </div>

                <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0 xl:grid-cols-3">
                    {/* Free Tier */}
                    <div className={`rounded-xl shadow-lg divide-y backdrop-blur-md border transition-all hover:scale-[1.02] duration-300 ${theme === 'dark'
                            ? 'bg-gray-900/60 border-white/10 shadow-black/30 divide-white/5'
                            : 'bg-white border-gray-100 divide-gray-200'
                        }`}>
                        <div className="p-6">
                            <h2 className={`text-lg leading-6 font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Free</h2>
                            <p className={`mt-4 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>For trying out GeoLock.</p>
                            <p className="mt-8">
                                <span className={`text-4xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>₹0</span>
                                <span className={`text-base font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>/mo</span>
                            </p>
                            <button
                                disabled={!user || !user.plan || user.plan === 'free'}
                                className={`mt-8 block w-full border border-transparent rounded-lg py-3 text-sm font-bold text-white transition-all ${(!user || !user.plan || user.plan === 'free') ? 'bg-gray-500/50 cursor-default' : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20'}`}
                            >
                                {(!user || !user.plan || user.plan === 'free') ? 'Current Plan' : 'Downgrade to Free'}
                            </button>
                        </div>
                    </div>

                    {/* Pro Tier */}
                    <div className={`rounded-xl shadow-lg divide-y backdrop-blur-md border border-blue-500/30 transition-all hover:scale-[1.05] duration-300 relative overflow-hidden ${theme === 'dark'
                            ? 'bg-gray-900/80 shadow-black/40 divide-white/5'
                            : 'bg-white shadow-xl divide-gray-200'
                        }`}>
                        {theme === 'dark' && <div className="absolute inset-0 bg-blue-500/5 pointer-events-none"></div>}
                        <div className="p-6 relative">
                            <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-lg shadow-lg">POPULAR</div>
                            <h2 className={`text-lg leading-6 font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Pro</h2>
                            <p className={`mt-4 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>For serious creators.</p>
                            <p className="mt-8">
                                <span className={`text-4xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>₹199</span>
                                <span className={`text-base font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>/mo</span>
                            </p>
                            <button
                                onClick={() => handleSubscribe('pro')}
                                disabled={user?.plan === 'pro'}
                                className={`mt-8 block w-full border border-transparent rounded-lg py-3 text-sm font-bold text-white transition-all ${user?.plan === 'pro' ? 'bg-green-600 cursor-default shadow-lg shadow-green-600/20' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-indigo-600/30'}`}
                            >
                                {user?.plan === 'pro' ? 'Current Plan' : 'Upgrade to Pro'}
                            </button>
                        </div>
                    </div>

                    {/* Business Tier */}
                    <div className={`rounded-xl shadow-lg divide-y backdrop-blur-md border transition-all hover:scale-[1.02] duration-300 ${theme === 'dark'
                            ? 'bg-gray-900/60 border-white/10 shadow-black/30 divide-white/5'
                            : 'bg-white border-gray-100 divide-gray-200'
                        }`}>
                        <div className="p-6">
                            <h2 className={`text-lg leading-6 font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Business</h2>
                            <p className={`mt-4 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>For teams and brands.</p>
                            <p className="mt-8">
                                <span className={`text-4xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>₹499</span>
                                <span className={`text-base font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>/mo</span>
                            </p>
                            <button
                                onClick={() => handleSubscribe('business')}
                                disabled={user?.plan === 'business'}
                                className={`mt-8 block w-full border border-transparent rounded-lg py-3 text-sm font-bold text-white transition-all ${user?.plan === 'business' ? 'bg-green-600 cursor-default shadow-lg shadow-green-600/20' : 'bg-gray-900 hover:bg-black'}`}
                            >
                                {user?.plan === 'business' ? 'Current Plan' : 'Upgrade to Business'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Pricing;
