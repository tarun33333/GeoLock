import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import Navbar from '../components/Navbar';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const rawAppUrl = import.meta.env.VITE_APP_BASE_URL || window.location.origin;
const APP_URL = rawAppUrl.replace(/\/$/, '');

const Dashboard = () => {
    const { user, logout, loading } = useAuth();
    const [links, setLinks] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && !user) {
            navigate('/login');
        } else if (user) {
            fetchLinks();
        }
    }, [user, loading, navigate]);

    const fetchLinks = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/user-links`, {
                params: { userId: user.id }
            });
            setLinks(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this link?')) {
            try {
                await axios.delete(`${API_URL}/api/links/${id}`);
                setLinks(links.filter(link => link._id !== id));
            } catch (err) {
                alert('Failed to delete');
            }
        }
    };

    if (loading) return <div className="p-10 text-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            {/* Main Content */}
            <div className="max-w-7xl mx-auto pt-24 pb-10 px-4 sm:px-6 lg:px-8">
                <h2 className="text-2xl font-bold mb-6">Your GeoQR Dashboard</h2>

                {links.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-lg shadow">
                        <p className="text-gray-500 text-lg mb-4">You haven't created any links yet.</p>
                        <Link to="/create" className="text-blue-600 hover:underline">Create your first GeoQR Link</Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {links.map(link => (
                            <div key={link._id} className="bg-white rounded-lg shadow p-6 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-lg font-semibold text-gray-800 truncate" title={link.destinationUrl}>
                                            {link.destinationUrl}
                                        </h3>
                                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                            {link.scanCount} Scans
                                        </span>
                                    </div>
                                    <div className="flex justify-center mb-4 bg-gray-50 p-2 rounded">
                                        <QRCodeSVG value={`${APP_URL}/l/${link.slug}`} size={100} data-qr-id={link._id} />
                                    </div>
                                    <p className="text-xs text-center text-gray-500 mb-2 truncate">
                                        {APP_URL}/l/{link.slug}
                                    </p>
                                    <div className="text-sm text-gray-600 mb-2">
                                        <p>Radius: {link.radius}m</p>
                                        <p>Created: {new Date(link.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-gray-100">
                                    <button
                                        onClick={() => window.open(`${APP_URL}/l/${link.slug}`, '_blank')}
                                        className="text-blue-600 hover:text-blue-800 text-sm"
                                    >
                                        Test
                                    </button>
                                    <button
                                        onClick={() => {
                                            const svg = document.querySelector(`[data-qr-id="${link._id}"]`);
                                            if (svg) {
                                                const svgData = new XMLSerializer().serializeToString(svg);
                                                const canvas = document.createElement('canvas');
                                                const ctx = canvas.getContext('2d');
                                                const img = new Image();
                                                img.onload = () => {
                                                    canvas.width = img.width;
                                                    canvas.height = img.height;
                                                    ctx.drawImage(img, 0, 0);
                                                    const a = document.createElement('a');
                                                    a.download = `geoqr-${link.slug}.png`;
                                                    a.href = canvas.toDataURL('image/png');
                                                    a.click();
                                                };
                                                img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
                                            } else {
                                                alert('QR Code not ready');
                                            }
                                        }}
                                        className="text-green-600 hover:text-green-800 text-sm"
                                    >
                                        Download
                                    </button>
                                    <Link
                                        to={`/edit/${link._id}`}
                                        className="text-gray-600 hover:text-gray-800 text-sm"
                                    >
                                        Edit
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(link._id)}
                                        className="text-red-600 hover:text-red-800 text-sm"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
