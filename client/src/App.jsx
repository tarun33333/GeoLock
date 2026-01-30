import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AuthForm from './pages/AuthForm';
import Dashboard from './pages/Dashboard';
import Landing from './pages/Landing';
import CreateLink from './pages/CreateLink';
import EditLink from './pages/EditLink';
import LockedLink from './pages/LockedLink';
import Pricing from './pages/Pricing';
import PaymentSuccess from './pages/PaymentSuccess';
import Profile from './pages/Profile';

function App() {
    return (
        <AuthProvider>
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
            </Router>
        </AuthProvider>
    );
}

export default App;
