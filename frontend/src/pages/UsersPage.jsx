import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { Search, Plus, MoreVertical, ShieldAlert, Trash2, AlertTriangle } from 'lucide-react';
import UserFormDrawer from '../components/users/UserFormDrawer';
import UserDetailDrawer from '../components/users/UserDetailDrawer';
import './UsersPage.css';

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // Pagination & Filters
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [roleFilter, setRoleFilter] = useState('');

    // Debounce search
    const searchRef = useRef(search);

    // Drawer state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [editingUserId, setEditingUserId] = useState(null);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [activeMenuId, setActiveMenuId] = useState(null);

    // Delete confirmation state
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const fetchUsers = async () => {
        setLoading(true);
        setError(false);
        try {
            const params = new URLSearchParams();
            params.append('page', page);
            params.append('pageSize', pageSize);
            if (searchRef.current) params.append('search', searchRef.current);
            if (statusFilter) params.append('status', statusFilter);
            if (roleFilter) params.append('roleId', roleFilter);

            const res = await api.get(`/users?${params.toString()}`);
            setUsers(res.data.items);
            setTotalCount(res.data.totalCount);
        } catch (err) {
            console.error("Failed to load users", err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    const fetchRoles = async () => {
        try {
            const res = await api.get('/roles');
            setRoles(res.data);
        } catch (err) {
            console.error("Failed to load roles", err);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    useEffect(() => {
        const delay = setTimeout(() => {
            fetchUsers();
        }, 300);
        return () => clearTimeout(delay);
    }, [page, searchRef.current, statusFilter, roleFilter]);

    const handleSearchChange = (e) => {
        setSearch(e.target.value);
        searchRef.current = e.target.value;
        setPage(1);
    };

    const handleOpenCreate = () => {
        setEditingUserId(null);
        setIsFormOpen(true);
    };

    const handleOpenEdit = (id) => {
        setEditingUserId(id);
        setIsFormOpen(true);
        setActiveMenuId(null);
    };

    const handleOpenDetail = (id) => {
        setSelectedUserId(id);
        setIsDetailOpen(true);
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            let action = '';
            if (newStatus === 'Active') action = 'activate';
            if (newStatus === 'Inactive') action = 'deactivate';
            if (newStatus === 'Suspended') action = 'suspend';
            await api.post(`/users/${id}/${action}`);
            fetchUsers();
            setActiveMenuId(null);
        } catch (err) {
            alert('Failed to change status: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await api.delete(`/users/${deleteTarget.userId}`);
            setDeleteTarget(null);
            fetchUsers();
        } catch (err) {
            alert('Failed to delete user: ' + (err.response?.data?.message || err.message));
        } finally {
            setDeleting(false);
        }
    };

    const getInitials = (f, l) => `${f?.[0] || ''}${l?.[0] || ''}`.toUpperCase();

    return (
        <div className="users-page-container enterprise-module-container">
            <div className="module-header">
                <div className="module-title-group">
                    <h2>Users</h2>
                    <p>Manage users, access and account status.</p>
                </div>
                <div className="module-actions">
                    <button className="btn-primary" onClick={handleOpenCreate}>
                        <Plus size={16} /> Add User
                    </button>
                </div>
            </div>

            <div className="table-toolbar">
                <div className="toolbar-left">
                    <div className="search-input-container">
                        <Search size={16} />
                        <input 
                            type="text" 
                            className="search-input" 
                            placeholder="Search name, username, email..." 
                            value={search}
                            onChange={handleSearchChange}
                        />
                    </div>
                    <select 
                        className="filter-select" 
                        value={statusFilter} 
                        onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                    >
                        <option value="">All Statuses</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Suspended">Suspended</option>
                    </select>
                    <select 
                        className="filter-select" 
                        value={roleFilter} 
                        onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
                    >
                        <option value="">All Roles</option>
                        {roles.map(r => (
                            <option key={r.roleId} value={r.roleId}>{r.roleName}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="data-table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th style={{ width: '25%' }}>User</th>
                            <th style={{ width: '25%' }}>Email</th>
                            <th style={{ width: '15%' }}>Role</th>
                            <th style={{ width: '10%' }}>Status</th>
                            <th style={{ width: '12%' }}>Last Login</th>
                            <th style={{ width: '10%' }}>Created</th>
                            <th style={{ width: '60px' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && users.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Loading users...</td>
                            </tr>
                        ) : error ? (
                            <tr>
                                <td colSpan="7" className="table-empty-state">
                                    <ShieldAlert size={32} />
                                    <h3>Unable to load users</h3>
                                    <button className="btn-page" onClick={fetchUsers}>Retry</button>
                                </td>
                            </tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="table-empty-state">
                                    <h3>No users found</h3>
                                    <p>Try adjusting your search or filters.</p>
                                </td>
                            </tr>
                        ) : (
                            users.map(user => (
                                <tr key={user.userId} onClick={() => handleOpenDetail(user.userId)} style={{ cursor: 'pointer' }}>
                                    <td>
                                        <div className="user-cell">
                                            <div className="user-avatar">{getInitials(user.firstName, user.lastName)}</div>
                                            <div className="user-info">
                                                <span className="user-name">{user.firstName} {user.lastName}</span>
                                                <span className="user-username">@{user.username}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{user.email}</td>
                                    <td>
                                        {user.roles.length > 0 ? 
                                            user.roles.map(r => <span key={r} className="role-badge">{r}</span>) 
                                            : <span className="text-muted" style={{ fontSize: '0.75rem' }}>No Role</span>
                                        }
                                    </td>
                                    <td>
                                        <span className={`status-badge ${user.status.toLowerCase()}`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td>
                                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                                    </td>
                                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <div className="action-menu-container" onClick={e => e.stopPropagation()}>
                                            <button 
                                                className="btn-icon"
                                                onClick={() => setActiveMenuId(activeMenuId === user.userId ? null : user.userId)}
                                            >
                                                <MoreVertical size={16} />
                                            </button>
                                            {activeMenuId === user.userId && (
                                                <div className="action-dropdown" onMouseLeave={() => setActiveMenuId(null)}>
                                                    <button className="action-item" onClick={() => handleOpenEdit(user.userId)}>Edit User</button>
                                                    {user.status !== 'Active' && (
                                                        <button className="action-item" onClick={() => handleStatusChange(user.userId, 'Active')}>Activate</button>
                                                    )}
                                                    {user.status !== 'Inactive' && (
                                                        <button className="action-item" onClick={() => handleStatusChange(user.userId, 'Inactive')}>Deactivate</button>
                                                    )}
                                                    {user.status !== 'Suspended' && (
                                                        <button className="action-item" onClick={() => handleStatusChange(user.userId, 'Suspended')} style={{ color: 'var(--warning-color, #f59e0b)' }}>Suspend</button>
                                                    )}
                                                    <div className="action-divider"></div>
                                                    <button 
                                                        className="action-item action-item-danger" 
                                                        onClick={() => {
                                                            setDeleteTarget(user);
                                                            setActiveMenuId(null);
                                                        }}
                                                    >
                                                        <Trash2 size={14} /> Delete User
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                <div className="pagination">
                    <div className="pagination-info">
                        Showing {users.length > 0 ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, totalCount)} of {totalCount} users
                    </div>
                    <div className="pagination-controls">
                        <button 
                            className="btn-page" 
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                        >
                            Previous
                        </button>
                        <button 
                            className="btn-page" 
                            disabled={page * pageSize >= totalCount}
                            onClick={() => setPage(p => p + 1)}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {isFormOpen && (
                <UserFormDrawer 
                    isOpen={isFormOpen} 
                    onClose={() => setIsFormOpen(false)} 
                    userId={editingUserId}
                    onSuccess={() => {
                        setIsFormOpen(false);
                        fetchUsers();
                    }}
                    roles={roles}
                />
            )}

            {isDetailOpen && (
                <UserDetailDrawer
                    isOpen={isDetailOpen}
                    onClose={() => setIsDetailOpen(false)}
                    userId={selectedUserId}
                />
            )}

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div className="delete-modal-overlay" onClick={() => !deleting && setDeleteTarget(null)}>
                    <div className="delete-modal" onClick={e => e.stopPropagation()}>
                        <div className="delete-modal-icon">
                            <AlertTriangle size={28} />
                        </div>
                        <h3>Delete User</h3>
                        <p>
                            Are you sure you want to permanently delete <strong>{deleteTarget.firstName} {deleteTarget.lastName}</strong> (@{deleteTarget.username})? 
                            This action cannot be undone.
                        </p>
                        <div className="delete-modal-actions">
                            <button className="btn-secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</button>
                            <button className="btn-danger" onClick={handleDeleteConfirm} disabled={deleting}>
                                {deleting ? 'Deleting...' : 'Delete User'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersPage;
