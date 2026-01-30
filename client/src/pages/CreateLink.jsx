import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import MapSelector from '../components/MapSelector';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const rawAppUrl = import.meta.env.VITE_APP_BASE_URL || window.location.origin;
const APP_URL = rawAppUrl.replace(/\/$/, '');

const CreateLink = () => {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        destinationUrl: '',
        radius: 100,
    });
    const [location, setLocation] = useState(null);
    const [createdLink, setCreatedLink] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const qrRef = useRef();

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login');
        }
    }, [user, authLoading, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!location) {
            setError('Please pick a location on the map.');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                destinationUrl: formData.destinationUrl,
                radius: formData.radius,
                location: { lat: location.lat, lng: location.lng },
                createdBy: user ? user.id : 'anonymous-' + Date.now(),
                user: user ? user.id : null
            };

            const res = await axios.post(`${API_URL}/api/create`, payload);
            setCreatedLink(res.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create link');
        } finally {
            setLoading(false);
        }
    };

    const downloadQR = () => {
        const svg = qrRef.current.querySelector('svg');
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            const pngFile = canvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            downloadLink.download = `geolock-${createdLink.slug}.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
        };
        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    };

    if (authLoading) return <div className="p-10 text-center">Loading...</div>;

    return (
        <div className="h-screen bg-white flex flex-col overflow-hidden">
            <Navbar />

            <div className="flex-grow flex flex-col md:flex-row pt-20">
                {/* Left Side: Form Panel */}
                <motion.div
                    drag
                    dragMomentum={false}
                    className="md:w-[450px] w-full flex-shrink-0 z-10 bg-white md:bg-transparent md:absolute md:left-8 md:top-24 md:bottom-auto pointer-events-none flex flex-col"
                >
                    <div className="glass md:rounded-3xl p-8 shadow-2xl pointer-events-auto flex-grow flex flex-col overflow-y-auto border-white/50 relative group">
                        {/* Drag Handle */}
                        <div className="absolute top-4 right-4 text-gray-300 cursor-grab active:cursor-grabbing hover:text-blue-500 transition-colors">
                            <svg className="w-6 h-6 transform rotate-90" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                        </div>
                        <div className="mb-6">
                            <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-none mb-2">
                                New <span className="text-blue-600">GeoQR</span>
                            </h1>
                            <p className="text-gray-500 font-medium">Link digital content to the physical world.</p>
                        </div>

                        {!createdLink ? (
                            <form onSubmit={handleSubmit} className="space-y-6 flex-grow flex flex-col justify-center">
                                <div className="space-y-4">
                                    <div className="group">
                                        <label className="block text-xs font-bold text-blue-600 uppercase tracking-widest mb-1 ml-1">Target Destination</label>
                                        <input
                                            type="url"
                                            required
                                            placeholder="https://your-content.com"
                                            className="w-full bg-white/50 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent p-4 border transition-all text-gray-800 placeholder:text-gray-400"
                                            value={formData.destinationUrl}
                                            onChange={(e) => setFormData({ ...formData, destinationUrl: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-blue-600 uppercase tracking-widest mb-1 ml-1">Unlock Radius (meters)</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="50"
                                                required
                                                className="w-full bg-white/50 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent p-4 border transition-all text-gray-800"
                                                value={formData.radius}
                                                onChange={(e) => setFormData({ ...formData, radius: Number(e.target.value) })}
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">M</span>
                                        </div>
                                        <div className="mt-2 flex items-center space-x-2 px-1">
                                            <div className="h-1.5 flex-grow bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500 transition-all duration-500"
                                                    style={{ width: `${Math.min((formData.radius / 1000) * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase whitespace-nowrap">
                                                {formData.radius >= 1000 ? `${(formData.radius / 1000).toFixed(1)}KM` : `${formData.radius}M`}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className={`p-4 rounded-2xl transition-all duration-300 border ${location ? 'bg-green-50 border-green-100' : 'bg-blue-50 border-blue-100'}`}>
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${location ? 'bg-green-500 text-white' : 'bg-blue-500 text-white animate-pulse'}`}>
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                        <div className="flex-grow">
                                            <p className={`text-sm font-bold ${location ? 'text-green-700' : 'text-blue-700'}`}>
                                                {location ? 'Location Locked' : 'Select Location'}
                                            </p>
                                            <p className="text-[11px] text-opacity-70 text-gray-600">
                                                {location ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` : 'Click on the map to pin a location'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {error && (
                                    <div className="bg-red-50 border-red-100 p-4 rounded-2xl border flex items-center space-x-2">
                                        <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">!</div>
                                        <p className="text-red-700 text-xs font-medium">{error}</p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-blue-600 py-4 px-6 rounded-2xl text-white font-bold text-lg shadow-xl shadow-blue-600/20 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                                >
                                    {loading ? 'Generating...' : 'Create GeoQR Link'}
                                </button>
                            </form>
                        ) : (
                            <div className="text-center space-y-6 flex-grow flex flex-col justify-center">
                                <div className="space-y-4">
                                    <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-500/20">
                                        <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <h2 className="text-3xl font-black text-gray-900">It's Live!</h2>
                                </div>

                                <div ref={qrRef} className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 mx-auto transform hover:rotate-2 transition-transform duration-300">
                                    <QRCodeSVG value={`${APP_URL}/l/${createdLink.slug}`} size={180} />
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex flex-col items-center">
                                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Shareable Link</span>
                                        <p className="text-sm font-mono break-all text-blue-900 font-bold">{APP_URL}/l/{createdLink.slug}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={downloadQR}
                                            className="bg-gray-900 text-white font-bold py-3 px-4 rounded-2xl hover:bg-black transition-all shadow-lg"
                                        >
                                            Download QR
                                        </button>
                                        <Link to="/dashboard" className="bg-white text-blue-600 font-bold py-3 px-4 rounded-2xl border border-blue-200 hover:bg-blue-50 transition-all text-center">
                                            Dashboard
                                        </Link>
                                    </div>
                                    <button
                                        onClick={() => { setCreatedLink(null); setLocation(null); setFormData({ ...formData, destinationUrl: '' }); }}
                                        className="text-gray-400 text-sm font-medium hover:text-blue-600 transition"
                                    >
                                        Create Another
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            <span>Powered by GeoQR</span>
                            <div className="flex space-x-2">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                <span>Network Active</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Right Side: Map Container */}
                <div className="flex-grow relative z-0">
                    <MapSelector onLocationSelect={setLocation} />

                    {/* Floating Map Controls Hint (Desktop only) */}
                    <div className="hidden md:block absolute bottom-8 right-8 z-20 space-y-2 pointer-events-none">
                        <div className="glass px-4 py-2 rounded-full shadow-lg border border-white/50 flex items-center space-x-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            <span className="text-xs font-bold text-gray-700">Interactive Map View</span>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default CreateLink;
