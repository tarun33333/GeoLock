import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import AuthForm from './pages/AuthForm';
import Dashboard from './pages/Dashboard';
import Landing from './pages/Landing';
import CreateLink from './pages/CreateLink';
import EditLink from './pages/EditLink';
import LockedLink from './pages/LockedLink';
import Pricing from './pages/Pricing';
import PaymentSuccess from './pages/PaymentSuccess';
import Profile from './pages/Profile';

import CustomCursor from './components/CustomCursor';
import CursorEffect from './components/CursorEffect';

const Layout = ({ children }) => {
    const { theme, toggleTheme } = useTheme();

    return (
        <div className={`min-h-screen transition-colors duration-500 ${theme === 'dark' ? 'bg-gradient-to-br from-gray-900 via-[#0f172a] to-black' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'}`}>
            <CursorEffect theme={theme} />
            <CustomCursor />

            {/* Global Theme Toggle Button */}
            <button
                onClick={toggleTheme}
                className={`fixed top-6 right-6 z-[100] p-3 rounded-full backdrop-blur-md border shadow-lg hover:scale-110 active:scale-95 transition-all group ${theme === 'dark'
                        ? 'bg-white/10 border-white/20 text-yellow-400 hover:bg-white/20'
                        : 'bg-white/80 border-gray-200 text-gray-600 hover:bg-white hover:text-blue-600'
                    }`}
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
                {theme === 'dark' ? (
                    <span className="text-xl">☀️</span>
                ) : (
                    <span className="text-xl">🌙</span>
                )}
            </button>

            {children}
        </div>
    );
};

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                    <Layout>
                        <Routes>
                            <Route path="/" element={<Landing />} />
                            <Route path="/login" element={<AuthForm />} />
                            <Route path="/signup" element={<AuthForm />} />
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/create" element={<CreateLink />} />
                            <Route path="/edit/:id" element={<EditLink />} />
                            <Route path="/l/:slug" element={<LockedLink />} />
                            <Route path="/pricing" element={<Pricing />} />
                            <Route path="/payment-success" element={<PaymentSuccess />} />
                            <Route path="/profile" element={<Profile />} />
                        </Routes>
                    </Layout>
                </Router>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
