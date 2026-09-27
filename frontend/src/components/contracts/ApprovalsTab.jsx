import React, { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, ChevronLeft, ChevronRight, FileSignature, Building2, Calendar, IndianRupee, CheckCircle, AlertTriangle, User } from 'lucide-react';
import { contractApi } from '../../services/contractApi';
import ApprovalDetailDrawer from './ApprovalDetailDrawer';
import './ContractsTab.css'; // Reuse existing styles

const ApprovalsTab = () => {
    const [contracts, setContracts] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Pagination
    const [page, setPage] = useState(1);
    const pageSize = 15;

    // Filters
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("All");
    const [dateRange, setDateRange] = useState("All"); // All, Next 7 Days, Next 30 Days

    const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
    const [selectedContractId, setSelectedContractId] = useState(null);

    const fetchContracts = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            const params = {
                page,
                pageSize
            };

            if (search.trim()) params.search = search.trim();
            if (typeFilter !== "All") params.type = typeFilter;
            if (dateRange !== "All") params.dateRange = dateRange;

            const response = await contractApi.getPendingApprovals(params);
            
            setContracts(response.items || []);
            setTotalCount(response.totalCount || 0);
        } catch (err) {
            console.error("Failed to fetch approvals:", err);
            setError("Unable to load approval requests.");
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, search, typeFilter, dateRange]);

    useEffect(() => {
        fetchContracts();
    }, [fetchContracts]);

    const handleView = (id) => {
        setSelectedContractId(id);
        setIsDetailDrawerOpen(true);
    };

    const clearFilters = () => {
        setSearch("");
        setTypeFilter("All");
        setDateRange("All");
        setPage(1);
    };

    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    return (
        <div className="contracts-module-wrapper">
            <div className="tab-container">
                {/* Header & Filters */}
                <div className="tab-header" style={{ marginBottom: "1rem" }}>
                    <div className="search-filter-group">
                        <div className="search-bar">
                            <Search size={18} className="search-icon" />
                            <input 
                                type="text" 
                                placeholder="Search by number, title, party..." 
                                value={search}
                                onChange={e => { setSearch(e.target.value); setPage(1); }}
                            />
                        </div>
                        
                        <select 
                            value={typeFilter} 
                            onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
                            className="filter-select"
                        >
                            <option value="All">All Types</option>
                            <option value="NDA">NDA</option>
                            <option value="MSA">MSA</option>
                            <option value="SOW">SOW</option>
                            <option value="Vendor Agreement">Vendor Agreement</option>
                            <option value="Employment">Employment</option>
                        </select>

                        <select 
                            value={dateRange} 
                            onChange={e => { setDateRange(e.target.value); setPage(1); }}
                            className="filter-select"
                        >
                            <option value="All">All Start Dates</option>
                            <option value="Next 7 Days">Starts in Next 7 Days</option>
                            <option value="Next 30 Days">Starts in Next 30 Days</option>
                        </select>

                        {(search || typeFilter !== "All" || dateRange !== "All") && (
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

                {/* Table */}
                <div className="table-container">
                    <table className="enterprise-table">
                        <thead>
                            <tr>
                                <th>Contract Number</th>
                                <th>Title</th>
                                <th>Party</th>
                                <th>Value</th>
                                <th>Submitted By</th>
                                <th>Submitted Date</th>
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
                                            <CheckCircle size={32} style={{ opacity: 0.5, color: "var(--green-500)" }} />
                                            <p style={{ fontSize: "1rem", fontWeight: 500 }}>
                                                No contracts require your approval.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                contracts.map(contract => (
                                    <tr key={contract.contractId} onClick={() => handleView(contract.contractId)}>
                                        <td style={{ fontWeight: 600, color: "var(--primary-color)" }}>
                                            {contract.contractNumber}
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{contract.title}</div>
                                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                                                {contract.contractType}
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
                                                <IndianRupee size={14} style={{ color: "var(--text-muted)" }} />
                                                {contract.contractValue?.toLocaleString() || '0.00'} {contract.currency}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                <User size={14} style={{ color: "var(--text-muted)" }} />
                                                <span>{contract.ownerName}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.85rem", fontWeight: 500 }}>
                                                <Calendar size={14} style={{ color: "var(--text-muted)" }} />
                                                {contract.updatedAt ? new Date(contract.updatedAt).toLocaleDateString() : new Date(contract.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${contract.status.toLowerCase().replace(' ', '-')}`}>
                                                {contract.status}
                                            </span>
                                        </td>
                                        <td>
                                            <button 
                                                className="primary-btn" 
                                                style={{ padding: "4px 12px", fontSize: "0.75rem", background: "var(--primary-color)" }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleView(contract.contractId);
                                                }}
                                            >
                                                Review
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
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

                <ApprovalDetailDrawer
                    isOpen={isDetailDrawerOpen}
                    onClose={() => setIsDetailDrawerOpen(false)}
                    contractId={selectedContractId}
                    onUpdate={fetchContracts}
                />
            </div>
        </div>
    );
};

export default ApprovalsTab;
