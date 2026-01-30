import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const Landing = () => {
    const { user } = useAuth();
    return (
        <div className="min-h-screen bg-white flex flex-col">
            <Navbar />
            <div className="pt-20 flex-grow flex flex-col">
                <main className="flex-grow flex flex-col items-center justify-center text-center p-6">
                    <div className="max-w-3xl">
                        <h2 className="text-5xl font-extrabold text-gray-900 leading-tight mb-6">
                            Make Links Physical. <br />
                            <span className="text-blue-600">Lock Content to a Location.</span>
                        </h2>
                        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
                            Create QR codes that only open when the user is physically present at a specific location. Perfect for scavenger hunts, secure check-ins, and localized deals.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/create" className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition transform hover:-translate-y-1">
                                Create a Geo-Link (Free)
                            </Link>
                            <button className="px-8 py-4 bg-gray-100 text-gray-700 text-lg font-semibold rounded-lg hover:bg-gray-200 transition">
                                How it works
                            </button>
                        </div>
                    </div>

                    <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl">
                        <div className="p-6 bg-gray-50 rounded-xl">
                            <div className="text-4xl mb-4">📍</div>
                            <h3 className="text-xl font-bold mb-2">Pin a Location</h3>
                            <p className="text-gray-600">Select any spot on the world map and set a radius (min 50m).</p>
                        </div>
                        <div className="p-6 bg-gray-50 rounded-xl">
                            <div className="text-4xl mb-4">🔗</div>
                            <h3 className="text-xl font-bold mb-2">Get a Link & QR</h3>
                            <p className="text-gray-600">We generate a unique link and QR code for you to share or print.</p>
                        </div>
                        <div className="p-6 bg-gray-50 rounded-xl">
                            <div className="text-4xl mb-4">🔓</div>
                            <h3 className="text-xl font-bold mb-2">Unlock on Arrival</h3>
                            <p className="text-gray-600">Users must grant location access to unlock the destination URL.</p>
                        </div>
                    </div>
                </main>

                <footer className="py-6 text-center text-gray-400 text-sm">
                    &copy; 2024 GeoLock. Built for builders.
                </footer>
            </div>
        </div>
    );
};

export default Landing;
