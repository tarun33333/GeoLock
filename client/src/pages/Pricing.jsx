import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Confetti from 'react-confetti';
import Navbar from '../components/Navbar';

const Pricing = () => {
    const rawApiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    const API_URL = rawApiUrl.replace(/\/$/, '');
    const { user, refreshUser } = useAuth();

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
        <div className="min-h-screen bg-gray-50 relative">
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg max-w-md w-full text-center">
                        {verificationStatus === 'success' ? (
                            <>
                                <div className="text-6xl mb-4">🎉</div>
                                <h3 className="text-2xl font-bold mb-2 text-green-600">Payment Successful!</h3>
                                <p className="mb-6 text-gray-600">
                                    Your plan has been upgraded. Thank you for subscribing!
                                </p>
                                <button
                                    onClick={() => setShowVerification(false)}
                                    className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 font-bold"
                                >
                                    Continue
                                </button>
                            </>
                        ) : (
                            <>
                                <h3 className="text-xl font-bold mb-4">Complete Your Payment</h3>
                                <p className="mb-6 text-gray-600">
                                    A new tab has opened for payment. Once you complete the payment there, come back here and click verify.
                                </p>
                                <div className="flex flex-col space-y-3">
                                    <button
                                        onClick={verifyTransaction}
                                        disabled={verificationStatus === 'verifying'}
                                        className={`px-6 py-2 rounded font-bold text-white ${verificationStatus === 'verifying' ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                                    >
                                        {verificationStatus === 'verifying' ? 'Verifying...' : 'Check Payment Status'}
                                    </button>
                                    <button
                                        onClick={() => setShowVerification(false)}
                                        className="text-gray-500 underline"
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
                    <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                        Simple, Transparent Pricing
                    </h2>
                    <p className="mt-4 text-xl text-gray-500">
                        Choose the plan that fits your needs.
                    </p>
                </div>

                <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0 xl:grid-cols-3">
                    {/* Free Tier */}
                    <div className="border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200 bg-white">
                        <div className="p-6">
                            <h2 className="text-lg leading-6 font-medium text-gray-900">Free</h2>
                            <p className="mt-4 text-sm text-gray-500">For trying out GeoLock.</p>
                            <p className="mt-8">
                                <span className="text-4xl font-extrabold text-gray-900">₹0</span>
                                <span className="text-base font-medium text-gray-500">/mo</span>
                            </p>
                            <button
                                disabled={!user || !user.plan || user.plan === 'free'}
                                className={`mt-8 block w-full border border-transparent rounded-md py-2 text-sm font-semibold text-white ${(!user || !user.plan || user.plan === 'free') ? 'bg-gray-400 cursor-default' : 'bg-blue-600 hover:bg-blue-700'}`}
                            >
                                {(!user || !user.plan || user.plan === 'free') ? 'Current Plan' : 'Downgrade to Free'}
                            </button>
                        </div>
                    </div>

                    {/* Pro Tier */}
                    <div className="border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200 bg-white">
                        <div className="p-6">
                            <h2 className="text-lg leading-6 font-medium text-gray-900">Pro</h2>
                            <p className="mt-4 text-sm text-gray-500">For serious creators.</p>
                            <p className="mt-8">
                                <span className="text-4xl font-extrabold text-gray-900">₹199</span>
                                <span className="text-base font-medium text-gray-500">/mo</span>
                            </p>
                            <button
                                onClick={() => handleSubscribe('pro')}
                                disabled={user?.plan === 'pro'}
                                className={`mt-8 block w-full border border-transparent rounded-md py-2 text-sm font-semibold text-white ${user?.plan === 'pro' ? 'bg-green-600 cursor-default' : 'bg-blue-600 hover:bg-blue-700'}`}
                            >
                                {user?.plan === 'pro' ? 'Current Plan' : 'Upgrade to Pro'}
                            </button>
                        </div>
                    </div>

                    {/* Business Tier */}
                    <div className="border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200 bg-white">
                        <div className="p-6">
                            <h2 className="text-lg leading-6 font-medium text-gray-900">Business</h2>
                            <p className="mt-4 text-sm text-gray-500">For teams and brands.</p>
                            <p className="mt-8">
                                <span className="text-4xl font-extrabold text-gray-900">₹499</span>
                                <span className="text-base font-medium text-gray-500">/mo</span>
                            </p>
                            <button
                                onClick={() => handleSubscribe('business')}
                                disabled={user?.plan === 'business'}
                                className={`mt-8 block w-full border border-transparent rounded-md py-2 text-sm font-semibold text-white ${user?.plan === 'business' ? 'bg-green-600 cursor-default' : 'bg-blue-600 hover:bg-blue-700'}`}
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
