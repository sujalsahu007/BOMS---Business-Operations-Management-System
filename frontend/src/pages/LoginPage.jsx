import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Lock, AlertCircle, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';
import './LoginPage.css';

const LoginPage = () => {
    const [usernameOrEmail, setUsernameOrEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (!usernameOrEmail || !password) {
            setError("Username/Email and Password are required.");
            return;
        }

        setIsLoading(true);
        try {
            await login(usernameOrEmail, password);
            navigate('/app');
        } catch (err) {
            if (err.response && err.response.status === 401) {
                setError("Invalid username or password.");
            } else {
                setError("Unable to sign in. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-page-wrapper">
            
            <div className="login-bg-circles"></div>
            <div className="login-bg-dots"></div>

            <div className="login-content-wrapper">
                
                {/* Custom SVG Logo matching screenshot exactly */}
                <div className="login-header-section">
                    <img src="/hosho-logo.jpg" alt="Hosho Digital" style={{ width: '64px', height: '64px', objectFit: 'contain', borderRadius: '8px' }} />
                    {/* HOSHO Text */}
                    <div style={{ marginTop: '12px', textAlign: 'center' }}>
                        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '24px', fontWeight: '800', color: '#ffffff', letterSpacing: '1px', lineHeight: '1' }}>
                            HOSHO
                        </div>
                        {/* DIGITAL Text */}
                        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: '700', color: '#dc2626', letterSpacing: '8px', marginTop: '4px' }}>
                            DIGITAL
                        </div>
                    </div>
                </div>

                {/* Form Card */}
                <div className="login-form-container">
                    <h2 className="login-card-title">Welcome back</h2>
                    <p className="login-card-subtitle">Sign in to continue to HOSHO BOMS</p>

                    {error && (
                        <div className="login-error-banner" role="alert">
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="login-form" noValidate>
                        
                        <div className="login-input-group">
                            <label className="login-label" htmlFor="usernameOrEmail">Username or Email</label>
                            <div className="login-input-wrapper">
                                <User size={18} className="login-input-icon" />
                                <input 
                                    id="usernameOrEmail"
                                    type="text" 
                                    value={usernameOrEmail}
                                    onChange={e => setUsernameOrEmail(e.target.value)}
                                    className="login-input"
                                    placeholder="Enter your username or email"
                                    autoComplete="username"
                                    required
                                />
                            </div>
                        </div>
                        
                        <div className="login-input-group">
                            <label className="login-label" htmlFor="password">Password</label>
                            <div className="login-input-wrapper">
                                <Lock size={18} className="login-input-icon" />
                                <input 
                                    id="password"
                                    type={showPassword ? "text" : "password"} 
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="login-input"
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                    required
                                />
                                <button 
                                    type="button" 
                                    className="login-password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="login-options-row">
                            <label className="login-checkbox-group">
                                <input type="checkbox" className="login-checkbox" />
                                <span>Remember me</span>
                            </label>
                            <a href="#" className="login-forgot-link">Forgot password?</a>
                        </div>
                        
                        <button 
                            type="submit" 
                            className="login-submit-btn"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="login-spinner"></div>
                            ) : (
                                <>
                                    <span>Sign In</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="login-divider">or</div>
                    
                    <div className="login-secure-info">
                        <ShieldCheck size={16} />
                        <span>Secure and trusted access</span>
                    </div>

                </div>

                {/* Footer Section */}
                <div className="login-footer">
                    &copy; HOSHO Digital. All rights reserved.
                </div>

            </div>
        </div>
    );
};

export default LoginPage;
