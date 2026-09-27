import React, { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, ChevronLeft, ChevronRight, FileText, Calendar, ShieldAlert, Plus, Edit2, CheckCircle } from 'lucide-react';
import { contractApi } from '../../services/contractApi';
import ObligationFormDrawer from './ObligationFormDrawer';
import ObligationDetailDrawer from './ObligationDetailDrawer';

const ObligationsTab = () => {
    const [obligations, setObligations] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [kpis, setKpis] = useState({ total: 0, pending: 0, dueSoon: 0, overdue: 0 });
    
    // Filters & Pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All Statuses');
    const [priorityFilter, setPriorityFilter] = useState('All Priorities');
    const [dateFilter, setDateFilter] = useState('All Due Dates');
    const [page, setPage] = useState(1);
    const pageSize = 15;

    // Drawers State
    const [isFormDrawerOpen, setIsFormDrawerOpen] = useState(false);
    const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
    const [selectedObligation, setSelectedObligation] = useState(null);

    // Debounce search input
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(1);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    // Fetch data
    const fetchObligations = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const params = { page, pageSize };
            if (debouncedSearch) params.search = debouncedSearch;
            if (statusFilter !== 'All Statuses') params.status = statusFilter;
            if (priorityFilter !== 'All Priorities') params.priority = priorityFilter;
            if (dateFilter !== 'All Due Dates') params.dateRange = dateFilter;
            
            const [response, kpiResponse] = await Promise.all([
                contractApi.getAllObligations(params),
                contractApi.getObligationKpis()
            ]);
            
            setObligations(response.items || []);
            setTotalCount(response.totalCount || 0);
            setKpis(kpiResponse);
        } catch (err) {
            console.error("Failed to fetch obligations:", err);
            setError("Unable to load obligations.");
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, debouncedSearch, statusFilter, priorityFilter, dateFilter]);

    useEffect(() => {
        fetchObligations();
    }, [fetchObligations]);

    // Handlers
    const handleAdd = () => {
        setSelectedObligation(null);
        setIsFormDrawerOpen(true);
    };

    const handleRowClick = (obligation) => {
        setSelectedObligation(obligation);
        setIsDetailDrawerOpen(true);
    };

    const handleEditFromDetail = () => {
        setIsDetailDrawerOpen(false);
        setIsFormDrawerOpen(true);
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setStatusFilter('All Statuses');
        setPriorityFilter('All Priorities');
        setDateFilter('All Due Dates');
        setPage(1);
    };

    const handleMarkComplete = async (e, obligationId) => {
        e.stopPropagation();
        try {
            await contractApi.completeObligation(obligationId);
            fetchObligations();
        } catch (err) {
            console.error("Failed to complete obligation:", err);
            alert("Failed to complete obligation. Please try again.");
        }
    };

    const handleEdit = (e, obligation) => {
        e.stopPropagation();
        setSelectedObligation(obligation);
        setIsFormDrawerOpen(true);
    };

    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    return (
        <div className="contracts-module-wrapper" style={{ height: '100%' }}>
            <div className="tab-container">
                <div className="kpi-strip" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' }}>
                    <div className="kpi-card compact" onClick={() => { setStatusFilter('All Statuses'); setDateFilter('All Due Dates'); setPage(1); }} style={{ cursor: 'pointer', background: 'var(--surface-color)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-color)', lineHeight: 1 }}>{kpis.total}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>TOTAL</span>
                    </div>
                    <div className="kpi-card compact" onClick={() => { setStatusFilter('Pending'); setDateFilter('All Due Dates'); setPage(1); }} style={{ cursor: 'pointer', background: 'var(--surface-color)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--blue-400)', lineHeight: 1 }}>{kpis.pending}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>PENDING</span>
                    </div>
                    <div className="kpi-card compact" onClick={() => { setStatusFilter('All Statuses'); setDateFilter('Due in 7 Days'); setPage(1); }} style={{ cursor: 'pointer', background: 'var(--surface-color)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--yellow-400)', lineHeight: 1 }}>{kpis.dueSoon}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>DUE SOON</span>
                    </div>
                    <div className="kpi-card compact" onClick={() => { setStatusFilter('Overdue'); setDateFilter('All Due Dates'); setPage(1); }} style={{ cursor: 'pointer', background: 'var(--surface-color)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--red-900)', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--red-500)', lineHeight: 1 }}>{kpis.overdue}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--red-400)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>OVERDUE</span>
                    </div>
                </div>
                <div className="tab-header">
                    <div className="search-filter-group">
                        <div className="search-bar">
                            <Search size={18} className="search-icon" />
                            <input 
                                type="text" 
                                placeholder="Search by title, contract number, party..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        
                        <select className="filter-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                            <option value="All Statuses">All Statuses</option>
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Overdue">Overdue</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                        
                        <select className="filter-select" value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}>
                            <option value="All Priorities">All Priorities</option>
                            <option value="Critical">Critical</option>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </select>
                        
                        <select className="filter-select" value={dateFilter} onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}>
                            <option value="All Due Dates">All Due Dates</option>
                            <option value="Overdue">Overdue</option>
                            <option value="Due Today">Due Today</option>
                            <option value="Due in 7 Days">Due in 7 Days</option>
                            <option value="Due in 30 Days">Due in 30 Days</option>
                            <option value="Future">Future</option>
                        </select>
                        
                        {(statusFilter !== 'All Statuses' || priorityFilter !== 'All Priorities' || dateFilter !== 'All Due Dates' || debouncedSearch) && (
                            <button 
                                className="secondary-btn" 
                                style={{ padding: '6px 12px', fontSize: '0.875rem' }}
                                onClick={handleClearFilters}
                            >
                                Clear
                            </button>
                        )}

                        <button className="icon-btn" onClick={fetchObligations} title="Refresh">
                            <RefreshCw size={18} className={loading ? "spin" : ""} />
                        </button>
                    </div>

                    <div className="action-group">
                        <button className="primary-btn" onClick={handleAdd}>
                            <Plus size={18} /> 
                            <span>Add Obligation</span>
                        </button>
                    </div>
                </div>

            {/* Error State */}
            {error && (
                <div className="empty-state" style={{ padding: '3rem', textAlign: 'center', background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <ShieldAlert size={48} style={{ color: 'var(--red-500)', marginBottom: '1rem' }} />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-color)', margin: '0 0 0.5rem 0' }}>{error}</h3>
                    <button className="secondary-btn" onClick={fetchObligations} style={{ margin: '0 auto' }}>Retry</button>
                </div>
            )}

            {/* Table */}
            {!error && (
                <div className="table-container">
                    <table className="enterprise-table">
                        <thead>
                            <tr>
                                <th>Obligation</th>
                                <th>Contract Number</th>
                                <th>Party</th>
                                <th>Owner</th>
                                <th>Due Date</th>
                                <th>Priority</th>
                                <th>Status</th>
                                <th className="actions-col"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && obligations.length === 0 ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={`skeleton-${i}`}>
                                        <td colSpan="8" style={{ padding: '1rem' }}>
                                            <div className="skeleton" style={{ height: '24px', width: '100%', borderRadius: '4px' }}></div>
                                        </td>
                                    </tr>
                                ))
                            ) : obligations.length === 0 ? (
                                <tr>
                                    <td colSpan="8">
                                        <div className="empty-state">
                                            <FileText size={48} />
                                            <h3>No obligations yet.</h3>
                                            <p>Track commitments and deadlines associated with your contracts.</p>
                                            <button className="primary-btn" onClick={handleAdd}>
                                                <Plus size={16} /> Add Obligation
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                obligations.map(obl => {
                                    const isOverdue = obl.effectiveStatus === 'Overdue';
                                    const daysDiff = Math.ceil((new Date(obl.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
                                    const isCompleted = obl.status === 'Completed';
                                    
                                    let dateMessage = null;
                                    if (isCompleted) {
                                        dateMessage = <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Completed</span>;
                                    } else if (isOverdue) {
                                        dateMessage = <span style={{ fontSize: '0.75rem', color: 'var(--red-500)', marginTop: '2px' }}>{Math.abs(daysDiff)} days overdue</span>;
                                    } else {
                                        dateMessage = <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{daysDiff} days remaining</span>;
                                    }

                                    return (
                                        <tr key={obl.obligationId} onClick={() => handleRowClick(obl)} style={{ cursor: 'pointer' }}>
                                            <td>
                                                <div style={{ fontWeight: 500, color: 'var(--text-color)' }}>{obl.title}</div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-color)' }}>
                                                    <FileText size={14} style={{ color: 'var(--primary-color)' }} />
                                                    {obl.contractNumber}
                                                </div>
                                            </td>
                                            <td>{obl.partyName || '-'}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                                        {obl.ownerName.charAt(0)}
                                                    </div>
                                                    {obl.ownerName}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: isOverdue ? 'var(--red-500)' : 'var(--text-color)', fontWeight: isOverdue ? 600 : 400 }}>
                                                        <Calendar size={14} />
                                                        {new Date(obl.dueDate).toLocaleDateString()}
                                                    </div>
                                                    {dateMessage}
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`status-badge ${obl.priority.toLowerCase()}`}>
                                                    {obl.priority}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`status-badge ${obl.effectiveStatus.toLowerCase().replace(' ', '-')}`}>
                                                    {obl.effectiveStatus}
                                                </span>
                                            </td>
                                            <td className="actions-col">
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    <button 
                                                        className="icon-btn" 
                                                        onClick={(e) => { e.stopPropagation(); handleRowClick(obl); }}
                                                        title="View Details"
                                                    >
                                                        <FileText size={16} />
                                                    </button>
                                                    <button 
                                                        className="icon-btn" 
                                                        onClick={(e) => handleEdit(e, obl)}
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    {obl.effectiveStatus !== 'Completed' && (
                                                        <button 
                                                            className="icon-btn" 
                                                            onClick={(e) => handleMarkComplete(e, obl.obligationId)}
                                                            title="Mark Complete"
                                                        >
                                                            <CheckCircle size={16} style={{ color: 'var(--green-500)' }} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            {!error && totalCount > 0 && (
                <div className="pagination">
                    <span className="pagination-info">
                        Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} entries
                    </span>
                    <div className="pagination-controls">
                        <button 
                            className="icon-btn" 
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="pagination-current">Page {page} of {totalPages}</span>
                        <button 
                            className="icon-btn" 
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Drawers */}
            {isFormDrawerOpen && (
                <ObligationFormDrawer
                    isOpen={isFormDrawerOpen}
                    onClose={() => setIsFormDrawerOpen(false)}
                    obligation={selectedObligation}
                    onUpdate={fetchObligations}
                />
            )}
            
            {isDetailDrawerOpen && selectedObligation && (
                <ObligationDetailDrawer
                    isOpen={isDetailDrawerOpen}
                    onClose={() => setIsDetailDrawerOpen(false)}
                    obligation={selectedObligation}
                    onUpdate={fetchObligations}
                />
            )}
            </div>
        </div>
    );
};

export default ObligationsTab;
