import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { Search, Plus, MoreVertical, ShieldAlert } from 'lucide-react';
import RoleFormDrawer from '../components/roles/RoleFormDrawer';
import RoleDetailDrawer from '../components/roles/RoleDetailDrawer';
import { useAuth } from '../context/AuthContext';
import './RolesPage.css';

const RolesPage = () => {
    const { currentUser } = useAuth();
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    
    const [search, setSearch] = useState('');
    const searchRef = useRef(search);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedRoleId, setSelectedRoleId] = useState(null);
    const [editingRoleId, setEditingRoleId] = useState(null);
    const [activeMenuId, setActiveMenuId] = useState(null);

    const hasCreatePerm = currentUser?.permissions?.includes('Roles.Create');
    const hasEditPerm = currentUser?.permissions?.includes('Roles.Edit');
    const hasManagePerm = currentUser?.permissions?.includes('Roles.Manage');

    const fetchRoles = async () => {
        setLoading(true);
        setError(false);
        try {
            const params = new URLSearchParams();
            if (searchRef.current) params.append('search', searchRef.current);
            
            const response = await api.get(`/roles?${params.toString()}`);
            setRoles(response.data);
        } catch (err) {
            console.error('Failed to load roles:', err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const handler = setTimeout(() => {
            searchRef.current = search;
            fetchRoles();
        }, 300);
        return () => clearTimeout(handler);
    }, [search]);

    const handleCreateClick = () => {
        setEditingRoleId(null);
        setIsFormOpen(true);
    };

    const handleEditClick = (e, id) => {
        e.stopPropagation();
        setEditingRoleId(id);
        setIsFormOpen(true);
        setActiveMenuId(null);
    };

    const handleRowClick = (id) => {
        setSelectedRoleId(id);
        setIsDetailOpen(true);
    };

    const handleStatusChange = async (e, id, newStatus) => {
        e.stopPropagation();
        setActiveMenuId(null);
        try {
            const endpoint = newStatus === 'Active' ? 'activate' : 'deactivate';
            await api.post(`/roles/${id}/${endpoint}`);
            fetchRoles();
        } catch (err) {
            console.error('Failed to change status:', err);
            alert(err.response?.data?.message || 'Failed to change role status');
        }
    };

    const toggleMenu = (e, id) => {
        e.stopPropagation();
        setActiveMenuId(activeMenuId === id ? null : id);
    };

    // Close menu when clicking outside
    useEffect(() => {
        const closeMenu = () => setActiveMenuId(null);
        document.addEventListener('click', closeMenu);
        return () => document.removeEventListener('click', closeMenu);
    }, []);

    return (
        <div className="roles-page enterprise-module-container">
            <div className="module-header">
                <div className="module-title-group">
                    <h2>Roles</h2>
                    <p>Manage roles and control access across BOMS.</p>
                </div>
                <div className="module-actions">
                    {hasCreatePerm && (
                        <button className="btn-primary" onClick={handleCreateClick}>
                            <Plus size={18} />
                            <span>Create Role</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="roles-toolbar">
                <div className="search-box">
                    <Search size={18} />
                    <input 
                        type="text" 
                        placeholder="Search roles by name or description..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {loading && roles.length === 0 ? (
                <div className="roles-table-container">
                    <table className="roles-table">
                        <thead>
                            <tr>
                                <th style={{ width: '30%' }}>Role</th>
                                <th style={{ width: '15%' }}>Users</th>
                                <th style={{ width: '20%' }}>Permissions</th>
                                <th style={{ width: '15%' }}>Status</th>
                                <th style={{ width: '20%' }}>Created</th>
                                <th style={{ width: '60px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...Array(5)].map((_, i) => (
                                <tr key={i}>
                                    <td>
                                        <div className="skeleton" style={{ width: '120px', height: '16px', marginBottom: '4px' }}></div>
                                        <div className="skeleton" style={{ width: '200px', height: '12px' }}></div>
                                    </td>
                                    <td><div className="skeleton" style={{ width: '60px', height: '24px', borderRadius: '1rem' }}></div></td>
                                    <td><div className="skeleton" style={{ width: '60px', height: '24px', borderRadius: '1rem' }}></div></td>
                                    <td><div className="skeleton" style={{ width: '60px', height: '24px', borderRadius: '1rem' }}></div></td>
                                    <td><div className="skeleton" style={{ width: '100px', height: '14px' }}></div></td>
                                    <td><div className="skeleton" style={{ width: '24px', height: '24px' }}></div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : error ? (
                <div className="error-state">
                    <ShieldAlert size={48} />
                    <h3>Unable to load roles</h3>
                    <p>There was a problem communicating with the server.</p>
                    <button className="primary-button" onClick={fetchRoles}>Retry</button>
                </div>
            ) : roles.length === 0 ? (
                <div className="empty-state">
                    <ShieldAlert size={48} />
                    <h3>No roles found</h3>
                    <p>{search ? "No roles match your search criteria." : "No roles have been created yet."}</p>
                    {hasCreatePerm && !search && (
                        <button className="primary-button" onClick={handleCreateClick}>
                            <Plus size={18} />
                            <span>Create Role</span>
                        </button>
                    )}
                </div>
            ) : (
                <div className="roles-table-container">
                    <table className="roles-table">
                        <thead>
                            <tr>
                                <th style={{ width: '30%' }}>Role</th>
                                <th style={{ width: '15%' }}>Users</th>
                                <th style={{ width: '20%' }}>Permissions</th>
                                <th style={{ width: '15%' }}>Status</th>
                                <th style={{ width: '20%' }}>Created</th>
                                <th style={{ width: '60px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {roles.map(role => (
                                <tr key={role.roleId} onClick={() => handleRowClick(role.roleId)}>
                                    <td>
                                        <div className="role-info">
                                            <span className="role-name">{role.roleName}</span>
                                            <span className="role-description" title={role.description}>
                                                {role.description}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="count-badge">{role.usersCount} users</span>
                                    </td>
                                    <td>
                                        <span className="count-badge">{role.permissionsCount} assigned</span>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${role.status.toLowerCase()}`}>
                                            {role.status}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="date-cell">
                                            {new Date(role.createdAt).toLocaleDateString()}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="actions-menu">
                                            <button 
                                                className="actions-trigger"
                                                onClick={(e) => toggleMenu(e, role.roleId)}
                                            >
                                                <MoreVertical size={18} />
                                            </button>
                                            
                                            {activeMenuId === role.roleId && (
                                                <div className="actions-dropdown">
                                                    {hasEditPerm && (
                                                        <button 
                                                            className="action-item"
                                                            onClick={(e) => handleEditClick(e, role.roleId)}
                                                        >
                                                            Edit Role
                                                        </button>
                                                    )}
                                                    {hasManagePerm && role.roleName !== 'Administrator' && role.status === 'Active' && (
                                                        <button 
                                                            className="action-item danger"
                                                            onClick={(e) => handleStatusChange(e, role.roleId, 'Inactive')}
                                                        >
                                                            Deactivate Role
                                                        </button>
                                                    )}
                                                    {hasManagePerm && role.status === 'Inactive' && (
                                                        <button 
                                                            className="action-item"
                                                            onClick={(e) => handleStatusChange(e, role.roleId, 'Active')}
                                                        >
                                                            Activate Role
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {isFormOpen && (
                <RoleFormDrawer 
                    isOpen={isFormOpen} 
                    onClose={() => setIsFormOpen(false)} 
                    onSaved={fetchRoles}
                    roleId={editingRoleId} 
                />
            )}

            {isDetailOpen && selectedRoleId && (
                <RoleDetailDrawer 
                    isOpen={isDetailOpen}
                    onClose={() => {
                        setIsDetailOpen(false);
                        setSelectedRoleId(null);
                        fetchRoles(); // Refresh to catch permission/user count changes
                    }}
                    roleId={selectedRoleId}
                />
            )}
        </div>
    );
};

export default RolesPage;
