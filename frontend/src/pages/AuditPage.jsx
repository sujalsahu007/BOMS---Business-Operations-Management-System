import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Shield, Search, Info, ChevronDown, ChevronUp } from 'lucide-react';
import './AuditPage.css';

const AuditPage = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Pagination & Filters
    const [page, setPage] = useState(1);
    const [pageSize] = useState(15);
    const [totalCount, setTotalCount] = useState(0);
    const [moduleFilter, setModuleFilter] = useState('');
    const [search, setSearch] = useState('');
    const [expandedLogId, setExpandedLogId] = useState(null);
    const [logDetails, setLogDetails] = useState({});
    const [loadingDetails, setLoadingDetails] = useState({});

    const fetchLogs = async () => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams();
            params.append('page', page);
            params.append('pageSize', pageSize);
            if (moduleFilter) params.append('module', moduleFilter);
            if (search) params.append('search', search);

            const res = await api.get(`/audit-logs?${params.toString()}`);
            setLogs(res.data.items);
            setTotalCount(res.data.totalCount);
        } catch (err) {
            setError('Failed to load audit logs.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delay = setTimeout(() => {
            fetchLogs();
        }, 300);
        return () => clearTimeout(delay);
    }, [page, moduleFilter, search]);

    const toggleExpand = async (id) => {
        if (expandedLogId === id) {
            setExpandedLogId(null);
            return;
        }
        
        setExpandedLogId(id);
        
        if (!logDetails[id]) {
            setLoadingDetails(prev => ({ ...prev, [id]: true }));
            try {
                const res = await api.get(`/audit-logs/${id}`);
                setLogDetails(prev => ({ ...prev, [id]: res.data }));
            } catch (err) {
                console.error("Failed to load log details", err);
            } finally {
                setLoadingDetails(prev => ({ ...prev, [id]: false }));
            }
        }
    };

    const formatJson = (data) => {
        if (!data) return "None";
        return JSON.stringify(data, null, 2);
    };

    return (
        <div className="audit-page-container enterprise-module-container">
            <div className="module-header">
                <div className="module-title-group">
                    <h2>Audit Logs</h2>
                    <p>Security and compliance record of system changes.</p>
                </div>
            </div>

            <div className="table-toolbar">
                <div className="toolbar-left">
                    <div className="search-input-container">
                        <Search size={16} />
                        <input 
                            type="text" 
                            className="search-input" 
                            placeholder="Search action, entity ID..." 
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
                        <option value="Security">Security</option>
                        <option value="Users">Users</option>
                        <option value="Roles">Roles</option>
                        <option value="Inventory">Inventory</option>
                        <option value="Contracts">Contracts</option>
                        <option value="Loyalty">Loyalty</option>
                    </select>
                </div>
            </div>

            <div className="data-table-container">
                <table className="data-table audit-table">
                    <thead>
                        <tr>
                            <th style={{ width: '180px' }}>Timestamp</th>
                            <th>User</th>
                            <th>Action</th>
                            <th>Module</th>
                            <th>Entity</th>
                            <th>IP Address</th>
                            <th style={{ width: '40px' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && logs.length === 0 ? (
                            <tr><td colSpan="7" className="table-empty-state">Loading...</td></tr>
                        ) : error ? (
                            <tr><td colSpan="7" className="table-empty-state text-error">{error}</td></tr>
                        ) : logs.length === 0 ? (
                            <tr><td colSpan="7" className="table-empty-state">No audit logs found.</td></tr>
                        ) : (
                            logs.map(log => (
                                <React.Fragment key={log.auditLogId}>
                                    <tr 
                                        className={`cursor-pointer ${expandedLogId === log.auditLogId ? 'row-expanded' : ''}`}
                                        onClick={() => toggleExpand(log.auditLogId)}
                                    >
                                        <td className="text-muted">{new Date(log.timestamp).toLocaleString()}</td>
                                        <td>
                                            {log.user ? (
                                                <div className="flex-col">
                                                    <span>{log.user.firstName} {log.user.lastName}</span>
                                                    <span className="text-xs text-muted">@{log.user.username}</span>
                                                </div>
                                            ) : (
                                                <span className="text-muted">System</span>
                                            )}
                                        </td>
                                        <td className="font-medium">{log.action}</td>
                                        <td><span className="module-badge">{log.module}</span></td>
                                        <td>
                                            <div className="flex-col">
                                                <span>{log.entityType}</span>
                                                <span className="text-xs text-muted">ID: {log.entityId}</span>
                                            </div>
                                        </td>
                                        <td className="text-muted text-sm">{log.ipAddress || 'N/A'}</td>
                                        <td>
                                            <button className="btn-icon">
                                                {expandedLogId === log.auditLogId ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </button>
                                        </td>
                                    </tr>
                                    {expandedLogId === log.auditLogId && (
                                        <tr className="expanded-details-row">
                                            <td colSpan="7">
                                                <div className="expanded-details-content">
                                                    {loadingDetails[log.auditLogId] ? (
                                                        <div className="p-4 text-center text-muted">Loading details...</div>
                                                    ) : logDetails[log.auditLogId] ? (
                                                        <div className="diff-container">
                                                            <div className="diff-panel">
                                                                <div className="diff-header old">Old Values</div>
                                                                <div className="diff-content">{formatJson(logDetails[log.auditLogId].oldValues)}</div>
                                                            </div>
                                                            <div className="diff-panel">
                                                                <div className="diff-header new">New Values</div>
                                                                <div className="diff-content">{formatJson(logDetails[log.auditLogId].newValues)}</div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="p-4 text-center text-error">Failed to load details.</div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))
                        )}
                    </tbody>
                </table>
                <div className="pagination">
                    <div className="pagination-info">
                        Showing {logs.length > 0 ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, totalCount)} of {totalCount} logs
                    </div>
                    <div className="pagination-controls">
                        <button className="btn-page" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
                        <button className="btn-page" disabled={page * pageSize >= totalCount} onClick={() => setPage(p => p + 1)}>Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuditPage;
