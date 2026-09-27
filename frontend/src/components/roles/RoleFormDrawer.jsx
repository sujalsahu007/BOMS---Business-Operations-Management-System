import React, { useState, useEffect } from 'react';
import { X, ShieldAlert } from 'lucide-react';
import { api } from '../../services/api';
import './RoleFormDrawer.css';

const RoleFormDrawer = ({ isOpen, onClose, onSaved, roleId }) => {
    const isEdit = !!roleId;
    
    const [formData, setFormData] = useState({
        roleName: '',
        description: '',
        status: 'Active'
    });
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [initialLoading, setInitialLoading] = useState(isEdit);

    useEffect(() => {
        if (isOpen && isEdit) {
            fetchRole();
        } else if (isOpen) {
            setFormData({
                roleName: '',
                description: '',
                status: 'Active'
            });
            setError(null);
        }
    }, [isOpen, roleId]);

    const fetchRole = async () => {
        setInitialLoading(true);
        setError(null);
        try {
            const response = await api.get(`/roles/${roleId}`);
            setFormData({
                roleName: response.data.roleName,
                description: response.data.description,
                status: response.data.status
            });
        } catch (err) {
            console.error('Failed to fetch role:', err);
            setError('Failed to load role details.');
        } finally {
            setInitialLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.roleName.trim()) {
            setError("Role name is required");
            return;
        }

        setLoading(true);
        setError(null);
        
        try {
            if (isEdit) {
                await api.put(`/roles/${roleId}`, formData);
            } else {
                await api.post('/roles', formData);
            }
            onSaved();
            onClose();
        } catch (err) {
            console.error('Save failed:', err);
            setError(err.response?.data?.message || 'Failed to save role. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const isSystemRole = isEdit && (formData.roleName === 'Administrator');

    return (
        <div className="role-drawer-overlay" onClick={onClose}>
            <div className="role-drawer" onClick={e => e.stopPropagation()}>
                <div className="drawer-header">
                    <h2>{isEdit ? 'Edit Role' : 'Create Role'}</h2>
                    <button className="close-button" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                
                <div className="drawer-content">
                    {error && <div className="form-error">{error}</div>}
                    
                    {initialLoading ? (
                        <div>Loading...</div>
                    ) : (
                        <form id="roleForm" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="roleName">Role Name *</label>
                                <input
                                    type="text"
                                    id="roleName"
                                    name="roleName"
                                    value={formData.roleName}
                                    onChange={handleChange}
                                    placeholder="e.g. Sales Manager"
                                    disabled={loading || isSystemRole}
                                    required
                                />
                                {isSystemRole && <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}><ShieldAlert size={12} style={{verticalAlign: 'middle', marginRight: '4px'}}/>System roles cannot be renamed.</small>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="description">Description</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Describe the purpose of this role..."
                                    disabled={loading}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="status">Status</label>
                                <select
                                    id="status"
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    disabled={loading || isSystemRole}
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>
                        </form>
                    )}
                </div>
                
                <div className="drawer-footer">
                    <button 
                        type="button" 
                        className="secondary-button" 
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        form="roleForm" 
                        className="primary-button"
                        disabled={loading || initialLoading}
                    >
                        {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Role'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RoleFormDrawer;
