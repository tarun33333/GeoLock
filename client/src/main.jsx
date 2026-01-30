import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("ErrorBoundary caught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '40px', backgroundColor: '#fff', color: '#333' }}>
                    <h1 style={{ fontSize: '24px', marginBottom: '10px', color: '#e53e3e' }}>Application Crash Detected</h1>
                    <p>Please share this error with the developer:</p>
                    <pre style={{ backgroundColor: '#f3f4f6', padding: '15px', borderRadius: '5px', overflow: 'auto', marginTop: '20px', border: '1px solid #ddd' }}>
                        {this.state.error && this.state.error.toString()}
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </pre>
                </div>
            );
        }
        return this.props.children;
    }
}

import { GoogleOAuthProvider } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ErrorBoundary>
            <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                <App />
            </GoogleOAuthProvider>
        </ErrorBoundary>
    </React.StrictMode>,
)
