import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('verifying');
    const [message, setMessage] = useState('');
    const transactionId = searchParams.get('tid');
    const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    const { refreshUser } = useAuth();

    useEffect(() => {
        if (!transactionId) {
            setStatus('error');
            return;
        }

        const verify = async () => {
            try {
                const res = await axios.post(`${API_URL}/api/subscribe/check-status`, { transactionId });
                if (res.data.success) {
                    setStatus('success');
                    if (refreshUser) refreshUser();
                } else if (res.data.status === 'PENDING') {
                    setStatus('pending');
                    setMessage('Payment is currently pending. Please wait or check back later.');
                } else {
                    setStatus('failed');
                    setMessage(res.data.message || 'Payment verification failed.');
                }
            } catch (error) {
                console.error(error);
                setStatus('error');
                setMessage(error.response?.data?.message || 'Server error during verification.');
            }
        };

        verify();
    }, [transactionId, API_URL, refreshUser]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <div className="flex-grow flex flex-col items-center justify-center p-4 pt-24 text-center">
                {status === 'verifying' && (
                    <div>
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <h2 className="text-xl font-bold">Verifying Payment...</h2>
                    </div>
                )}

                {status === 'pending' && (
                    <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
                        <div className="text-6xl mb-4">⏳</div>
                        <h2 className="text-2xl font-bold text-yellow-600 mb-2">Payment Pending</h2>
                        <p className="text-gray-600 mb-6">{message}</p>
                        <Link to="/dashboard" className="text-blue-600 underline">Go to Dashboard</Link>
                    </div>
                )}

                {status === 'success' && (
                    <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
                        <div className="text-6xl mb-4">✅</div>
                        <h2 className="text-2xl font-bold text-green-600 mb-2">Payment Successful!</h2>
                        <p className="text-gray-600 mb-6">Your subscription has been activated.</p>
                        <Link to="/dashboard" className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700">Go to Dashboard</Link>
                    </div>
                )}

                {(status === 'failed' || status === 'error') && (
                    <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
                        <div className="text-6xl mb-4">❌</div>
                        <h2 className="text-2xl font-bold text-red-600 mb-2">Payment Failed</h2>
                        <p className="text-gray-600 mb-6">{message}</p>
                        <Link to="/pricing" className="text-blue-600 underline">Try Again</Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentSuccess;
