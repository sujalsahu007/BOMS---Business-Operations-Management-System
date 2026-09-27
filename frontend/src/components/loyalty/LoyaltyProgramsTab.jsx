import React, { useState, useEffect, useCallback } from 'react';
import { 
    Search, Plus, Filter, ChevronLeft, ChevronRight,
    CheckCircle, Clock, XCircle, RefreshCw, FileText,
    MoreVertical, Eye, Edit2, Play, Square
} from 'lucide-react';
import { loyaltyApi } from '../../services/loyaltyApi';
import CreateProgramDrawer from './CreateProgramDrawer';
import EditProgramDrawer from './EditProgramDrawer';
import ProgramDetailDrawer from './ProgramDetailDrawer';
import TableActionMenu from '../shared/TableActionMenu';
import './LoyaltyProgramsTab.css';

const LoyaltyProgramsTab = () => {
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    
    // Pagination
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    // KPIs
    const [kpis, setKpis] = useState({ total: 0, active: 0, draft: 0, inactive: 0 });

    // Drawers
    const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
    const [editingProgram, setEditingProgram] = useState(null);
    const [viewingProgram, setViewingProgram] = useState(null);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(1); // Reset to page 1 on search
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleAction = async (action, program) => {
        try {
            if (action === 'activate') {
                if (!window.confirm("Activate this loyalty program?")) return;
                await loyaltyApi.activateProgram(program.loyaltyProgramId);
                alert('Program activated successfully.');
                fetchPrograms();
                fetchKpis();
            } else if (action === 'deactivate') {
                if (!window.confirm("Deactivate this loyalty program?")) return;
                await loyaltyApi.deactivateProgram(program.loyaltyProgramId);
                alert('Program deactivated successfully.');
                fetchPrograms();
                fetchKpis();
            } else if (action === 'edit') {
                setEditingProgram(program);
            } else if (action === 'view') {
                setViewingProgram(program);
            }
        } catch (error) {
            console.error(`Failed to ${action} program:`, error);
            alert(error.response?.data?.message || `Failed to ${action} program.`);
        }
    };

    const fetchPrograms = useCallback(async () => {
        try {
            setLoading(true);
            const res = await loyaltyApi.getPrograms({
                search: debouncedSearch,
                status: statusFilter,
                page,
                pageSize
            });
            setPrograms(res.data.items);
            setTotalCount(res.data.totalCount);
        } catch (error) {
            console.error(error);
            alert('Unable to load loyalty programs.');
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, statusFilter, page, pageSize]);

    const fetchKpis = useCallback(async () => {
        try {
            const res = await loyaltyApi.getProgramKpis();
            setKpis(res.data);
        } catch (error) {
            console.error('Failed to fetch KPIs:', error);
        }
    }, []);

    useEffect(() => {
        fetchPrograms();
    }, [fetchPrograms]);

    useEffect(() => {
        fetchKpis();
    }, [fetchKpis]);

    const totalPages = Math.ceil(totalCount / pageSize);

    return (
        <div className="loyalty-workspace flex flex-col h-full gap-4">
            {/* KPI Strip */}
            <div className="kpi-strip">
                <div 
                    className={`kpi-card ${statusFilter === 'All' ? 'active-filter' : ''}`} 
                    onClick={() => { setStatusFilter('All'); setPage(1); }}
                >
                    <div className="kpi-value">{kpis.total}</div>
                    <div className="kpi-label">TOTAL PROGRAMS</div>
                </div>
                <div 
                    className={`kpi-card ${statusFilter === 'Active' ? 'active-filter' : ''}`} 
                    onClick={() => { setStatusFilter('Active'); setPage(1); }}
                >
                    <div className="kpi-value">{kpis.active}</div>
                    <div className="kpi-label"><CheckCircle size={14} className="text-green-500" /> ACTIVE</div>
                </div>
                <div 
                    className={`kpi-card ${statusFilter === 'Draft' ? 'active-filter' : ''}`} 
                    onClick={() => { setStatusFilter('Draft'); setPage(1); }}
                >
                    <div className="kpi-value">{kpis.draft}</div>
                    <div className="kpi-label"><Clock size={14} className="text-blue-500" /> DRAFT</div>
                </div>
                <div 
                    className={`kpi-card ${statusFilter === 'Inactive' ? 'active-filter' : ''}`} 
                    onClick={() => { setStatusFilter('Inactive'); setPage(1); }}
                >
                    <div className="kpi-value">{kpis.inactive}</div>
                    <div className="kpi-label"><XCircle size={14} className="text-red-500" /> INACTIVE</div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="filter-bar">
                <div className="filter-left">
                    <div className="search-box">
                        <Search size={18} className="search-icon" />
                        <input 
                            type="text" 
                            placeholder="Search by program name or code..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div className="filter-group">
                        <Filter size={18} className="filter-icon" />
                        <select 
                            className="filter-select"
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        >
                            <option value="All">All Statuses</option>
                            <option value="Active">Active</option>
                            <option value="Draft">Draft</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>

                    {(searchTerm || statusFilter !== 'All') && (
                        <button 
                            className="icon-btn text-muted" 
                            onClick={() => { setSearchTerm(''); setStatusFilter('All'); setPage(1); }}
                            title="Clear Filters"
                        >
                            <RefreshCw size={16} /> Clear
                        </button>
                    )}
                </div>
                <div className="filter-right">
                    <button className="icon-btn" onClick={fetchPrograms} title="Refresh" disabled={loading}>
                        <RefreshCw size={18} className={loading ? "spin" : ""} />
                    </button>
                    <button className="primary-btn" onClick={() => setIsCreateDrawerOpen(true)}>
                        <Plus size={18} /> Create Program
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="table-container flex-1">
                <table className="enterprise-table">
                    <thead>
                        <tr>
                            <th>Program</th>
                            <th>Status</th>
                            <th>Validity</th>
                            <th>Earning Rule</th>
                            <th>Minimum Redemption</th>
                            <th>Updated</th>
                            <th className="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="7" className="text-center py-8">Loading programs...</td></tr>
                        ) : programs.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="text-center py-12">
                                    <div className="empty-state">
                                        <FileText size={48} className="text-muted mb-4 mx-auto" style={{ opacity: 0.5 }} />
                                        <h3>{debouncedSearch || statusFilter !== 'All' ? 'No Matching Programs' : 'No Loyalty Programs Found'}</h3>
                                        <p className="text-muted">
                                            {debouncedSearch || statusFilter !== 'All' ? 'Try adjusting or clearing your filters.' : 'Create your first loyalty program to begin managing customer loyalty.'}
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            programs.map(p => (
                                <tr key={p.loyaltyProgramId}>
                                    <td>
                                        <div className="font-medium">{p.programName}</div>
                                        <div className="text-xs text-muted">{p.programCode}</div>
                                    </td>
                                    <td>
                                        <span className={`status-badge status-${p.status.toLowerCase().replace(' ', '-')}`}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="text-sm">{new Date(p.startDate).toLocaleDateString()} – {p.endDate ? new Date(p.endDate).toLocaleDateString() : 'No End Date'}</div>
                                    </td>
                                    <td>
                                        <div className="text-sm">₹{p.earningAmount} → {p.earningPoints} {p.pointsName}</div>
                                    </td>
                                    <td>
                                        <div className="text-sm">{p.minimumRedemptionPoints} {p.pointsName}</div>
                                    </td>
                                    <td>
                                        <div className="text-sm">{new Date(p.updatedAt).toLocaleDateString()}</div>
                                        <div className="text-xs text-muted">by {p.createdByName}</div>
                                    </td>
                                    <td className="text-right">
                                        <TableActionMenu>
                                            <button className="dropdown-item w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center" onClick={() => handleAction('view', p)}>
                                                <Eye size={16} className="mr-2" /> View Details
                                            </button>
                                            <button className="dropdown-item w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center" onClick={() => handleAction('edit', p)}>
                                                <Edit2 size={16} className="mr-2" /> Edit Program
                                            </button>
                                            <div className="border-t my-1 border-gray-200 dark:border-gray-700"></div>
                                            {p.status !== 'Active' ? (
                                                <button className="dropdown-item w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center text-success" onClick={() => handleAction('activate', p)}>
                                                    <Play size={16} className="mr-2" /> Activate
                                                </button>
                                            ) : (
                                                <button className="dropdown-item w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center text-warning" onClick={() => handleAction('deactivate', p)}>
                                                    <Square size={16} className="mr-2" /> Deactivate
                                                </button>
                                            )}
                                        </TableActionMenu>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {!loading && programs.length > 0 && (
                <div className="pagination-bar">
                    <div className="pagination-info">
                        Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} entries
                    </div>
                    <div className="pagination-controls">
                        <button 
                            className="icon-btn" 
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <span className="pagination-current">Page {page} of {totalPages}</span>
                        <button 
                            className="icon-btn" 
                            disabled={page === totalPages || totalPages === 0}
                            onClick={() => setPage(p => p + 1)}
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {isCreateDrawerOpen && (
                <CreateProgramDrawer 
                    onClose={() => setIsCreateDrawerOpen(false)} 
                    onSuccess={() => {
                        setIsCreateDrawerOpen(false);
                        fetchPrograms();
                        fetchKpis();
                    }} 
                />
            )}

            {editingProgram && (
                <EditProgramDrawer 
                    program={editingProgram}
                    onClose={() => setEditingProgram(null)} 
                    onSuccess={() => {
                        setEditingProgram(null);
                        fetchPrograms();
                        fetchKpis();
                    }} 
                />
            )}

            {viewingProgram && (
                <ProgramDetailDrawer 
                    program={viewingProgram}
                    onClose={() => setViewingProgram(null)} 
                />
            )}
        </div>
    );
};

export default LoyaltyProgramsTab;
