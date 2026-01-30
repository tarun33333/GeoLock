import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const Profile = () => {
    const { user, refreshUser, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [image, setImage] = useState('');
    const [preview, setPreview] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login');
        } else if (user) {
            setName(user.name || '');
            setPreview(user.profileImage || '');
        }
    }, [user, authLoading, navigate]);

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
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 pt-24">
                <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl">
                    <div className="text-center">
                        <h2 className="text-3xl font-extrabold text-gray-900">Your Profile</h2>
                        <p className="mt-2 text-gray-600">Update your personal information</p>
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-3 border"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email (Cannot be changed)</label>
                                <input
                                    type="email"
                                    disabled
                                    className="w-full border-gray-300 rounded-lg shadow-sm bg-gray-50 p-3 border text-gray-500"
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
                </div>
            </div>
        </div>
    );
};

export default Profile;
