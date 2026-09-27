import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, RefreshCw, ChevronLeft, ChevronRight, FileSignature, Building2, Calendar, IndianRupee, ExternalLink, Edit, Send, CheckCircle, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import { contractApi } from '../../services/contractApi';
import TableActionMenu from '../shared/TableActionMenu';
import ContractFormDrawer from './ContractFormDrawer';
import ContractDetailDrawer from './ContractDetailDrawer';
import './ContractsTab.css';

const ContractsTab = () => {
    const [contracts, setContracts] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    
    // Filters & Pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [typeFilter, setTypeFilter] = useState('');
    const [ownerFilter, setOwnerFilter] = useState('');
    const [users, setUsers] = useState([]);
    const [page, setPage] = useState(1);
    const pageSize = 15;

    // Drawers State
    const [isFormDrawerOpen, setIsFormDrawerOpen] = useState(false);
    const [selectedContractForEdit, setSelectedContractForEdit] = useState(null);
    const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
    const [selectedContractId, setSelectedContractId] = useState(null);

    // Debounce search input
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(1);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    // Fetch data
    const fetchContracts = useCallback(async () => {
        try {
            setLoading(true);
            const params = { page, pageSize };
            if (debouncedSearch) params.search = debouncedSearch;
            if (statusFilter !== 'All') params.status = statusFilter;
            if (typeFilter) params.type = typeFilter;
            if (ownerFilter) params.ownerId = ownerFilter;
            
            const response = await contractApi.getContracts(params);
            
            setContracts(response.items || []);
            setTotalCount(response.totalCount || 0);
        } catch (error) {
            console.error("Failed to fetch contracts:", error);
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, debouncedSearch, statusFilter, typeFilter, ownerFilter]);

    useEffect(() => {
        fetchContracts();
    }, [fetchContracts]);

    useEffect(() => {
        // Fetch users for the owner filter
        const fetchUsers = async () => {
            try {
                const response = await api.get('/users');
                setUsers(response.data.items || []);
            } catch (err) {
                console.error("Failed to fetch users", err);
            }
        };
        fetchUsers();
    }, []);

    // Handlers
    const handleCreate = () => {
        setSelectedContractForEdit(null);
        setIsFormDrawerOpen(true);
    };

    const handleEdit = (contract) => {
        // Can only edit if in Draft status usually, but we'll let the backend/frontend decide
        setSelectedContractForEdit(contract);
        setIsFormDrawerOpen(true);
    };

    const handleView = (id) => {
        setSelectedContractId(id);
        setIsDetailDrawerOpen(true);
    };

    const handleContractAction = async (action, contract) => {
        try {
            if (action === 'submitReview') {
                await contractApi.submitForReview(contract.contractId);
            } else if (action === 'submitApproval') {
                await contractApi.submitForApproval(contract.contractId);
            } else if (action === 'delete') {
                if (window.confirm('Are you sure you want to delete this draft?')) {
                    // Assuming delete API exists, but if not we leave it as alert for now
                    try {
                        await api.delete(`/contracts/${contract.contractId}`);
                    } catch (e) {
                        console.error("Delete failed", e);
                    }
                } else {
                    return;
                }
            }
            fetchContracts();
        } catch (err) {
            console.error(`Action ${action} failed:`, err);
            alert(`Action failed: ${err.response?.data?.message || err.message}`);
        }
    };

    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    return (
        <div className="contracts-module-wrapper" style={{ height: '100%' }}>
            <div className="tab-container">
                {/* Header Actions */}
            <div className="tab-header">
                <div className="search-filter-group">
                    <div className="search-bar">
                        <Search size={18} className="search-icon" />
                        <input 
                            type="text" 
                            placeholder="Search contracts..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <select 
                        className="filter-select"
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setPage(1);
                        }}
                    >
                        <option value="All">All Statuses</option>
                        <option value="Draft">Draft</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Pending Approval">Pending Approval</option>
                        <option value="Active">Active</option>
                        <option value="Expiring Soon">Expiring Soon</option>
                        <option value="Expired">Expired</option>
                        <option value="Terminated">Terminated</option>
                        <option value="Rejected">Rejected</option>
                    </select>

                    <select 
                        className="filter-select"
                        value={typeFilter}
                        onChange={(e) => {
                            setTypeFilter(e.target.value);
                            setPage(1);
                        }}
                    >
                        <option value="">All Types</option>
                        <option value="Non-Disclosure Agreement">NDA</option>
                        <option value="Master Service Agreement">MSA</option>
                        <option value="Vendor Agreement">Vendor Agreement</option>
                        <option value="Employment Contract">Employment Contract</option>
                        <option value="Lease Agreement">Lease Agreement</option>
                        <option value="Other">Other</option>
                    </select>

                    <select 
                        className="filter-select"
                        value={ownerFilter}
                        onChange={(e) => {
                            setOwnerFilter(e.target.value);
                            setPage(1);
                        }}
                    >
                        <option value="">All Owners</option>
                        {users.map(u => (
                            <option key={u.userId} value={u.userId}>{u.firstName} {u.lastName}</option>
                        ))}
                    </select>

                    {(statusFilter !== 'All' || typeFilter || ownerFilter || debouncedSearch) && (
                        <button 
                            className="secondary-btn" 
                            style={{ padding: '6px 12px', fontSize: '0.875rem' }}
                            onClick={() => {
                                setStatusFilter('All');
                                setTypeFilter('');
                                setOwnerFilter('');
                                setSearchTerm('');
                            }}
                        >
                            Clear
                        </button>
                    )}

                    <button className="icon-btn" onClick={fetchContracts} title="Refresh">
                        <RefreshCw size={18} className={loading ? "spin" : ""} />
                    </button>
                </div>

                <div className="action-group">
                    <button className="primary-btn" onClick={handleCreate}>
                        <Plus size={18} />
                        <span>New Contract</span>
                    </button>
                </div>
            </div>

            {/* Table Area */}
            <div className="table-container">
                <table className="enterprise-table">
                    <thead>
                        <tr>
                            <th>Contract Number</th>
                            <th>Title</th>
                            <th>Type</th>
                            <th>Party</th>
                            <th>Duration</th>
                            <th>Value</th>
                            <th>Owner</th>
                            <th>Status</th>
                            <th className="actions-col"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="7" className="text-center py-8">
                                    <div className="spinner"></div>
                                </td>
                            </tr>
                        ) : contracts.length === 0 ? (
                            <tr>
                                <td colSpan="9" className="text-center py-8">
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                        <div className="text-muted" style={{ fontSize: '1.125rem' }}>No contracts yet.</div>
                                        <button className="primary-btn" onClick={handleCreate}>
                                            <Plus size={18} />
                                            <span>Create Contract</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            contracts.map(contract => (
                                <tr key={contract.contractId} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => handleView(contract.contractId)}>
                                    <td className="font-medium text-primary-color" onClick={(e) => { e.stopPropagation(); handleView(contract.contractId); }}>
                                        {contract.contractNumber}
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <FileSignature size={16} className="text-muted" />
                                            <span className="font-semibold">{contract.title}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="text-sm">{contract.contractType}</span>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <Building2 size={16} className="text-muted" />
                                            <span>{contract.partyName}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-1 text-sm text-muted">
                                            <Calendar size={12} />
                                            {new Date(contract.startDate).toLocaleDateString()} - {new Date(contract.endDate).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-1 font-medium">
                                            <IndianRupee size={14} className="text-muted" />
                                            {contract.contractValue?.toLocaleString() || '0.00'}
                                        </div>
                                    </td>
                                    <td>
                                        <span className="text-sm">{contract.ownerName}</span>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${contract.status.replace(/\s+/g, '-').toLowerCase()}`}>
                                            {contract.status}
                                        </span>
                                    </td>
                                    <td onClick={(e) => e.stopPropagation()}>
                                        <TableActionMenu>
                                            <button onClick={() => handleView(contract.contractId)}>
                                                <ExternalLink size={14} /> View Details
                                            </button>
                                            {contract.status === 'Draft' && (
                                                <button onClick={() => handleEdit(contract)}>
                                                    <Edit size={14} /> Edit Draft
                                                </button>
                                            )}
                                            {contract.status === 'Draft' && (
                                                <button onClick={() => handleContractAction('submitReview', contract)}>
                                                    <Send size={14} /> Submit for Review
                                                </button>
                                            )}
                                            {contract.status === 'Under Review' && (
                                                <button onClick={() => handleContractAction('submitApproval', contract)}>
                                                    <CheckCircle size={14} /> Submit for Approval
                                                </button>
                                            )}
                                            {contract.status === 'Draft' && (
                                                <button className="danger-text" onClick={() => handleContractAction('delete', contract)}>
                                                    <Trash2 size={14} /> Delete Draft
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
            <div className="pagination-bar">
                <div className="pagination-info">
                    Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} entries
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

            {/* Drawers */}
            <ContractFormDrawer 
                isOpen={isFormDrawerOpen}
                onClose={() => setIsFormDrawerOpen(false)}
                onSuccess={() => {
                    setIsFormDrawerOpen(false);
                    fetchContracts();
                }}
                contractToEdit={selectedContractForEdit}
            />

            <ContractDetailDrawer
                isOpen={isDetailDrawerOpen}
                onClose={() => setIsDetailDrawerOpen(false)}
                contractId={selectedContractId}
                onUpdate={fetchContracts}
            />
        </div>
    </div>
    );
};

export default ContractsTab;
