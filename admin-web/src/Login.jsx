import React, { useState } from 'react';
import axios from 'axios';
import { Shirt, Lock, Mail } from 'lucide-react';
import './Login.css';
import { API_URL } from './config';

function Login({ onLogin }) {
    const [loginType, setLoginType] = useState('admin'); // 'superadmin' or 'admin'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post(`${API_URL}/auth/login`, {
                email,
                password
            });

            if (response.data && response.data.user) {
                const user = response.data.user;
                // Basic check to ensure they are logging into the right section (optional, but helpful)
                if (loginType === 'superadmin' && user.role !== 'superadmin') {
                    setError('This account is not authorized as Super Admin.');
                    setLoading(false);
                    return;
                }

                if (user.role === 'admin' || user.role === 'superadmin') {
                    localStorage.setItem('gowash_token', response.data.token);
                    localStorage.setItem('gowash_user', JSON.stringify(user));
                    onLogin(user);
                } else if (user.role === 'customer') {
                    setError('Access Denied: Customers must use the mobile application.');
                } else {
                    setError('Access denied. Administrator credentials required.');
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    const fillDemoCredentials = () => {
        if (loginType === 'superadmin') {
            setEmail('superadmin@gowash.com');
            setPassword('admin123');
        } else {
            setEmail('central');
            setPassword('admin123');
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <div className="login-logo">
                        <Shirt size={48} />
                    </div>
                    <h1>GoWash Admin</h1>
                    <p>Enter your credentials to access the portal</p>
                </div>

                <div className="role-selector">
                    <button
                        className={`role-tab ${loginType === 'admin' ? 'active' : ''}`}
                        onClick={() => { setLoginType('admin'); setError(''); }}
                    >
                        Laundry Admin
                    </button>
                    <button
                        className={`role-tab ${loginType === 'superadmin' ? 'active' : ''}`}
                        onClick={() => { setLoginType('superadmin'); setError(''); }}
                    >
                        Super Admin
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label>{loginType === 'superadmin' ? 'Email Address' : 'Username or Email'}</label>
                        <div className="input-wrapper">
                            <Mail size={20} />
                            <input
                                type="text"
                                placeholder={loginType === 'superadmin' ? 'admin@gowash.com' : 'Your branch username'}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <div className="input-wrapper">
                            <Lock size={20} />
                            <input
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? 'Authenticating...' : `Sign In as ${loginType === 'superadmin' ? 'Super Admin' : 'Laundry Admin'}`}
                    </button>

                    <div className="demo-section">
                        <p className="demo-text">Quick access for testing</p>
                        <button type="button" onClick={fillDemoCredentials} className="demo-btn">
                            Use {loginType === 'superadmin' ? 'Super Admin' : 'Laundry Admin'} Demo
                        </button>
                    </div>
                </form>

                <div className="login-footer">
                    <p>© 2026 GoWash Enterprise. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
}

export default Login;
