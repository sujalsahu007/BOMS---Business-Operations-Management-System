import React, { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, ChevronLeft, ChevronRight, FileSignature, Building2, Calendar, IndianRupee, AlertTriangle } from 'lucide-react';
import { contractApi } from '../../services/contractApi';
import ContractDetailDrawer from './ContractDetailDrawer';
import RenewalFormDrawer from './RenewalFormDrawer';
import './ContractsTab.css'; // Reuse existing styles

const RenewalsTab = () => {
    const [contracts, setContracts] = useState([]);
    const [summary, setSummary] = useState({
        expiringIn7Days: 0,
        expiringIn30Days: 0,
        expiringIn60Days: 0,
        expired: 0
    });
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Pagination & Sorting
    const [page, setPage] = useState(1);
    const pageSize = 15;
    const [sortBy, setSortBy] = useState("EndDateAsc"); // Default: Earliest expiry first

    // Filters
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [expiryWindow, setExpiryWindow] = useState("All"); // 7, 30, 60, All

    const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
    const [selectedContractId, setSelectedContractId] = useState(null);

    const [isRenewalDrawerOpen, setIsRenewalDrawerOpen] = useState(false);
    const [selectedContractForRenewal, setSelectedContractForRenewal] = useState(null);

    const fetchContracts = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            const params = {
                page,
                pageSize,
                sortBy
            };

            if (search.trim()) params.search = search.trim();
            if (statusFilter !== "All") params.status = statusFilter;
            if (expiryWindow !== "All") params.expiryWindowDays = parseInt(expiryWindow);

            const response = await contractApi.getRenewalsExpiry(params);
            
            if (response.summary) setSummary(response.summary);
            if (response.contracts) {
                setContracts(response.contracts.items || []);
                setTotalCount(response.contracts.totalCount || 0);
            }
        } catch (err) {
            console.error("Failed to fetch renewals:", err);
            setError("Unable to load renewal and expiry information.");
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, sortBy, search, statusFilter, expiryWindow]);

    useEffect(() => {
        fetchContracts();
    }, [fetchContracts]);

    const handleView = (id) => {
        setSelectedContractId(id);
        setIsDetailDrawerOpen(true);
    };

    const handleSort = (field) => {
        let newSort = "EndDateAsc";
        if (field === 'EndDate') {
            newSort = sortBy === "EndDateAsc" ? "EndDateDesc" : "EndDateAsc";
        } else if (field === 'Value') {
            newSort = sortBy === "ValueDesc" ? "ValueAsc" : "ValueDesc";
        } else if (field === 'Number') {
            newSort = sortBy === "NumberAsc" ? "NumberDesc" : "NumberAsc";
        }
        setSortBy(newSort);
        setPage(1);
    };

    const clearFilters = () => {
        setSearch("");
        setStatusFilter("All");
        setExpiryWindow("All");
        setSortBy("EndDateAsc");
        setPage(1);
    };

    const getSortIcon = (field) => {
        if (sortBy.startsWith(field)) {
            return sortBy.endsWith("Desc") ? "↓" : "↑";
        }
        return "";
    };

    const getDaysRemainingText = (endDateStr, status) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const end = new Date(endDateStr);
        end.setHours(0, 0, 0, 0);
        
        const diffTime = end - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (status === "Expired" || diffDays < 0) {
            const absDays = Math.abs(diffDays);
            return {
                text: `${absDays} ${absDays === 1 ? 'day' : 'days'} overdue`,
                isOverdue: true,
                isWarning: false
            };
        } else if (diffDays === 0) {
            return {
                text: "Expires Today",
                isOverdue: false,
                isWarning: true
            };
        } else {
            return {
                text: `${diffDays} ${diffDays === 1 ? 'day' : 'days'}`,
                isOverdue: false,
                isWarning: diffDays <= 30
            };
        }
    };

    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    return (
        <div className="contracts-module-wrapper">
            <div className="tab-container">
                
                {/* 1. Dashboard Summary */}
                <div className="kpi-strip" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' }}>
                    <div className="kpi-card compact" onClick={() => { setExpiryWindow("7"); setPage(1); }} style={{ cursor: 'pointer', background: 'var(--surface-color)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--red-400)', lineHeight: 1 }}>{summary.expiringIn7Days}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>≤ 7 DAYS</span>
                    </div>
                    <div className="kpi-card compact" onClick={() => { setExpiryWindow("30"); setPage(1); }} style={{ cursor: 'pointer', background: 'var(--surface-color)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--yellow-400)', lineHeight: 1 }}>{summary.expiringIn30Days}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>8–30 DAYS</span>
                    </div>
                    <div className="kpi-card compact" onClick={() => { setExpiryWindow("60"); setPage(1); }} style={{ cursor: 'pointer', background: 'var(--surface-color)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--blue-400)', lineHeight: 1 }}>{summary.expiringIn60Days}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>31–60 DAYS</span>
                    </div>
                    <div className="kpi-card compact" onClick={() => { setExpiryWindow("0"); setPage(1); }} style={{ cursor: 'pointer', background: 'var(--surface-color)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--red-900)', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--red-500)', lineHeight: 1 }}>{summary.expired}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--red-400)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>EXPIRED</span>
                    </div>
                </div>

                {/* 2. Filters & Actions */}
                <div className="tab-header" style={{ marginBottom: "0.5rem" }}>
                    <div className="search-filter-group">
                        <div className="search-bar">
                            <Search size={18} className="search-icon" />
                            <input 
                                type="text" 
                                placeholder="Search contracts, parties..." 
                                value={search}
                                onChange={e => { setSearch(e.target.value); setPage(1); }}
                            />
                        </div>
                        
                        <select 
                            value={statusFilter} 
                            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                            className="filter-select"
                        >
                            <option value="All">All Statuses</option>
                            <option value="Expiring Soon">Expiring Soon</option>
                            <option value="Expired">Expired</option>
                            <option value="Active">Active</option>
                        </select>

                        <select 
                            value={expiryWindow} 
                            onChange={e => { setExpiryWindow(e.target.value); setPage(1); }}
                            className="filter-select"
                        >
                            <option value="All">All Expiries</option>
                            <option value="7">≤ 7 Days</option>
                            <option value="30">8–30 Days</option>
                            <option value="60">31–60 Days</option>
                            <option value="0">Expired</option>
                        </select>

                        {(search || statusFilter !== "All" || expiryWindow !== "All" || sortBy !== "EndDateAsc") && (
                            <button className="secondary-btn" onClick={clearFilters} style={{ padding: "8px 12px", fontSize: "0.85rem" }}>
                                Clear Filters
                            </button>
                        )}
                        
                        <div style={{ marginLeft: 'auto' }}>
                            <button className="icon-btn" onClick={fetchContracts} title="Refresh">
                                <RefreshCw size={18} className={loading ? "spin" : ""} />
                            </button>
                        </div>
                    </div>
                </div>

                {error && (
                    <div style={{ padding: "1rem", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "8px", color: "var(--red-500)", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                        <AlertTriangle size={20} />
                        <span style={{ fontWeight: 500, fontSize: "0.9rem" }}>{error}</span>
                        <button className="secondary-btn" onClick={fetchContracts} style={{ marginLeft: "auto", padding: "4px 12px" }}>Retry</button>
                    </div>
                )}

                {/* 3. Table */}
                <div className="table-container">
                    <table className="enterprise-table">
                        <thead>
                            <tr>
                                <th style={{ cursor: "pointer" }} onClick={() => handleSort('Number')}>
                                    Contract Number {getSortIcon('Number')}
                                </th>
                                <th>Title & Owner</th>
                                <th>Party</th>
                                <th style={{ cursor: "pointer" }} onClick={() => handleSort('EndDate')}>
                                    End Date {getSortIcon('EndDate')}
                                </th>
                                <th>Days Remaining</th>
                                <th style={{ cursor: "pointer" }} onClick={() => handleSort('Value')}>
                                    Value {getSortIcon('Value')}
                                </th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: "center", padding: "2rem" }}>
                                        <div className="spinner" style={{ margin: "0 auto" }}></div>
                                    </td>
                                </tr>
                            ) : contracts.length === 0 ? (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: "center", padding: "4rem 0", color: "var(--text-muted)" }}>
                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
                                            <FileSignature size={32} style={{ opacity: 0.5 }} />
                                            <p style={{ fontSize: "1rem", fontWeight: 500 }}>
                                                {statusFilter === "Expired" 
                                                    ? "No expired contracts found." 
                                                    : "No contracts are approaching expiry."}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                contracts.map(contract => {
                                    const daysRem = getDaysRemainingText(contract.endDate, contract.status);
                                    let daysRemColor = "var(--text-main)";
                                    if (daysRem.isOverdue) daysRemColor = "var(--red-500, #ef4444)";
                                    else if (daysRem.isWarning) daysRemColor = "var(--amber-500, #f59e0b)";
                                    
                                    return (
                                        <tr key={contract.contractId} onClick={() => handleView(contract.contractId)}>
                                            <td style={{ fontWeight: 600, color: "var(--primary-color)" }}>
                                                {contract.contractNumber}
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>{contract.title}</div>
                                                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                                                    <span style={{ fontWeight: 500 }}>Owner:</span> {contract.ownerName}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                    <Building2 size={14} style={{ color: "var(--text-muted)" }} />
                                                    <span>{contract.partyName}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.85rem", fontWeight: 500 }}>
                                                    <Calendar size={14} style={{ color: "var(--text-muted)" }} />
                                                    {new Date(contract.endDate).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td style={{ fontSize: "0.85rem", fontWeight: 600, color: daysRemColor }}>
                                                {daysRem.text}
                                            </td>
                                            <td>
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.85rem", fontWeight: 500 }}>
                                                    <IndianRupee size={14} style={{ color: "var(--text-muted)" }} />
                                                    {contract.contractValue?.toLocaleString() || '0.00'}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <span className={`status-badge ${contract.status.toLowerCase().replace(' ', '-')}`}>
                                                        {contract.status}
                                                    </span>
                                                    {contract.renewalStatus && (
                                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                                            Renewal: {contract.renewalStatus}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                    <button 
                                                        className="secondary-btn" 
                                                        style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleView(contract.contractId);
                                                        }}
                                                    >
                                                        View
                                                    </button>
                                                    {contract.renewalStatus ? (
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: "4px 8px" }}>
                                                            Renewal in Progress
                                                        </span>
                                                    ) : (
                                                        <button 
                                                            className="secondary-btn" 
                                                            style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (contract.status === "Draft" || contract.status === "Rejected" || contract.status === "Terminated") {
                                                                    alert("This contract is not eligible for renewal.");
                                                                    return;
                                                                }
                                                                setSelectedContractForRenewal(contract);
                                                                setIsRenewalDrawerOpen(true);
                                                            }}
                                                        >
                                                            Renew
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

                {/* 4. Pagination */}
                <div className="pagination-bar">
                    <div className="pagination-info">
                        Showing {totalCount === 0 ? 0 : (page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} entries
                    </div>
                    <div className="pagination-controls">
                        <button 
                            className="pagination-btn" 
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="pagination-page">Page {page} of {totalPages}</span>
                        <button 
                            className="pagination-btn" 
                            disabled={page === totalPages || totalPages === 0}
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>

                <ContractDetailDrawer
                    isOpen={isDetailDrawerOpen}
                    onClose={() => setIsDetailDrawerOpen(false)}
                    contractId={selectedContractId}
                    onUpdate={fetchContracts}
                />

                <RenewalFormDrawer
                    isOpen={isRenewalDrawerOpen}
                    onClose={() => { setIsRenewalDrawerOpen(false); setSelectedContractForRenewal(null); }}
                    originalContract={selectedContractForRenewal}
                    onSuccess={() => {
                        fetchContracts();
                        // Open the newly created draft? For now just refresh the list.
                        alert("Renewal draft created successfully!");
                    }}
                />
            </div>
        </div>
    );
};

export default RenewalsTab;
