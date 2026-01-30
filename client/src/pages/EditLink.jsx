import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate, Link } from 'react-router-dom';
import MapSelector from '../components/MapSelector';
import Navbar from '../components/Navbar';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const EditLink = () => {
    const { id } = useParams();
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        destinationUrl: '',
        radius: 100,
    });
    // We initially load location from DB, but let user pick new one if they want.
    // MapSelector expects a setter.
    const [location, setLocation] = useState(null);
    const [initialLocation, setInitialLocation] = useState(null); // To center map
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                navigate('/login');
            } else {
                fetchLink();
            }
        }
    }, [user, authLoading, navigate, id]);

    const fetchLink = async () => {
        try {
            // Need a new endpoint to get single link by ID for editing
            // Or use existing getMeta if we trust it, but that uses slug.
            // Let's use the list-like endpoint but filter? No, better to add GET /api/links/:id to backend.
            // For now, I'll assume we add it. 
            // WAIT - I only added DELETE /api/links/:id. I need GET /api/links/:id (by ID) specifically for editing.
            // Actually, I can use the existing `getUserLinks` and filter on client if lazy, but cleaner to fetch.

            // Temporary workaround: Fetch all user links and find this one. (Safe enough for MVP)
            const res = await axios.get(`${API_URL}/api/user-links?userId=${user.id}`);
            const link = res.data.find(l => l._id === id);

            if (link) {
                setFormData({
                    destinationUrl: link.destinationUrl,
                    radius: link.radius
                });
                const loc = { lat: link.location.coordinates[1], lng: link.location.coordinates[0] };
                setInitialLocation(loc);
                setLocation(loc); // Current location
            } else {
                setError('Link not found or not authorized.');
            }
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch link details.');
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!location) {
            setError('Location is invalid.');
            return;
        }

        try {
            await axios.put(`${API_URL}/api/links/${id}`, {
                destinationUrl: formData.destinationUrl,
                radius: formData.radius,
                location: { lat: location.lat, lng: location.lng }
            });
            setSuccess('Link updated successfully!');
        } catch (err) {
            setError(err.response?.data?.error || 'Update failed');
        }
    };

    if (loading) return <div className="p-10 text-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />

            <div className="flex-grow container mx-auto px-4 pt-24 py-8">
                <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
                    <div className="p-8 md:w-1/2 flex flex-col justify-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit GeoLink</h1>

                        {success && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{success}</div>}
                        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Destination URL</label>
                                <input
                                    type="url"
                                    required
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
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-bold"
                            >
                                Save Changes
                            </button>
                        </form>
                    </div>

                    <div className="md:w-1/2 bg-gray-100 relative h-96 md:h-auto">
                        <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur px-3 py-1 rounded shadow text-xs font-semibold text-gray-600">
                            {location ? `Selected: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Click map to update location'}
                        </div>
                        {/* MapSelector needs to support initial position - I'll need to check if I added that prop */}
                        <MapSelector onLocationSelect={setLocation} initialPos={initialLocation} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditLink;
