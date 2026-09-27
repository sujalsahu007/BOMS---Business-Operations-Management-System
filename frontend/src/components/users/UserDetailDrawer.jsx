import React, { useState, useEffect } from 'react';
import { X, User, Shield, Mail, Calendar, Key } from 'lucide-react';
import { api } from '../../services/api';
import ActivityTimeline from '../shared/ActivityTimeline';
import SharedDrawer from '../shared/SharedDrawer';
import './UserDetailDrawer.css';

const UserDetailDrawer = ({ isOpen, onClose, userId }) => {
    const [user, setUser] = useState(null);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activitiesLoading, setActivitiesLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && userId) {
            fetchUser();
            fetchActivities();
        }
    }, [isOpen, userId]);

    const fetchUser = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.get(`/users/${userId}`);
            setUser(res.data);
        } catch (err) {
            setError('Failed to load user details.');
        } finally {
            setLoading(false);
        }
    };

    const fetchActivities = async () => {
        setActivitiesLoading(true);
        try {
            const res = await api.get(`/activities/User/${userId}?pageSize=20`);
            setActivities(res.data.items);
        } catch (err) {
            console.error('Failed to load activities', err);
        } finally {
            setActivitiesLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <SharedDrawer
            isOpen={isOpen}
            onClose={onClose}
            title="User Details"
            subtitle={user ? `@${user.username}` : 'Loading...'}
            icon={User}
            width="640px"
        >
            <div className="drawer-content-inner user-detail-drawer">
                    {loading ? (
                        <div className="drawer-loading">Loading user details...</div>
                    ) : error ? (
                        <div className="drawer-error">{error}</div>
                    ) : user ? (
                        <>
                            <div className="user-profile-header">
                                <div className="profile-avatar-large">
                                    {user.firstName?.[0]}{user.lastName?.[0]}
                                </div>
                                <div className="profile-titles">
                                    <h3>{user.firstName} {user.lastName}</h3>
                                    <span className={`status-badge ${user.status.toLowerCase()}`}>{user.status}</span>
                                </div>
                            </div>
                            
                            <div className="detail-section">
                                <h4>Account Information</h4>
                                <div className="info-grid">
                                    <div className="info-item">
                                        <User size={14} />
                                        <span className="info-label">Username</span>
                                        <span className="info-value">@{user.username}</span>
                                    </div>
                                    <div className="info-item">
                                        <Mail size={14} />
                                        <span className="info-label">Email</span>
                                        <span className="info-value">{user.email}</span>
                                    </div>
                                    <div className="info-item">
                                        <Calendar size={14} />
                                        <span className="info-label">Created</span>
                                        <span className="info-value">{new Date(user.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="info-item">
                                        <Key size={14} />
                                        <span className="info-label">Last Login</span>
                                        <span className="info-value">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="detail-section">
                                <h4>Roles & Access</h4>
                                <div className="roles-list">
                                    {user.roles && user.roles.length > 0 ? (
                                        user.roles.map(r => (
                                            <span key={r} className="role-badge">{r}</span>
                                        ))
                                    ) : (
                                        <span className="text-muted">No roles assigned.</span>
                                    )}
                                </div>
                            </div>

                            <div className="detail-section timeline-section">
                                <h4>Activity History</h4>
                                <ActivityTimeline activities={activities} loading={activitiesLoading} />
                            </div>
                        </>
                    ) : null}
                </div>
        </SharedDrawer>
    );
};

export default UserDetailDrawer;
