import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import MapSelector from '../components/MapSelector';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
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
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />

            <div className="flex-grow container mx-auto px-4 pt-24 pb-8">
                <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">

                    {/* Left Side (Form) */}
                    <div className="p-8 md:w-1/2 flex flex-col justify-center">
                        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Create New GeoLink</h1>
                        <p className="text-gray-500 mb-8">Lock digital content to a physical location.</p>

                        {!createdLink ? (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Destination URL</label>
                                    <input
                                        type="url"
                                        required
                                        placeholder="https://your-content.com"
                                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-3 border"
                                        value={formData.destinationUrl}
                                        onChange={(e) => setFormData({ ...formData, destinationUrl: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Unlock Radius (meters)</label>
                                    <input
                                        type="number"
                                        min="50"
                                        required
                                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-3 border"
                                        value={formData.radius}
                                        onChange={(e) => setFormData({ ...formData, radius: Number(e.target.value) })}
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Minimum 50 meters.</p>
                                </div>

                                {/* Mobile Map Hint */}
                                <div className="md:hidden block">
                                    <p className="text-sm text-blue-600 mb-2">👇 Scroll down to pick location on map</p>
                                </div>

                                {error && (
                                    <div className="bg-red-50 border-l-4 border-red-500 p-4">
                                        <p className="text-red-700 text-sm">{error}</p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition"
                                >
                                    {loading ? 'Generating...' : 'Create Geo-Link'}
                                </button>
                            </form>
                        ) : (
                            <div className="text-center space-y-6">
                                <div className="bg-green-50 p-4 rounded-full inline-block">
                                    <svg className="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800">It's Ready!</h2>
                                <p className="text-gray-600">Scan this code at the location to unlock.</p>

                                <div ref={qrRef} className="flex justify-center bg-white p-4 rounded-xl shadow-inner border border-gray-100">
                                    <QRCodeSVG value={`${APP_URL}/l/${createdLink.slug}`} size={200} />
                                </div>

                                <div className="bg-gray-100 p-3 rounded-lg text-sm font-mono break-all text-gray-700">
                                    {APP_URL}/l/{createdLink.slug}
                                </div>

                                <div className="flex flex-col space-y-3">
                                    <button
                                        onClick={downloadQR}
                                        className="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-2 px-4 rounded transition"
                                    >
                                        Download QR
                                    </button>
                                    <Link to="/dashboard" className="w-full border border-blue-600 text-blue-600 font-bold py-2 px-4 rounded hover:bg-blue-50 transition text-center">
                                        Go to Dashboard
                                    </Link>
                                    <button
                                        onClick={() => { setCreatedLink(null); setLocation(null); setFormData({ ...formData, destinationUrl: '' }); }}
                                        className="text-gray-500 text-sm hover:underline"
                                    >
                                        Create Another
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Side (Map) */}
                    <div className="md:w-1/2 bg-gray-100 relative h-96 md:h-auto">
                        <div className="absolute bottom-4 left-4 z-10 bg-white/90 backdrop-blur px-3 py-1 rounded shadow text-xs font-semibold text-gray-600">
                            {location ? `Selected: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Click map to select location'}
                        </div>
                        <MapSelector onLocationSelect={setLocation} />
                    </div>

                </div>
            </div>
        </div>
    );
};

export default CreateLink;
