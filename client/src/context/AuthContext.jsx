import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkUserLoggedIn();
    }, []);

    const checkUserLoggedIn = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            try {
                const res = await axios.get(`${API_URL}/api/auth/me`);
                setUser(res.data.data);
            } catch (err) {
                localStorage.removeItem('token');
                delete axios.defaults.headers.common['Authorization'];
                setUser(null);
            }
        }
        setLoading(false);
    };

    const login = async (email, password) => {
        const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
        if (res.data.token) {
            localStorage.setItem('token', res.data.token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
            setUser(res.data.user);
        }
        return res.data;
    };

    const verify2FALogin = async (email, token) => {
        const res = await axios.post(`${API_URL}/api/auth/2fa/verify-login`, { email, token });
        localStorage.setItem('token', res.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        setUser(res.data.user);
        return res.data;
    };

    const setup2FA = async () => {
        const res = await axios.get(`${API_URL}/api/auth/2fa/setup`);
        return res.data;
    };

    const enable2FA = async (token) => {
        const res = await axios.post(`${API_URL}/api/auth/2fa/enable`, { token });
        return res.data;
    };

    const disable2FA = async (token) => {
        const res = await axios.post(`${API_URL}/api/auth/2fa/disable`, { token });
        return res.data;
    };

    const register = async (name, email, password) => {
        const res = await axios.post(`${API_URL}/api/auth/register`, { name, email, password });
        localStorage.setItem('token', res.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        setUser(res.data.user);
        return res.data;
    };

    const socialLogin = async (type, payload) => {
        // payload will contain the token from Google/Facebook
        try {
            const res = await axios.post(`${API_URL}/api/auth/social-login`, { type, ...payload });
            localStorage.setItem('token', res.data.token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
            setUser(res.data.user);
            return res.data;
        } catch (err) {
            throw err;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{
            user, login, register, logout, socialLogin, loading,
            refreshUser: checkUserLoggedIn,
            verify2FALogin, setup2FA, enable2FA, disable2FA
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
