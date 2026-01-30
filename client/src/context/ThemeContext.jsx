import React, { createContext, useState, useContext, useLayoutEffect, useEffect } from 'react';
import Cookies from 'js-cookie';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // Check cookies, local storage or system preference
    const [theme, setTheme] = useState(() => {
        const savedTheme = Cookies.get('geoqr-theme') || localStorage.getItem('geoqr-theme');
        if (savedTheme) {
            // Sync back to cookie if missing (migration)
            if (!Cookies.get('geoqr-theme')) {
                Cookies.set('geoqr-theme', savedTheme, { expires: 365, path: '/' });
            }
            return savedTheme;
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    useLayoutEffect(() => {
        // Apply global class to body/html immediately to prevent flash
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    useEffect(() => {
        // Save to cookie (preferred) and localStorage (backup/legacy)
        Cookies.set('geoqr-theme', theme, { expires: 365, path: '/' });
        localStorage.setItem('geoqr-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
