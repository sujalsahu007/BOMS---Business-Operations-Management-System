import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Shield, Users, List, Search, Trash2, CheckCircle2, Save, XCircle } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './RoleDetailDrawer.css';

const RoleDetailDrawer = ({ isOpen, onClose, roleId }) => {
    const { currentUser } = useAuth();
    
    const [activeTab, setActiveTab] = useState('overview');
    const [role, setRole] = useState(null);
    const [users, setUsers] = useState([]);
    
    const [allPermissions, setAllPermissions] = useState([]);
    const [assignedPermissionIds, setAssignedPermissionIds] = useState(new Set());
    const [pendingPermissionIds, setPendingPermissionIds] = useState(new Set());
    const [permSearchTerm, setPermSearchTerm] = useState('');
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [toastMessage, setToastMessage] = useState('');

    const hasManagePerm = currentUser?.permissions?.includes('Roles.Manage');

    useEffect(() => {
        if (isOpen && roleId) {
            fetchData();
        }
    }, [isOpen, roleId]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const roleRes = await api.get(`/roles/${roleId}`);
            setRole(roleRes.data);

            const usersRes = await api.get(`/roles/${roleId}/users`);
            setUsers(usersRes.data);

            const [permsRes, assignedRes] = await Promise.all([
                api.get('/permissions'),
                api.get(`/roles/${roleId}/permissions`)
            ]);
            
            setAllPermissions(permsRes.data);
            const initialAssigned = new Set(assignedRes.data);
            setAssignedPermissionIds(initialAssigned);
            setPendingPermissionIds(new Set(initialAssigned));
            
        } catch (err) {
            console.error('Failed to load role details:', err);
            setError('Unable to load role information.');
        } finally {
            setLoading(false);
        }
    };

    const hasUnsavedChanges = () => {
        if (assignedPermissionIds.size !== pendingPermissionIds.size) return true;
        for (let id of assignedPermissionIds) {
            if (!pendingPermissionIds.has(id)) return true;
        }
        return false;
    };

    const handlePermissionToggle = (permissionId) => {
        if (!hasManagePerm) return;
        
        setPendingPermissionIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(permissionId)) {
                newSet.delete(permissionId);
            } else {
                newSet.add(permissionId);
            }
            return newSet;
        });
    };

    const handleModuleSelectAll = (modulePerms) => {
        if (!hasManagePerm) return;
        setPendingPermissionIds(prev => {
            const newSet = new Set(prev);
            modulePerms.forEach(p => {
                if (!(role.roleName === 'Administrator' && p.permissionCode === 'Roles.Manage')) {
                    newSet.add(p.permissionId);
                }
            });
            return newSet;
        });
    };

    const handleModuleClearAll = (modulePerms) => {
        if (!hasManagePerm) return;
        setPendingPermissionIds(prev => {
            const newSet = new Set(prev);
            modulePerms.forEach(p => {
                if (!(role.roleName === 'Administrator' && p.permissionCode === 'Roles.Manage')) {
                    newSet.delete(p.permissionId);
                }
            });
            return newSet;
        });
    };

    const handleCancelChanges = () => {
        setPendingPermissionIds(new Set(assignedPermissionIds));
    };

    const handleSaveChanges = async () => {
        if (!hasManagePerm) return;
        setSaving(true);
        try {
            const added = [...pendingPermissionIds].filter(id => !assignedPermissionIds.has(id));
            const removed = [...assignedPermissionIds].filter(id => !pendingPermissionIds.has(id));

            const promises = [];
            added.forEach(id => promises.push(api.post(`/roles/${roleId}/permissions`, { permissionId: id })));
            removed.forEach(id => promises.push(api.delete(`/roles/${roleId}/permissions/${id}`)));

            await Promise.all(promises);

            setAssignedPermissionIds(new Set(pendingPermissionIds));
            showToast('Permissions saved successfully.');
        } catch (err) {
            console.error('Failed to save permissions:', err);
            alert('Failed to save permissions. Some changes may have failed.');
            // Refresh to get true DB state
            fetchData();
        } finally {
            setSaving(false);
        }
    };

    const handleRemoveUser = async (userId, userName) => {
        if (!hasManagePerm) return;
        if (window.confirm(`Are you sure you want to remove ${userName} from the ${role.roleName} role?`)) {
            try {
                await api.delete(`/roles/${roleId}/users/${userId}`);
                setUsers(prev => prev.filter(u => u.userId !== userId));
                showToast('User removed from role.');
            } catch (err) {
                console.error('Failed to remove user', err);
                alert('Failed to remove user from role.');
            }
        }
    };

    const showToast = (message) => {
        setToastMessage(message);
        setTimeout(() => setToastMessage(''), 3000);
    };

    const filteredPermissions = allPermissions.filter(p => 
        p.permissionName.toLowerCase().includes(permSearchTerm.toLowerCase()) || 
        p.permissionCode.toLowerCase().includes(permSearchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(permSearchTerm.toLowerCase())
    );

    const permissionsByModule = filteredPermissions.reduce((acc, perm) => {
        if (!acc[perm.module]) acc[perm.module] = [];
        acc[perm.module].push(perm);
        return acc;
    }, {});

    if (!isOpen) return null;

    return createPortal(
        <div className="role-drawer-overlay" onClick={onClose}>
            <div className="role-detail-drawer" onClick={e => e.stopPropagation()}>
                <div className="drawer-header">
                    <div className="drawer-header-content">
                        <h2>Role Details</h2>
                        <span className="role-badge">{role?.roleName || 'Loading...'}</span>
                    </div>
                    <button className="close-button" onClick={onClose} disabled={saving}>
                        <X size={20} />
                    </button>
                </div>
                
                <div className="detail-tabs">
                    <button 
                        className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        Overview
                    </button>
                    <button 
                        className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
                        onClick={() => setActiveTab('users')}
                    >
                        Users ({users.length})
                    </button>
                    <button 
                        className={`tab-button ${activeTab === 'permissions' ? 'active' : ''}`}
                        onClick={() => setActiveTab('permissions')}
                    >
                        Permissions ({pendingPermissionIds.size})
                        {hasUnsavedChanges() && <span className="unsaved-dot"></span>}
                    </button>
                </div>

                <div className="tab-content">
                    <div className="scrollable-content-area" style={{ paddingBottom: hasUnsavedChanges() && activeTab === 'permissions' ? '80px' : '24px' }}>
                    {loading ? (
                        <div className="loading-state">Loading role details...</div>
                    ) : error ? (
                        <div className="error-state">{error}</div>
                    ) : (
                        <>
                            {activeTab === 'overview' && (
                                <div className="overview-grid">
                                    <div className="info-card">
                                        <span className="info-label">Role Name</span>
                                        <span className="info-value">{role.roleName}</span>
                                    </div>
                                    <div className="info-card">
                                        <span className="info-label">Status</span>
                                        <span className={`status-badge ${role.status.toLowerCase()}`}>{role.status}</span>
                                    </div>
                                    <div className="info-card">
                                        <span className="info-label">Created Date</span>
                                        <span className="info-value">{new Date(role.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="info-card">
                                        <span className="info-label">Updated Date</span>
                                        <span className="info-value">{role.updatedAt ? new Date(role.updatedAt).toLocaleDateString() : 'N/A'}</span>
                                    </div>
                                    <div className="info-card" style={{ gridColumn: '1 / -1' }}>
                                        <span className="info-label">Description</span>
                                        <span className="info-value">{role.description || 'No description provided.'}</span>
                                    </div>
                                    <div className="info-card summary-card">
                                        <Users size={24} className="summary-icon" />
                                        <div className="summary-text">
                                            <span className="summary-number">{users.length}</span>
                                            <span className="summary-label">Users assigned</span>
                                        </div>
                                    </div>
                                    <div className="info-card summary-card">
                                        <Shield size={24} className="summary-icon" />
                                        <div className="summary-text">
                                            <span className="summary-number">{assignedPermissionIds.size}</span>
                                            <span className="summary-label">Permissions enabled</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'users' && (
                                <div className="users-list-wrapper">
                                    {users.length === 0 ? (
                                        <div className="empty-state">
                                            <Users size={48} />
                                            <h3>No Users</h3>
                                            <p>No users are currently assigned to this role.</p>
                                        </div>
                                    ) : (
                                        <div className="users-grid">
                                            {users.map(user => (
                                                <div key={user.userId} className="user-item">
                                                    <div className="user-item-info">
                                                        <span className="user-item-name">{user.firstName} {user.lastName} (@{user.username})</span>
                                                        <span className="user-item-email">{user.email}</span>
                                                    </div>
                                                    <div className="user-item-actions">
                                                        <span className={`status-badge ${user.status.toLowerCase()}`}>
                                                            {user.status}
                                                        </span>
                                                        {hasManagePerm && (
                                                            <button 
                                                                className="btn-icon danger" 
                                                                title="Remove User"
                                                                onClick={() => handleRemoveUser(user.userId, user.firstName)}
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'permissions' && (
                                <div className="permissions-wrapper">
                                    <div className="permissions-toolbar">
                                        <div className="search-box">
                                            <Search size={18} />
                                            <input 
                                                type="text" 
                                                placeholder="Search permissions..." 
                                                value={permSearchTerm}
                                                onChange={(e) => setPermSearchTerm(e.target.value)}
                                            />
                                        </div>
                                        <div className="global-perm-summary">
                                            <strong>{pendingPermissionIds.size}</strong> of {allPermissions.length} enabled
                                        </div>
                                    </div>

                                    {Object.entries(permissionsByModule).length === 0 ? (
                                        <div className="empty-state" style={{ padding: '2rem' }}>
                                            <Shield size={32} />
                                            <p>No permissions found matching "{permSearchTerm}"</p>
                                        </div>
                                    ) : (
                                        <div className="permissions-container">
                                            {Object.entries(permissionsByModule).map(([module, perms]) => {
                                                const enabledInModule = perms.filter(p => pendingPermissionIds.has(p.permissionId)).length;
                                                const allEnabled = enabledInModule === perms.length;

                                                return (
                                                    <div key={module} className="permission-module">
                                                        <div className="module-header-row">
                                                            <div className="module-title">
                                                                <h3>{module.toUpperCase()}</h3>
                                                                <span className="module-count">{enabledInModule} / {perms.length} enabled</span>
                                                            </div>
                                                            {hasManagePerm && (
                                                                <div className="module-actions">
                                                                    <button className="btn-text" onClick={() => handleModuleSelectAll(perms)}>Select All</button>
                                                                    <button className="btn-text" onClick={() => handleModuleClearAll(perms)}>Clear All</button>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="module-permissions">
                                                            {perms.map(perm => {
                                                                const isAssigned = pendingPermissionIds.has(perm.permissionId);
                                                                const isDisabled = !hasManagePerm || (role.roleName === 'Administrator' && perm.permissionCode === 'Roles.Manage');
                                                                return (
                                                                    <div key={perm.permissionId} className={`permission-item ${isAssigned ? 'active' : ''}`}>
                                                                        <div className="permission-info">
                                                                            <span className="permission-name">{perm.permissionName}</span>
                                                                            <span className="permission-desc">{perm.description || perm.permissionCode}</span>
                                                                        </div>
                                                                        <label className={`toggle-switch ${isDisabled ? 'disabled' : ''}`}>
                                                                            <input 
                                                                                type="checkbox" 
                                                                                checked={isAssigned}
                                                                                onChange={() => handlePermissionToggle(perm.permissionId)}
                                                                                disabled={isDisabled}
                                                                            />
                                                                            <span className="toggle-slider"></span>
                                                                        </label>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                    </div>
                </div>

                {hasUnsavedChanges() && activeTab === 'permissions' && (
                    <div className="unsaved-changes-footer">
                        <div className="unsaved-info">
                            <span className="unsaved-dot pulse"></span>
                            <span>Unsaved changes</span>
                        </div>
                        <div className="unsaved-actions">
                            <button className="btn-secondary" onClick={handleCancelChanges} disabled={saving}>Cancel</button>
                            <button className="btn-primary" onClick={handleSaveChanges} disabled={saving}>
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                )}

                {toastMessage && (
                    <div className="toast-container">
                        <CheckCircle2 size={16} />
                        {toastMessage}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default RoleDetailDrawer;
