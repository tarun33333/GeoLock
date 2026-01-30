import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { useTheme } from '../context/ThemeContext';

const Landing = () => {
    const { user } = useAuth();
    const { theme } = useTheme();

    return (
        <div className="min-h-screen flex flex-col relative overflow-hidden bg-transparent">
            {/* Navbar is typically rendered by specific pages if not in Global Layout for Nav */}
            <Navbar />
            <div className="pt-20 flex-grow flex flex-col relative z-10">
                <main className="flex-grow flex flex-col items-center justify-center text-center p-6 mt-10">
                    <div className="max-w-3xl">
                        <img src="/logo.svg" alt="GeoQR Logo" className="w-[120px] h-[120px] mx-auto mb-8 animate-bounce-slow drop-shadow-[0_0_25px_rgba(37,99,235,0.6)]" />
                        <h2 className={`text-6xl font-extrabold leading-tight mb-6 tracking-tight transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            Make Links Physical. <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">Lock Content to a Location.</span>
                        </h2>
                        <p className={`text-xl mb-12 max-w-2xl mx-auto font-light transition-colors duration-300 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                            Create QR codes that only open when the user is physically present at a specific location. Perfect for scavenger hunts, secure check-ins, and localized deals.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-6 justify-center">
                            <Link to="/create" className="px-10 py-4 bg-blue-600 text-white text-lg font-bold rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:bg-blue-500 hover:scale-105 hover:shadow-[0_0_35px_rgba(37,99,235,0.6)] transition-all duration-300 border border-blue-400/30">
                                Create a GeoQR Link (Free)
                            </Link>
                            <button className={`px-10 py-4 backdrop-blur-md text-lg font-semibold rounded-xl border transition-all hover:scale-105 ${theme === 'dark'
                                    ? 'bg-gray-800/40 text-white border-white/10 hover:bg-white/10'
                                    : 'bg-white/60 text-gray-700 border-gray-200 hover:bg-white hover:border-gray-300'
                                }`}>
                                How it works
                            </button>
                        </div>
                    </div>

                    <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full px-4">
                        {[
                            { icon: '📍', title: 'Pin a Location', desc: 'Select any spot on the world map and set a radius (min 50m) to secure your link.', color: 'blue' },
                            { icon: '🔗', title: 'Get a Link & QR', desc: 'We generate a unique, cryptographically secure link and QR code for you to share.', color: 'purple' },
                            { icon: '🔓', title: 'Unlock on Arrival', desc: 'Users must be physically present at the location to unlock and view the destination URL.', color: 'green' }
                        ].map((item, idx) => (
                            <div key={idx} className={`p-8 backdrop-blur-xl rounded-2xl border transition-all duration-300 group ${theme === 'dark'
                                    ? `bg-gray-900/40 border-white/5 hover:border-${item.color}-500/50 hover:bg-gray-800/50`
                                    : `bg-white/60 border-white/50 hover:border-${item.color}-500/30 hover:bg-white shadow-lg shadow-gray-200/50`
                                }`}>
                                <div className={`text-6xl mb-6 drop-shadow-lg transition-transform group-hover:scale-110 duration-300 delay-75`}>{item.icon}</div>
                                <h3 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{item.title}</h3>
                                <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} leading-relaxed text-lg`}>{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </main>

                <footer className={`py-12 text-center text-sm font-medium transition-colors ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                    &copy; 2026 GeoQR. Built for builders.
                </footer>
            </div>

            {/* Background Gradient Mesh */}
            <div className={`absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0 transition-opacity duration-1000 ${theme === 'dark' ? 'opacity-40' : 'opacity-20'}`}>
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse"></div>
            </div>
        </div>
    );
};

export default Landing;
