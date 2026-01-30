import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
// geolib removed - using server-side validation

const LockedLink = () => {
  const { slug } = useParams();
  const [status, setStatus] = useState('checking'); // checking, granting, success, denied, error
  const [message, setMessage] = useState('Initializing...');
  const [destination, setDestination] = useState(null);

  useEffect(() => {
    // Initial fetch to ensure link exists
    // But mainly we waiting for user action to get location.
    setMessage('Please allow location access to verify you are in the correct area.');
    setStatus('granting');
  }, [slug]);

  const verifyLocation = async (position) => {
    setStatus('checking');
    setMessage('Verifying your location...');

    try {
      const { latitude, longitude } = position.coords;
      const rawApiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const API_URL = rawApiUrl.replace(/\/$/, '');
      const res = await axios.post(`${API_URL}/api/verify/${slug}`, {
        lat: latitude,
        lng: longitude
      });

      if (res.data.success) {
        setStatus('success');
        setDestination(res.data.destinationUrl);
        // Auto redirect after delay
        setTimeout(() => {
          window.location.href = res.data.destinationUrl;
        }, 2000);
      } else {
        setStatus('denied');
        setMessage(res.data.error || 'Access Denied.');
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 403) {
        setStatus('denied');
        setMessage(err.response.data.error);
      } else {
        setStatus('error');
        setMessage('Failed to verify location. Server might be unreachable.');
      }
    }
  };

  const handleGrantLocation = () => {
    if (!navigator.geolocation) {
      setStatus('error');
      setMessage('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      verifyLocation,
      (err) => {
        setStatus('denied');
        setMessage('Location access denied. We cannot verify your presence.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <img src="/logo.svg" alt="GeoQR Logo" className="w-16 h-16 mb-6 animate-bounce-slow" />
      <div className="max-w-md w-full bg-gray-800 p-8 rounded-2xl shadow-xl text-center">
        {status === 'granting' && (
          <>
            <div className="text-6xl mb-4">📍</div>
            <h2 className="text-2xl font-bold mb-2">Location Check Required</h2>
            <p className="text-gray-400 mb-6">{message}</p>
            <button
              onClick={handleGrantLocation}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-full transition transform hover:scale-105"
            >
              Grant Location
            </button>
          </>
        )}

        {status === 'checking' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-lg">Verifying...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-6xl mb-4">🔓</div>
            <h2 className="text-2xl font-bold text-green-400 mb-2">Access Granted</h2>
            <p className="text-gray-300">Redirecting to destination...</p>
            <div className="mt-4">
              <a href={destination} className="text-blue-400 underline">{destination}</a>
            </div>
          </>
        )}

        {status === 'denied' && (
          <>
            <div className="text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-red-500 mb-2">Access Denied</h2>
            <p className="text-gray-300 mb-4">{message}</p>
            <button onClick={() => window.location.reload()} className="text-sm text-gray-500 underline">Try Again</button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-yellow-500 mb-2">Error</h2>
            <p className="text-gray-300">{message}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default LockedLink;
