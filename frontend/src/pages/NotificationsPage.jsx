import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { useNotifications } from '../context/NotificationContext';
import { 
    Bell, Check, CheckCheck, AlertTriangle, 
    Info, Package, FileText, Heart, ShieldAlert,
    ChevronLeft, ChevronRight, Search, RefreshCw, 
    Filter, ArrowDownUp, Settings, Trash2, ExternalLink
} from 'lucide-react';
import './NotificationsPage.css';

const NotificationsPage = () => {
    const { fetchUnreadCount } = useNotifications();
    
    // Data State
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalCount, setTotalCount] = useState(0);

    // Filters & Pagination
    const [page, setPage] = useState(1);
    const [pageSize] = useState(50); // Fetch more for local grouping
    const [statusFilter, setStatusFilter] = useState('All'); // All, Unread, Read, Important
    const [typeFilter, setTypeFilter] = useState('All'); // All, Contract, Inventory, Loyalty, System
    const [sortOrder, setSortOrder] = useState('Newest');
    const [searchQuery, setSearchQuery] = useState('');

    const fetchNotifications = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            params.append('page', page);
            params.append('pageSize', pageSize);
            
            // Map frontend filters to backend
            if (statusFilter === 'Unread') params.append('status', 'Unread');
            if (statusFilter === 'Read') params.append('status', 'Read');
            if (statusFilter === 'Important') params.append('priority', 'High'); // or Critical

            if (typeFilter !== 'All') params.append('type', typeFilter);

            const response = await api.get(`/notifications?${params.toString()}`);
            setNotifications(response.data.items || []);
            setTotalCount(response.data.totalCount || 0);
            
            fetchUnreadCount();
        } catch (err) {
            console.error("Failed to fetch notifications", err);
            setError("Unable to load notifications. Please try again.");
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, [page, statusFilter, typeFilter]);

    const handleMarkAsRead = async (id, e) => {
        if(e) e.stopPropagation();
        try {
            await api.post(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.notificationId === id ? { ...n, isRead: true } : n));
            fetchUnreadCount();
        } catch (err) {
            console.error("Failed to mark as read", err);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await api.post('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            fetchUnreadCount();
        } catch (err) {
            console.error("Failed to mark all as read", err);
        }
    };

    // Client-side processing (Search, Sort, Group)
    const processedData = useMemo(() => {
        let filtered = [...notifications];

        // Search Filter
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(n => 
                n.title?.toLowerCase().includes(q) || 
                n.message?.toLowerCase().includes(q)
            );
        }

        // Sort
        filtered.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return sortOrder === 'Newest' ? dateB - dateA : dateA - dateB;
        });

        // Split into "Needs Attention" vs Feed
        const needsAttention = filtered.filter(n => 
            !n.isRead && (n.priority === 'High' || n.priority === 'Critical')
        );

        // Group Feed
        const today = [];
        const yesterday = [];
        const earlier = [];

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const startOfYesterday = startOfToday - 86400000;

        filtered.forEach(n => {
            // Skip if it's already in Needs Attention to avoid duplication?
            // Actually, usually users want to see it in the feed too, but let's keep it in both for context, 
            // or exclude from feed if in attention? Let's keep in both, but maybe visually distinct.
            const t = new Date(n.createdAt).getTime();
            if (t >= startOfToday) {
                today.push(n);
            } else if (t >= startOfYesterday) {
                yesterday.push(n);
            } else {
                earlier.push(n);
            }
        });

        return { needsAttention, feed: { Today: today, Yesterday: yesterday, Earlier: earlier }, filteredCount: filtered.length };
    }, [notifications, searchQuery, sortOrder]);


    // KPI Calculation
    const summary = useMemo(() => {
        let unread = 0;
        let important = 0;
        let alerts = 0;
        notifications.forEach(n => {
            if (!n.isRead) unread++;
            if (n.priority === 'High' || n.priority === 'Critical') important++;
            if (n.priority === 'Critical') alerts++;
        });
        return { total: totalCount, unread, important, alerts };
    }, [notifications, totalCount]);


    // Helpers
    const getIconForType = (type) => {
        switch (type?.toLowerCase()) {
            case 'system': return <Settings size={18} />;
            case 'security': return <ShieldAlert size={18} />;
            case 'inventory': return <Package size={18} />;
            case 'contract': return <FileText size={18} />;
            case 'approval': return <Check size={18} />;
            case 'loyalty': return <Heart size={18} />;
            default: return <Bell size={18} />;
        }
    };

    const getSemanticColor = (priority) => {
        switch(priority?.toLowerCase()) {
            case 'critical': return 'type-critical';
            case 'high': return 'type-high';
            case 'low': return 'type-info';
            default: return 'type-normal';
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <div className="nc-page">
            
            {/* 1. HEADER */}
            <header className="nc-header">
                <div className="nc-header-left">
                    <h1>Notifications</h1>
                    <p>Stay informed about important activities, approvals, expiries and system events.</p>
                </div>
                <div className="nc-header-right">
                    <button className="nc-btn nc-btn-outline" onClick={handleMarkAllAsRead} disabled={summary.unread === 0}>
                        <CheckCheck size={16} /> Mark all as read
                    </button>
                    <button className="nc-icon-btn" title="Preferences">
                        <Settings size={18} />
                    </button>
                </div>
            </header>

            {/* 2. SUMMARY KPIs */}
            <div className="nc-kpi-strip">
                <div className="nc-kpi-card">
                    <span className="nc-kpi-val">{summary.total}</span>
                    <span className="nc-kpi-lbl">All Notifications</span>
                </div>
                <div className="nc-kpi-card type-info">
                    <span className="nc-kpi-val">{summary.unread}</span>
                    <span className="nc-kpi-lbl">Unread</span>
                </div>
                <div className="nc-kpi-card type-warning">
                    <span className="nc-kpi-val">{summary.important}</span>
                    <span className="nc-kpi-lbl">Important</span>
                </div>
                <div className="nc-kpi-card type-critical">
                    <span className="nc-kpi-val">{summary.alerts}</span>
                    <span className="nc-kpi-lbl">Alerts</span>
                </div>
            </div>

            {/* 3. NEEDS ATTENTION SECTION */}
            {!loading && processedData.needsAttention.length > 0 && (
                <div className="nc-attention-section">
                    <h3 className="nc-section-title type-critical">
                        <AlertTriangle size={16} /> Needs Attention
                    </h3>
                    <div className="nc-attention-grid">
                        {processedData.needsAttention.slice(0, 3).map(n => (
                            <div key={`alert-${n.notificationId}`} className="nc-alert-card">
                                <div className="nc-alert-icon">
                                    {getIconForType(n.type)}
                                </div>
                                <div className="nc-alert-content">
                                    <h4>{n.title}</h4>
                                    <p>{n.message}</p>
                                </div>
                                <button className="nc-icon-btn" onClick={(e) => handleMarkAsRead(n.notificationId, e)}>
                                    <Check size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 4. TOOLBAR */}
            <div className="nc-toolbar">
                <div className="nc-search-box">
                    <Search size={16} className="nc-search-icon" />
                    <input 
                        type="text" 
                        placeholder="Search notifications..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                
                <div className="nc-filters">
                    <div className="nc-filter-group">
                        <Filter size={14} className="text-muted" />
                        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
                            <option value="All">All Status</option>
                            <option value="Unread">Unread</option>
                            <option value="Read">Read</option>
                            <option value="Important">Important</option>
                        </select>
                    </div>
                    
                    <div className="nc-filter-group">
                        <Package size={14} className="text-muted" />
                        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}>
                            <option value="All">All Categories</option>
                            <option value="Contract">Contracts</option>
                            <option value="Inventory">Inventory</option>
                            <option value="Loyalty">Loyalty</option>
                            <option value="System">System</option>
                        </select>
                    </div>

                    <div className="nc-filter-group">
                        <ArrowDownUp size={14} className="text-muted" />
                        <select value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
                            <option value="Newest">Newest</option>
                            <option value="Oldest">Oldest</option>
                        </select>
                    </div>

                    <button className="nc-icon-btn" onClick={() => fetchNotifications(true)} title="Refresh">
                        <RefreshCw size={16} />
                    </button>
                </div>
            </div>

            {/* 5. FEED / CONTENT */}
            <div className="nc-feed-container">
                {error && (
                    <div className="nc-empty-state">
                        <AlertTriangle size={48} className="type-warning" />
                        <h3>{error}</h3>
                        <button className="nc-btn nc-btn-primary mt-4" onClick={() => fetchNotifications(true)}>Retry</button>
                    </div>
                )}

                {!error && loading && (
                    <div className="nc-loading-state">
                        {[1, 2, 3, 4].map(i => <div key={i} className="nc-skeleton-row"></div>)}
                    </div>
                )}

                {!error && !loading && processedData.filteredCount === 0 && (
                    <div className="nc-empty-state">
                        <CheckCheck size={48} className="text-muted" />
                        <h3>You're all caught up.</h3>
                        <p>No notifications found for the current filters.</p>
                    </div>
                )}

                {!error && !loading && processedData.filteredCount > 0 && (
                    <div className="nc-feed">
                        {['Today', 'Yesterday', 'Earlier'].map(group => {
                            const items = processedData.feed[group];
                            if (items.length === 0) return null;

                            return (
                                <div key={group} className="nc-feed-group">
                                    <h4 className="nc-group-title">{group}</h4>
                                    <div className="nc-group-list">
                                        {items.map(n => (
                                            <div key={n.notificationId} className={`nc-item ${n.isRead ? '' : 'unread'}`}>
                                                <div className={`nc-item-icon ${getSemanticColor(n.priority)}`}>
                                                    {getIconForType(n.type)}
                                                </div>
                                                
                                                <div className="nc-item-main">
                                                    <div className="nc-item-header">
                                                        <span className="nc-item-title">{n.title}</span>
                                                        <span className="nc-item-time">
                                                            {group === 'Earlier' ? formatDate(n.createdAt) : formatTime(n.createdAt)}
                                                        </span>
                                                    </div>
                                                    <p className="nc-item-desc">{n.message}</p>
                                                    <div className="nc-item-meta">
                                                        <span className="nc-meta-type">{n.type}</span>
                                                        {n.priority !== 'Normal' && (
                                                            <span className={`nc-meta-badge ${getSemanticColor(n.priority)}`}>
                                                                {n.priority}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="nc-item-actions">
                                                    {n.referenceId && (
                                                        <button className="nc-action-btn" title="View Source">
                                                            <ExternalLink size={16} />
                                                        </button>
                                                    )}
                                                    {!n.isRead && (
                                                        <button className="nc-action-btn" title="Mark as Read" onClick={(e) => handleMarkAsRead(n.notificationId, e)}>
                                                            <Check size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            
            {/* PAGINATION */}
            {!error && !loading && totalCount > pageSize && (
                <div className="nc-pagination">
                    <span>Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount}</span>
                    <div className="nc-page-controls">
                        <button disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={16}/></button>
                        <button disabled={page * pageSize >= totalCount} onClick={() => setPage(p => p + 1)}><ChevronRight size={16}/></button>
                    </div>
                </div>
            )}
            
        </div>
    );
};

export default NotificationsPage;
