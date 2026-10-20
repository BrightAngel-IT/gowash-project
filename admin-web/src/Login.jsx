import React, { useState } from 'react';
import axios from 'axios';
import { 
    Shirt, 
    Lock, 
    Mail, 
    ShieldCheck, 
    Store, 
    Eye, 
    EyeOff, 
    ArrowRight, 
    Sparkles, 
    Activity, 
    AlertCircle, 
    Loader2, 
    Layers,
    Server
} from 'lucide-react';
import './Login.css';
import { API_URL } from './config';

function Login({ onLogin }) {
    const [loginType, setLoginType] = useState('admin'); // 'superadmin' or 'admin'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
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
                    setError('Access Denied: Customers must use the GoWash mobile application.');
                } else {
                    setError('Access denied. Administrator credentials required.');
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid credentials. Please verify and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            {/* Ambient Background Glowing Orbs */}
            <div className="glow-orb glow-orb-1" />
            <div className="glow-orb glow-orb-2" />
            <div className="glow-orb glow-orb-3" />
            <div className="bg-grid-overlay" />

            <div className="login-shell">
                {/* Left Hero Showcase */}
                <div className="login-hero-panel">
                    <div className="hero-brand">
                        <div className="brand-logo-icon">
                            <Shirt size={28} strokeWidth={2.2} />
                            <div className="logo-sparkle-dot">
                                <Sparkles size={12} />
                            </div>
                        </div>
                        <div className="brand-text">
                            <span className="brand-title">GoWash</span>
                            <span className="brand-badge">ENTERPRISE</span>
                        </div>
                    </div>

                    <div className="hero-content">
                        <div className="hero-pill">
                            <Activity size={14} className="pulse-icon" />
                            <span>Real-Time Fleet & Laundry Control</span>
                        </div>
                        <h1 className="hero-heading">
                            Intelligent Operations <br />
                            <span className="gradient-text">Command Portal</span>
                        </h1>
                        <p className="hero-desc">
                            Seamlessly coordinate on-demand laundry orders, branch capacity, 
                            tuk driver assignments, and live revenue analytics with sub-second precision.
                        </p>

                        <div className="hero-feature-cards">
                            <div className="feature-card">
                                <div className="feature-icon bg-blue">
                                    <Store size={18} />
                                </div>
                                <div>
                                    <h4>Multi-Branch Routing</h4>
                                    <p>Live management across Central, Kandy, & Galle hubs</p>
                                </div>
                            </div>
                            <div className="feature-card">
                                <div className="feature-icon bg-purple">
                                    <Layers size={18} />
                                </div>
                                <div>
                                    <h4>Smart Order Allocation</h4>
                                    <p>Automated driver dispatch with dynamic distance pricing</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="hero-footer-status">
                        <div className="status-live-indicator">
                            <span className="live-dot" />
                            <span>System Status: <strong>All Clusters Operational</strong></span>
                        </div>
                        <div className="security-tag">
                            <Server size={14} />
                            <span>v2.5 Enterprise</span>
                        </div>
                    </div>
                </div>

                {/* Right Form Card */}
                <div className="login-card-container">
                    <div className="login-card">
                        <div className="card-top-header">
                            <h2>Sign In</h2>
                            <p>Enter your authorized administrator credentials to continue</p>
                        </div>

                        {/* Interactive Role Switcher */}
                        <div className="role-switch-container">
                            <button
                                type="button"
                                className={`role-pill ${loginType === 'admin' ? 'active' : ''}`}
                                onClick={() => { setLoginType('admin'); setError(''); }}
                            >
                                <Store size={16} />
                                <span>Branch Admin</span>
                            </button>
                            <button
                                type="button"
                                className={`role-pill ${loginType === 'superadmin' ? 'active' : ''}`}
                                onClick={() => { setLoginType('superadmin'); setError(''); }}
                            >
                                <ShieldCheck size={16} />
                                <span>Super Admin</span>
                            </button>
                        </div>

                        {/* Error Alert */}
                        {error && (
                            <div className="error-banner">
                                <AlertCircle size={18} />
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="auth-form">
                            <div className="form-field">
                                <label className="field-label">
                                    {loginType === 'superadmin' ? 'Email Address' : 'Branch Username or Email'}
                                </label>
                                <div className="input-box">
                                    <div className="input-icon">
                                        <Mail size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        className="field-input"
                                        placeholder={loginType === 'superadmin' ? 'superadmin@gowash.com' : 'e.g. central or branch@gowash.com'}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        autoComplete="username"
                                    />
                                </div>
                            </div>

                            <div className="form-field">
                                <div className="field-label-row">
                                    <label className="field-label">Password</label>
                                    <span className="field-hint">Encrypted</span>
                                </div>
                                <div className="input-box">
                                    <div className="input-icon">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        className="field-input with-toggle"
                                        placeholder="••••••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle-btn"
                                        onClick={() => setShowPassword(!showPassword)}
                                        title={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                className={`submit-action-btn ${loading ? 'loading' : ''}`} 
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={18} className="spinner" />
                                        <span>Authenticating Session...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Access {loginType === 'superadmin' ? 'Super Admin Portal' : 'Branch Dashboard'}</span>
                                        <ArrowRight size={18} className="arrow-icon" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="card-compliance-footer">
                            <ShieldCheck size={13} />
                            <span>Protected by GoWash Enterprise SSO & 256-bit TLS Encryption</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
