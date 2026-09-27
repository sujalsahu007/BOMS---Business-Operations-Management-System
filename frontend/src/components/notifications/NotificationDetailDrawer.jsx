import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { 
    X, Bell, Check, Settings, AlertTriangle, 
    Package, FileText, Heart, ShieldAlert,
    Clock, ExternalLink
} from 'lucide-react';
import './NotificationDetailDrawer.css';

const NotificationDetailDrawer = ({ isOpen, onClose, notificationId, onStatusChange }) => {
    const [notification, setNotification] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen && notificationId) {
            fetchNotificationDetails();
        }
    }, [isOpen, notificationId]);

    const fetchNotificationDetails = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(`/notifications/${notificationId}`);
            setNotification(response.data);
        } catch (err) {
            console.error("Failed to fetch notification", err);
            setError("Failed to load notification details.");
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async () => {
        try {
            await api.post(`/notifications/${notificationId}/read`);
            setNotification(prev => ({ ...prev, isRead: true, readAt: new Date().toISOString() }));
            if(onStatusChange) onStatusChange();
        } catch (err) {
            console.error("Failed to mark as read", err);
        }
    };

    const getIconForType = (type) => {
        switch (type?.toLowerCase()) {
            case 'system': return <Settings size={24} />;
            case 'security': return <ShieldAlert size={24} />;
            case 'inventory': return <Package size={24} />;
            case 'contract': return <FileText size={24} />;
            case 'approval': return <Check size={24} />;
            case 'loyalty': return <Heart size={24} />;
            default: return <Bell size={24} />;
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString(undefined, {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    if (!isOpen) return null;

    return (
        <div className="drawer-overlay" onClick={onClose}>
            <div className="drawer-container" onClick={e => e.stopPropagation()}>
                <div className="drawer-header">
                    <div className="drawer-title-group">
                        <div className={`drawer-icon ${notification?.type?.toLowerCase() || 'default'}`}>
                            {getIconForType(notification?.type)}
                        </div>
                        <h2>Notification Details</h2>
                    </div>
                    <button className="icon-btn-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="drawer-content">
                    {loading && (
                        <div className="drawer-loading">
                            <div className="skeleton skeleton-title"></div>
                            <div className="skeleton skeleton-text"></div>
                            <div className="skeleton skeleton-text"></div>
                            <div className="skeleton skeleton-text"></div>
                        </div>
                    )}

                    {error && (
                        <div className="error-state">
                            <AlertTriangle size={32} />
                            <p>{error}</p>
                            <button className="btn-secondary" onClick={fetchNotificationDetails}>Retry</button>
                        </div>
                    )}

                    {!loading && !error && notification && (
                        <div className="notification-detail-body">
                            <div className="detail-header-section">
                                <h3>{notification.title}</h3>
                                {notification.priority && notification.priority !== 'Normal' && (
                                    <span className={`priority-badge ${notification.priority.toLowerCase()}`}>
                                        {notification.priority} Priority
                                    </span>
                                )}
                            </div>

                            <div className="detail-meta-grid">
                                <div className="meta-item">
                                    <span className="meta-label">Status</span>
                                    <span className={`status-badge ${notification.isRead ? 'active' : 'inactive'}`}>
                                        {notification.isRead ? 'Read' : 'Unread'}
                                    </span>
                                </div>
                                <div className="meta-item">
                                    <span className="meta-label">Type</span>
                                    <span className="meta-value">{notification.type || 'General'}</span>
                                </div>
                                <div className="meta-item">
                                    <span className="meta-label">Received</span>
                                    <span className="meta-value time-val">
                                        <Clock size={14} /> {formatDate(notification.createdAt)}
                                    </span>
                                </div>
                                {notification.isRead && notification.readAt && (
                                    <div className="meta-item">
                                        <span className="meta-label">Read At</span>
                                        <span className="meta-value time-val">
                                            <Clock size={14} /> {formatDate(notification.readAt)}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="detail-message-section">
                                <h4>Message</h4>
                                <div className="message-box">
                                    <p>{notification.message}</p>
                                </div>
                            </div>

                            {notification.referenceType && notification.referenceId && (
                                <div className="detail-reference-section">
                                    <h4>Related Entity</h4>
                                    <div className="reference-card">
                                        <div className="ref-info">
                                            <span className="ref-type">{notification.referenceType}</span>
                                            <span className="ref-id">#{notification.referenceId}</span>
                                        </div>
                                        <button className="btn-secondary sm">
                                            View <ExternalLink size={14} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {!notification.isRead && (
                                <div className="detail-actions">
                                    <button className="btn-primary full-width" onClick={handleMarkAsRead}>
                                        <Check size={18} /> Mark as Read
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationDetailDrawer;
