import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { BarChart3, Search } from 'lucide-react';
import ActivityTimeline from '../components/shared/ActivityTimeline';

const ActivityPage = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Pagination & Filters
    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);
    const [totalCount, setTotalCount] = useState(0);
    const [moduleFilter, setModuleFilter] = useState('');
    const [search, setSearch] = useState('');

    const fetchActivities = async () => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams();
            params.append('page', page);
            params.append('pageSize', pageSize);
            if (moduleFilter) params.append('module', moduleFilter);
            if (search) params.append('search', search);

            const res = await api.get(`/activities?${params.toString()}`);
            setActivities(res.data.items);
            setTotalCount(res.data.totalCount);
        } catch (err) {
            setError('Failed to load activity timeline.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delay = setTimeout(() => {
            fetchActivities();
        }, 300);
        return () => clearTimeout(delay);
    }, [page, moduleFilter, search]);

    return (
        <div className="activity-page-container enterprise-module-container" style={{ paddingBottom: '2rem' }}>
            <div className="module-header">
                <div className="module-title-group">
                    <h2>Activity Timeline</h2>
                    <p>Human-readable history of system activities.</p>
                </div>
            </div>

            <div className="table-toolbar">
                <div className="toolbar-left">
                    <div className="search-input-container">
                        <Search size={16} />
                        <input 
                            type="text" 
                            className="search-input" 
                            placeholder="Search description..." 
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        />
                    </div>
                    <select 
                        className="filter-select" 
                        value={moduleFilter} 
                        onChange={(e) => { setModuleFilter(e.target.value); setPage(1); }}
                    >
                        <option value="">All Modules</option>
                        <option value="Users">Users</option>
                        <option value="Roles">Roles</option>
                        <option value="Inventory">Inventory</option>
                        <option value="Contracts">Contracts</option>
                        <option value="Loyalty">Loyalty</option>
                    </select>
                </div>
            </div>

            <div className="data-table-container" style={{ padding: '24px' }}>
                {error ? (
                    <div className="text-error text-center p-4">{error}</div>
                ) : (
                    <>
                        <ActivityTimeline activities={activities} loading={loading} />
                        
                        <div className="pagination" style={{ marginTop: '24px' }}>
                            <div className="pagination-info">
                                Showing {activities.length > 0 ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, totalCount)} of {totalCount} activities
                            </div>
                            <div className="pagination-controls">
                                <button className="btn-page" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
                                <button className="btn-page" disabled={page * pageSize >= totalCount} onClick={() => setPage(p => p + 1)}>Next</button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ActivityPage;
