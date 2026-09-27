import React, { useState, useEffect } from 'react';
import { Search, Moon, Sun, Bell, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import './AppShell.css';
import { useNavigate } from 'react-router-dom';

const Topbar = () => {
    const { currentUser, logout } = useAuth();
    const { unreadCount } = useNotifications();
    const [isDark, setIsDark] = useState(false);
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Theme initialization
        const currentTheme = document.documentElement.classList.contains('dark');
        setIsDark(currentTheme);
    }, []);

    const toggleTheme = () => {
        if (isDark) {
            document.documentElement.classList.remove('dark');
            setIsDark(false);
        } else {
            document.documentElement.classList.add('dark');
            setIsDark(true);
        }
    };

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="topbar">
            <div className="topbar-left">
                <div className="search-box">
                    <Search className="search-icon" size={18} />
                    <input type="text" placeholder="Search across modules..." />
                </div>
            </div>

            <div className="topbar-right">
                <button className="icon-btn" onClick={toggleTheme} title="Toggle Theme">
                    {isDark ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                <button className="icon-btn" title="Notifications" onClick={() => navigate('/app/notifications')}>
                    <Bell size={20} />
                    {unreadCount > 0 && (
                        <span className="notification-badge">{unreadCount}</span>
                    )}
                </button>

                <div 
                    className="user-menu" 
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    style={{ position: 'relative' }}
                >
                    <div className="avatar">
                        {getInitials(`${currentUser?.firstName} ${currentUser?.lastName}`)}
                    </div>
                    <div className="user-info">
                        <span className="user-name">{currentUser?.firstName} {currentUser?.lastName}</span>
                        <span className="user-role">{currentUser?.roles?.[0] || 'User'}</span>
                    </div>
                    <ChevronDown size={16} color="var(--text-muted)" />

                    {/* Simple Dropdown inline for now */}
                    {showUserDropdown && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            marginTop: '8px',
                            backgroundColor: 'var(--bg-color)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            boxShadow: 'var(--shadow-lg)',
                            minWidth: '150px',
                            zIndex: 50,
                            overflow: 'hidden'
                        }}>
                            <button 
                                onClick={() => navigate('/app/profile')}
                                style={{ display: 'block', width: '100%', padding: '12px 16px', textAlign: 'left', color: 'var(--text-main)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                            >
                                Profile
                            </button>
                            <button 
                                onClick={() => navigate('/app/settings')}
                                style={{ display: 'block', width: '100%', padding: '12px 16px', textAlign: 'left', color: 'var(--text-main)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                            >
                                Settings
                            </button>
                            <div style={{ height: '1px', backgroundColor: 'var(--border-color)' }}></div>
                            <button 
                                onClick={handleLogout}
                                style={{ display: 'block', width: '100%', padding: '12px 16px', textAlign: 'left', color: 'var(--danger-color)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                            >
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Topbar;
