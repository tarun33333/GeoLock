import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const isActive = (path) => location.pathname === path;

    const navLinks = [
        { name: 'Home', path: '/' },
        { name: 'Dashboard', path: '/dashboard' },
        { name: 'Pricing', path: '/pricing' },
        ...(user ? [{ name: 'Profile', path: '/profile' }] : []),
    ];

    return (
        <nav className="fixed top-4 left-0 right-0 z-50 px-4 md:px-8">
            <div className="max-w-7xl mx-auto backdrop-blur-md bg-white/70 border border-white/40 shadow-lg rounded-2xl transition-all duration-300">
                <div className="flex justify-between items-center h-16 px-6">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2 group">
                        <img src="/logo.svg" alt="GeoQR Logo" className="w-10 h-10 group-hover:rotate-12 transition-transform" />
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-blue-500">
                            GeoQR
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.path}
                                className={`text-sm font-medium transition-colors duration-200 ${isActive(link.path)
                                    ? 'text-blue-600 font-bold'
                                    : 'text-gray-600 hover:text-blue-500'
                                    }`}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    {/* Auth Section */}
                    <div className="hidden md:flex items-center space-x-4">
                        {user ? (
                            <div className="flex items-center space-x-4">
                                <Link to="/profile" className="flex items-center space-x-2 group">
                                    <div className="h-8 w-8 rounded-full overflow-hidden border border-blue-200 bg-gray-100 flex items-center justify-center">
                                        {user.profileImage ? (
                                            <img src={user.profileImage} alt="Profile" className="h-full w-full object-cover" />
                                        ) : (
                                            <span className="text-xs font-bold text-blue-600">{user.name.charAt(0).toUpperCase()}</span>
                                        )}
                                    </div>
                                    <span className="text-sm text-gray-700 font-medium group-hover:text-blue-600 transition">
                                        Hi, {user.name}
                                        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full border ${user.plan === 'business' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                            user.plan === 'pro' ? 'bg-green-100 text-green-700 border-green-200' :
                                                'bg-gray-100 text-gray-600 border-gray-200'
                                            }`}>
                                            {(user.plan || 'Free').toUpperCase()}
                                        </span>
                                    </span>
                                </Link>
                                <div className="h-4 w-px bg-gray-200"></div>
                                <button
                                    onClick={logout}
                                    className="text-sm text-red-500 hover:text-red-700 font-medium"
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-3">
                                <Link
                                    to="/login"
                                    className="text-sm font-medium text-gray-600 hover:text-blue-600"
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/signup"
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl shadow-lg shadow-blue-500/30 transition-all hover:scale-105"
                                >
                                    Signup
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="text-gray-600 focus:outline-none"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {isMobileMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden border-t border-gray-100 px-4 pt-2 pb-4 space-y-2 bg-white/50 backdrop-blur-xl rounded-b-2xl">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`block px-3 py-2 rounded-md text-base font-medium ${isActive(link.path)
                                    ? 'text-blue-600 bg-blue-50'
                                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                                    }`}
                            >
                                {link.name}
                            </Link>
                        ))}
                        <div className="border-t border-gray-100 my-2 pt-2">
                            {user ? (
                                <div className="space-y-2">
                                    <div className="px-3 py-2 text-sm text-gray-700">
                                        Signed in as <span className="font-bold">{user.name}</span>
                                        <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded-full">{(user.plan || 'free').toUpperCase()}</span>
                                    </div>
                                    <button
                                        onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                                        className="block w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 rounded-md"
                                    >
                                        Logout
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Link
                                        to="/login"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Login
                                    </Link>
                                    <Link
                                        to="/signup"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="block px-3 py-2 rounded-md text-base font-medium bg-blue-600 text-white hover:bg-blue-700 text-center"
                                    >
                                        Signup
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
