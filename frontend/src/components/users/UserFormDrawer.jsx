import React, { useState, useEffect } from 'react';
import { X, Save, Shield, User as UserIcon, Lock, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import SharedDrawer from '../shared/SharedDrawer';
import './UserFormDrawer.css';

const UserFormDrawer = ({ isOpen, onClose, userId, onSuccess, roles }) => {
    const isEdit = !!userId;
    const [activeTab, setActiveTab] = useState('details'); // 'details' | 'password'

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        status: 'Active',
        roleIds: []
    });

    const [passwordData, setPasswordData] = useState({
        password: '',
        confirmPassword: ''
    });

    useEffect(() => {
        if (isOpen && isEdit) {
            fetchUser();
        } else if (isOpen && !isEdit) {
            // Reset form
            setFormData({
                firstName: '',
                lastName: '',
                username: '',
                email: '',
                status: 'Active',
                roleIds: []
            });
            setPasswordData({ password: '', confirmPassword: '' });
            setActiveTab('details');
            setError('');
        }
    }, [isOpen, userId]);

    const fetchUser = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.get(`/users/${userId}`);
            const userData = res.data;
            const matchedRoleIds = roles
                .filter(r => userData.roles.some(ur => ur.roleId === r.roleId))
                .map(r => r.roleId);

            setFormData({
                firstName: userData.firstName,
                lastName: userData.lastName,
                username: userData.username,
                email: userData.email,
                status: userData.status,
                roleIds: matchedRoleIds
            });
        } catch (err) {
            setError('Failed to load user details.');
        } finally {
            setLoading(false);
        }
    };

    const isFormValid = () => {
        return formData.firstName && formData.lastName && formData.username && formData.email && formData.roleIds.length > 0;
    };

    const isPasswordValid = () => {
        return passwordData.password && passwordData.password === passwordData.confirmPassword;
    };

    const handleRoleToggle = (roleId) => {
        setFormData(prev => ({
            ...prev,
            roleIds: prev.roleIds.includes(roleId)
                ? prev.roleIds.filter(id => id !== roleId)
                : [...prev.roleIds, roleId]
        }));
    };

    const handleSaveDetails = async () => {
        setError('');
        setLoading(true);
        try {
            const payload = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                username: formData.username,
                email: formData.email,
                status: formData.status,
                roleIds: formData.roleIds
            };

            if (isEdit) {
                await api.put(`/users/${userId}`, payload);
            } else {
                payload.password = passwordData.password;
                await api.post('/users', payload);
            }
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred while saving.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async () => {
        setError('');
        setLoading(true);
        try {
            await api.post(`/users/${userId}/change-password`, {
                newPassword: passwordData.password
            });
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred while changing password.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <SharedDrawer
            isOpen={isOpen}
            onClose={onClose}
            title={isEdit ? 'Edit User' : 'Add New User'}
            subtitle={isEdit ? 'Modify user details and roles.' : 'Create a new user account.'}
            icon={UserIcon}
        >
                {isEdit && (
                    <div className="drawer-tabs">
                        <button 
                            type="button"
                            className={`drawer-tab ${activeTab === 'details' ? 'active' : ''}`}
                            onClick={() => setActiveTab('details')}
                        >
                            <UserIcon size={16} /> Details
                        </button>
                        <button 
                            type="button"
                            className={`drawer-tab ${activeTab === 'password' ? 'active' : ''}`}
                            onClick={() => setActiveTab('password')}
                        >
                            <Lock size={16} /> Password
                        </button>
                    </div>
                )}

                <div className="drawer-content-inner">
                    {error && <div className="form-error-alert"><AlertCircle size={16}/> {error}</div>}
                            
                    {activeTab === 'details' ? (
                        <div className="form-grid">
                            <div className="form-group">
                                <label>First Name <span className="req">*</span></label>
                                <input required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Last Name <span className="req">*</span></label>
                                <input required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Username <span className="req">*</span></label>
                                <input required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Email <span className="req">*</span></label>
                                <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                            </div>
                            <div className="form-group full-width">
                                <label>Status <span className="req">*</span></label>
                                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                    <option value="Suspended">Suspended</option>
                                </select>
                            </div>
                            <div className="form-section full-width">
                                <h4>Roles <span className="req">*</span></h4>
                                <div className="roles-grid">
                                    {roles.map(role => (
                                        <label key={role.roleId} className="role-checkbox">
                                            <input type="checkbox" checked={formData.roleIds.includes(role.roleId)} onChange={() => handleRoleToggle(role.roleId)} />
                                            <span className="role-checkbox-text">
                                                <strong>{role.roleName}</strong>
                                                <small>{role.description}</small>
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            {!isEdit && (
                                <div className="form-section full-width">
                                    <h4>Security</h4>
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>Password <span className="req">*</span></label>
                                            <input type="password" required value={passwordData.password} onChange={e => setPasswordData({...passwordData, password: e.target.value})} />
                                        </div>
                                        <div className="form-group">
                                            <label>Confirm Password <span className="req">*</span></label>
                                            <input type="password" required value={passwordData.confirmPassword} onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="form-grid">
                            <div className="form-group">
                                <label>New Password <span className="req">*</span></label>
                                <input type="password" required value={passwordData.password} onChange={e => setPasswordData({...passwordData, password: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Confirm New Password <span className="req">*</span></label>
                                <input type="password" required value={passwordData.confirmPassword} onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})} />
                            </div>
                        </div>
                    )}
                </div>

                <div className="drawer-footer-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                    <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
                        Cancel
                    </button>
                    <button 
                        type="button" 
                        className="btn-primary" 
                        onClick={activeTab === 'password' ? handleUpdatePassword : handleSaveDetails}
                        disabled={loading || (activeTab === 'password' ? !isPasswordValid() : !isFormValid())}
                    >
                        {loading ? (
                            <div className="spinner-small"></div>
                        ) : (
                            <>
                                <Save size={18} />
                                <span>{isEdit ? 'Save Changes' : 'Create User'}</span>
                            </>
                        )}
                    </button>
                </div>
        </SharedDrawer>
    );
};

export default UserFormDrawer;
