import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, ChevronLeft, ChevronRight, Play, Square, Award, MoreVertical, Eye, Edit2, Gift, RefreshCw } from 'lucide-react';
import { loyaltyApi } from '../../services/loyaltyApi';
import CreateTierDrawer from './CreateTierDrawer';
import EditTierDrawer from './EditTierDrawer';
import TierDetailDrawer from './TierDetailDrawer';
import TableActionMenu from '../shared/TableActionMenu';
import './LoyaltyProgramsTab.css'; // Reuse the enterprise styles

const TiersBenefitsTab = () => {
    const [tiers, setTiers] = useState([]);
    const [kpis, setKpis] = useState({
        totalTiers: 0,
        activeTiers: 0,
        totalBenefits: 0,
        programsWithTiers: 0
    });
    
    // Filters and Pagination
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [programFilter, setProgramFilter] = useState('');
    const [programs, setPrograms] = useState([]); // For the filter dropdown
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    
    // UI State
    const [loading, setLoading] = useState(true);
    const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
    const [editingTier, setEditingTier] = useState(null);
    const [viewingTier, setViewingTier] = useState(null);

    const fetchKpis = async () => {
        try {
            const { data } = await loyaltyApi.getTierKpis();
            setKpis(data);
        } catch (error) {
            console.error('Failed to fetch tier KPIs:', error);
        }
    };

    const fetchPrograms = async () => {
        try {
            // Load programs for the filter dropdown
            const { data } = await loyaltyApi.getPrograms({ page: 1, pageSize: 100 });
            setPrograms(data.items || []);
        } catch (error) {
            console.error('Failed to fetch programs:', error);
        }
    };

    const fetchTiers = async (page = 1) => {
        setLoading(true);
        try {
            const params = {
                page,
                pageSize: 10,
                search: searchQuery,
                status: statusFilter,
                loyaltyProgramId: programFilter || null
            };
            
            const { data } = await loyaltyApi.getTiers(params);
            setTiers(data.items || []);
            setTotalPages(Math.ceil((data.totalCount || 0) / 10));
            setCurrentPage(page);
        } catch (error) {
            console.error('Failed to fetch tiers:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKpis();
        fetchPrograms();
    }, []);

    useEffect(() => {
        fetchTiers(1);
    }, [searchQuery, statusFilter, programFilter]);

    const handleRefresh = () => {
        fetchKpis();
        fetchTiers(currentPage);
    };

    const handleClearFilters = () => {
        setSearchQuery('');
        setStatusFilter('All');
        setProgramFilter('');
    };

    const handleAction = async (action, tier) => {
        try {
            if (action === 'activate') {
                await loyaltyApi.activateTier(tier.tierId);
                handleRefresh();
            } else if (action === 'deactivate') {
                await loyaltyApi.deactivateTier(tier.tierId);
                handleRefresh();
            } else if (action === 'edit') {
                setEditingTier(tier);
            } else if (action === 'view') {
                setViewingTier(tier);
            }
        } catch (error) {
            console.error(`Failed to ${action} tier:`, error);
            alert(`Error: ${error.response?.data?.message || 'Action failed'}`);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    return (
        <div className="loyalty-workspace flex flex-col h-full gap-4 fade-in">
            {/* Header (Not in LoyaltyProgramsTab because it's rendered by the parent LoyaltyPage, so I should remove the header from here completely to match) */}


            {/* KPI Strip */}
            <div className="kpi-strip">
                <div className="kpi-card">
                    <div className="kpi-value">{kpis.totalTiers}</div>
                    <div className="kpi-label"><Award size={14} /> TOTAL TIERS</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-value">{kpis.activeTiers}</div>
                    <div className="kpi-label"><Play size={14} className="text-green-500" /> ACTIVE TIERS</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-value">{kpis.totalBenefits}</div>
                    <div className="kpi-label"><Gift size={14} className="text-blue-500" /> TOTAL BENEFITS</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-value">{kpis.programsWithTiers}</div>
                    <div className="kpi-label"><Award size={14} className="text-purple-500" /> PROGRAMS WITH TIERS</div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="filter-bar">
                <div className="filter-left">
                    <div className="search-box">
                        <Search size={18} className="search-icon" />
                        <input 
                            type="text" 
                            placeholder="Search tiers..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    
                    <div className="filter-group">
                        <Filter size={18} className="filter-icon" />
                        <select 
                            className="filter-select"
                            value={programFilter}
                            onChange={(e) => { setProgramFilter(e.target.value); setCurrentPage(1); }}
                        >
                            <option value="">All Programs</option>
                            {programs.map(p => (
                                <option key={p.loyaltyProgramId} value={p.loyaltyProgramId}>{p.programName}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <Filter size={18} className="filter-icon" />
                        <select 
                            className="filter-select"
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                        >
                            <option value="All">All Statuses</option>
                            <option value="Active">Active</option>
                            <option value="Draft">Draft</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>

                    {(searchQuery || statusFilter !== 'All' || programFilter) && (
                        <button className="icon-btn text-muted" onClick={handleClearFilters} title="Clear Filters">
                            Clear
                        </button>
                    )}
                </div>
                <div className="filter-right">
                    <button className="icon-btn" onClick={handleRefresh} title="Refresh" disabled={loading}>
                        <RefreshCw size={18} className={loading ? "spin" : ""} />
                    </button>
                    <button className="primary-btn" onClick={() => setIsCreateDrawerOpen(true)}>
                        <Plus size={18} /> Add Tier
                    </button>
                </div>
            </div>

            {/* Data Table */}
            <div className="table-container flex-1">
                {loading ? (
                    <div className="loading-state p-8 text-center text-muted">Loading tiers...</div>
                ) : tiers.length === 0 ? (
                    <div className="empty-state p-12 text-center">
                        <Award size={48} className="mx-auto text-muted mb-4 opacity-50" />
                        <h3 className="text-lg font-medium mb-2">No Tiers Found</h3>
                        <p className="text-muted">
                            {searchQuery || statusFilter !== 'All' || programFilter
                                ? 'Try adjusting or clearing your filters.'
                                : 'There are no loyalty tiers defined yet.'}
                        </p>
                        {!(searchQuery || statusFilter !== 'All' || programFilter) && (
                            <button className="primary-btn mt-4 mx-auto" onClick={() => setIsCreateDrawerOpen(true)}>
                                <Plus size={18} /> Add Your First Tier
                            </button>
                        )}
                    </div>
                ) : (
                    <table className="enterprise-table">
                        <thead>
                            <tr>
                                <th>Tier</th>
                                <th>Program</th>
                                <th>Qualification</th>
                                <th>Order</th>
                                <th>Benefits</th>
                                <th>Status</th>
                                <th>Updated</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tiers.map(tier => (
                                <tr key={tier.tierId} className="group hover:bg-gray-50 transition-colors">
                                    <td>
                                        <div className="font-medium">{tier.tierName}</div>
                                        <div className="text-xs text-muted">{tier.tierCode}</div>
                                    </td>
                                    <td>{tier.programName}</td>
                                    <td>
                                        <div className="text-sm">{tier.qualificationType}</div>
                                        <div className="text-xs text-muted font-medium">
                                            {tier.qualificationType === 'Spend' ? '₹' : ''}
                                            {tier.qualificationThreshold.toLocaleString()}
                                            {tier.qualificationType === 'Points' ? ' pts' : ''}
                                        </div>
                                    </td>
                                    <td><span className="badge badge-neutral">{tier.displayOrder}</span></td>
                                    <td>
                                        <span className="badge badge-info">{tier.benefitCount} Benefits</span>
                                    </td>
                                    <td>
                                        <span className={`status-badge status-${tier.status.toLowerCase()}`}>
                                            {tier.status}
                                        </span>
                                    </td>
                                    <td className="text-muted text-sm">{formatDate(tier.updatedAt)}</td>
                                    <td className="text-right">
                                        <TableActionMenu>
                                            <button className="dropdown-item w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center" onClick={() => handleAction('view', tier)}>
                                                <Eye size={16} className="mr-2" /> View Details & Benefits
                                            </button>
                                            <button className="dropdown-item w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center" onClick={() => handleAction('edit', tier)}>
                                                <Edit2 size={16} className="mr-2" /> Edit Tier
                                            </button>
                                            <div className="border-t my-1 border-gray-200 dark:border-gray-700"></div>
                                            {tier.status !== 'Active' ? (
                                                <button className="dropdown-item w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center text-success" onClick={() => handleAction('activate', tier)}>
                                                    <Play size={16} className="mr-2" /> Activate Tier
                                                </button>
                                            ) : (
                                                <button className="dropdown-item w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center text-warning" onClick={() => handleAction('deactivate', tier)}>
                                                    <Square size={16} className="mr-2" /> Deactivate Tier
                                                </button>
                                            )}
                                        </TableActionMenu>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {!loading && tiers.length > 0 && (
                <div className="pagination-bar">
                    <div className="pagination-info">
                        Showing {(currentPage - 1) * 10 + 1} to {Math.min(currentPage * 10, (totalPages * 10))} entries
                    </div>
                    <div className="pagination-controls">
                        <button 
                            className="icon-btn" 
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <span className="pagination-current">Page {currentPage} of {totalPages}</span>
                        <button 
                            className="icon-btn" 
                            disabled={currentPage === totalPages || totalPages === 0}
                            onClick={() => setCurrentPage(p => p + 1)}
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* Drawers */}
            {isCreateDrawerOpen && (
                <CreateTierDrawer 
                    programs={programs}
                    onClose={() => setIsCreateDrawerOpen(false)} 
                    onSuccess={() => {
                        setIsCreateDrawerOpen(false);
                        handleRefresh();
                    }}
                />
            )}

            {editingTier && (
                <EditTierDrawer 
                    tier={editingTier}
                    onClose={() => setEditingTier(null)} 
                    onSuccess={() => {
                        setEditingTier(null);
                        handleRefresh();
                    }}
                />
            )}

            {viewingTier && (
                <TierDetailDrawer 
                    tier={viewingTier}
                    onClose={() => setViewingTier(null)} 
                    onBenefitChanged={handleRefresh} // Refresh if benefits change inside
                />
            )}
        </div>
    );
};

export default TiersBenefitsTab;
