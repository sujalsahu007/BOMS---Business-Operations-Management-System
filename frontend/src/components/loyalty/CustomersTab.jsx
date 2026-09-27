import React, { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw, Users, UserCheck, UserX, Award, MoreVertical, Play, Square, Eye } from 'lucide-react';
import { loyaltyApi } from '../../services/loyaltyApi';
import EnrollCustomerDrawer from './EnrollCustomerDrawer';
import MembershipDetailDrawer from './MembershipDetailDrawer';
import TableActionMenu from '../shared/TableActionMenu';

const CustomersTab = () => {
    const [memberships, setMemberships] = useState([]);
    const [loading, setLoading] = useState(true);
    const [kpis, setKpis] = useState({ totalMembers: 0, active: 0, inactive: 0, programsWithMembers: 0 });
    
    // Filters
    const [search, setSearch] = useState('');
    const [programFilter, setProgramFilter] = useState('');
    const [tierFilter, setTierFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    
    // Metadata for filters
    const [programs, setPrograms] = useState([]);
    const [tiers, setTiers] = useState([]);

    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const pageSize = 10;

    // Drawers
    const [isEnrollOpen, setIsEnrollOpen] = useState(false);
    const [viewingMembership, setViewingMembership] = useState(null);

    const fetchKpis = async () => {
        try {
            const { data } = await loyaltyApi.getMembershipKpis();
            setKpis(data);
        } catch (error) {
            console.error("Failed to fetch membership KPIs", error);
        }
    };

    const fetchFilterMetadata = async () => {
        try {
            const progRes = await loyaltyApi.getPrograms({ pageSize: 100 });
            setPrograms(progRes.data.items || []);
            const tierRes = await loyaltyApi.getTiers({ pageSize: 100 });
            setTiers(tierRes.data.items || []);
        } catch (error) {
            console.error("Failed to fetch programs/tiers for filters", error);
        }
    };

    const fetchMemberships = async () => {
        setLoading(true);
        try {
            const params = {
                page,
                pageSize,
                search,
                status: statusFilter !== 'All' ? statusFilter : undefined,
                programId: programFilter ? parseInt(programFilter) : undefined,
                tierId: tierFilter ? parseInt(tierFilter) : undefined
            };
            const { data } = await loyaltyApi.getMemberships(params);
            setMemberships(data.items || []);
            setTotalCount(data.totalCount || 0);
        } catch (error) {
            console.error("Failed to fetch memberships", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFilterMetadata();
        fetchKpis();
    }, []);

    useEffect(() => {
        fetchMemberships();
    }, [page, search, statusFilter, programFilter, tierFilter]);

    const handleAction = async (action, membership) => {
        try {
            if (action === 'activate') {
                if (!window.confirm("Activate this membership?")) return;
                await loyaltyApi.activateMembership(membership.membershipId);
            } else if (action === 'deactivate') {
                if (!window.confirm("Deactivate this membership?")) return;
                await loyaltyApi.deactivateMembership(membership.membershipId);
            } else if (action === 'view') {
                setViewingMembership(membership);
                return;
            }
            fetchMemberships();
            fetchKpis();
        } catch (err) {
            alert(err.response?.data?.message || `Failed to ${action} membership.`);
        }
    };

    const clearFilters = () => {
        setSearch('');
        setProgramFilter('');
        setTierFilter('');
        setStatusFilter('All');
        setPage(1);
    };

    return (
        <div className="loyalty-workspace flex flex-col h-full gap-4 fade-in">
            {/* KPI Strip */}
            <div className="kpi-strip">
                <div className="kpi-card">
                    <div className="kpi-value">{kpis.totalMembers.toLocaleString()}</div>
                    <div className="kpi-label"><Users size={14} className="text-blue-500" /> TOTAL MEMBERS</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-value">{kpis.active.toLocaleString()}</div>
                    <div className="kpi-label"><UserCheck size={14} className="text-green-500" /> ACTIVE</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-value">{kpis.inactive.toLocaleString()}</div>
                    <div className="kpi-label"><UserX size={14} className="text-red-500" /> INACTIVE</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-value">{kpis.programsWithMembers.toLocaleString()}</div>
                    <div className="kpi-label"><Award size={14} className="text-purple-500" /> PROGRAMS WITH MEMBERS</div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="filter-bar">
                <div className="filter-left">
                    <div className="search-box">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search customers..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    
                    <div className="filter-group">
                        <Filter size={18} className="filter-icon" />
                        <select className="filter-select" style={{ minWidth: '150px' }} value={programFilter} onChange={(e) => setProgramFilter(e.target.value)}>
                            <option value="">All Programs</option>
                            {programs.map(p => <option key={p.loyaltyProgramId} value={p.loyaltyProgramId}>{p.programName}</option>)}
                        </select>
                    </div>

                    <div className="filter-group">
                        <Filter size={18} className="filter-icon" />
                        <select className="filter-select" style={{ minWidth: '150px' }} value={tierFilter} onChange={(e) => setTierFilter(e.target.value)}>
                            <option value="">All Tiers</option>
                            {tiers.map(t => <option key={t.tierId} value={t.tierId}>{t.tierName}</option>)}
                        </select>
                    </div>

                    <div className="filter-group">
                        <Filter size={18} className="filter-icon" />
                        <select className="filter-select" style={{ minWidth: '150px' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="All">All Statuses</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>

                    {(search || programFilter || tierFilter || statusFilter !== 'All') && (
                        <button 
                            className="icon-btn text-muted" 
                            onClick={clearFilters}
                            title="Clear Filters"
                        >
                            <RefreshCw size={16} /> Clear
                        </button>
                    )}
                </div>
                
                <div className="filter-right">
                    <button className="icon-btn" onClick={fetchMemberships} title="Refresh" disabled={loading}>
                        <RefreshCw size={18} className={loading ? "spin" : ""} />
                    </button>
                    <button className="primary-btn" style={{ whiteSpace: 'nowrap' }} onClick={() => setIsEnrollOpen(true)}>
                        + Enroll Customer
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="table-container flex-1">
                {loading ? (
                    <div className="p-8 text-center text-muted">Loading memberships...</div>
                ) : memberships.length === 0 ? (
                    <div className="p-12 text-center text-muted">No memberships found matching filters.</div>
                ) : (
                    <table className="enterprise-table w-full">
                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th>Program</th>
                                <th>Tier</th>
                                <th className="text-right">Points Balance</th>
                                <th className="text-right">Lifetime Points</th>
                                <th>Status</th>
                                <th>Enrolled</th>
                                <th>Updated</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {memberships.map((m) => (
                                <tr key={m.membershipId}>
                                    <td>
                                        <div className="font-medium text-gray-900">{m.customerName}</div>
                                        <div className="text-xs text-muted">{m.customerCode}</div>
                                    </td>
                                    <td>{m.programName}</td>
                                    <td>
                                        {m.tierName ? (
                                            <span className="badge badge-neutral">{m.tierName}</span>
                                        ) : (
                                            <span className="text-muted text-xs italic">Unassigned</span>
                                        )}
                                    </td>
                                    <td className="text-right font-medium text-blue-600">{m.pointsBalance?.toLocaleString() || '0'}</td>
                                    <td className="text-right text-gray-600">{m.lifetimePoints?.toLocaleString() || '0'}</td>
                                    <td>
                                        <span className={`status-badge status-${m.status?.toLowerCase() || 'inactive'}`}>
                                            {m.status}
                                        </span>
                                    </td>
                                    <td className="text-sm text-gray-500">{new Date(m.enrolledAt).toLocaleDateString()}</td>
                                    <td className="text-sm text-gray-500">{new Date(m.updatedAt).toLocaleDateString()}</td>
                                    <td className="text-right">
                                        <TableActionMenu>
                                            <button className="dropdown-item w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center" onClick={() => handleAction('view', m)}>
                                                <Eye size={14} className="mr-2 text-gray-500" /> View Details
                                            </button>
                                            <div className="border-t my-1 border-gray-200 dark:border-gray-700"></div>
                                            {m.status !== 'Active' ? (
                                                <button className="dropdown-item w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center text-success" onClick={() => handleAction('activate', m)}>
                                                    <Play size={14} className="mr-2" /> Activate
                                                </button>
                                            ) : (
                                                <button className="dropdown-item w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center text-warning" onClick={() => handleAction('deactivate', m)}>
                                                    <Square size={14} className="mr-2" /> Deactivate
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

            {isEnrollOpen && (
                <EnrollCustomerDrawer
                    programs={programs.filter(p => p.status === 'Active')}
                    onClose={() => setIsEnrollOpen(false)}
                    onSuccess={() => { setIsEnrollOpen(false); fetchMemberships(); fetchKpis(); }}
                />
            )}

            {viewingMembership && (
                <MembershipDetailDrawer
                    membership={viewingMembership}
                    onClose={() => setViewingMembership(null)}
                />
            )}
        </div>
    );
};

export default CustomersTab;
