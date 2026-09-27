import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, RefreshCw, ChevronLeft, ChevronRight, Building2, MapPin, Mail, Phone, Edit, Ban } from 'lucide-react';
import { contractApi } from '../../services/contractApi';
import TableActionMenu from '../shared/TableActionMenu';
import PartyFormDrawer from './PartyFormDrawer';
import PartyDetailDrawer from './PartyDetailDrawer';
import './ContractsTab.css';

const PartiesTab = () => {
    const [parties, setParties] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    
    // Filters & Pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('All');
    const [page, setPage] = useState(1);
    const pageSize = 15;

    // Drawers State
    const [isFormDrawerOpen, setIsFormDrawerOpen] = useState(false);
    const [selectedPartyForEdit, setSelectedPartyForEdit] = useState(null);
    const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
    const [selectedPartyId, setSelectedPartyId] = useState(null);

    // Debounce search input
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(1);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    // Fetch data
    const fetchParties = useCallback(async () => {
        try {
            setLoading(true);
            const params = { page, pageSize };
            if (debouncedSearch) params.search = debouncedSearch;
            if (typeFilter !== 'All') params.type = typeFilter;
            
            const response = await contractApi.getParties(params);
            
            setParties(response.items || []);
            setTotalCount(response.totalCount || 0);
        } catch (error) {
            console.error("Failed to fetch parties:", error);
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, debouncedSearch, typeFilter]);

    useEffect(() => {
        fetchParties();
    }, [fetchParties]);

    // Handlers
    const handleCreate = () => {
        setSelectedPartyForEdit(null);
        setIsFormDrawerOpen(true);
    };

    const handleEdit = (party, e) => {
        if(e) e.stopPropagation();
        setSelectedPartyForEdit(party);
        setIsFormDrawerOpen(true);
    };

    const handleViewDetails = (partyId) => {
        setSelectedPartyId(partyId);
        setIsDetailDrawerOpen(true);
    };

    const handleDeactivate = async (party, e) => {
        if(e) e.stopPropagation();
        if (window.confirm(`Are you sure you want to deactivate party ${party.partyCode}?`)) {
            try {
                await contractApi.deactivateParty(party.partyId);
                fetchParties();
            } catch (err) {
                console.error("Failed to deactivate party", err);
                alert(err.response?.data?.message || "Failed to deactivate party");
            }
        }
    };

    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    return (
        <div className="contracts-module-wrapper">
            <div className="tab-container">
                {/* Header Actions */}
                <div className="tab-header">
                <div className="search-filter-group">
                    <div className="search-bar">
                        <Search size={18} className="search-icon" />
                        <input 
                            type="text" 
                            placeholder="Search parties..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <select 
                        className="filter-select"
                        value={typeFilter}
                        onChange={(e) => {
                            setTypeFilter(e.target.value);
                            setPage(1);
                        }}
                    >
                        <option value="All">All Types</option>
                        <option value="Vendor">Vendor</option>
                        <option value="Customer">Customer</option>
                        <option value="Partner">Partner</option>
                        <option value="Contractor">Contractor</option>
                    </select>

                    <button className="icon-btn" onClick={fetchParties} title="Refresh">
                        <RefreshCw size={18} className={loading ? "spin" : ""} />
                    </button>
                </div>

                <div className="action-group">
                    <button className="primary-btn" onClick={handleCreate}>
                        <Plus size={18} />
                        <span>Add Party</span>
                    </button>
                </div>
            </div>

            {/* Table Area */}
            <div className="table-container">
                <table className="enterprise-table">
                    <thead>
                        <tr>
                            <th>Party Code</th>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Contact</th>
                            <th>Address</th>
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
                        ) : parties.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="text-center py-8 text-muted">
                                    No parties found matching your criteria.
                                </td>
                            </tr>
                        ) : (
                            parties.map(party => (
                                <tr 
                                    key={party.partyId} 
                                    onClick={() => handleViewDetails(party.partyId)}
                                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                                >
                                    <td className="font-medium text-primary-color" onClick={(e) => { e.stopPropagation(); handleViewDetails(party.partyId); }}>
                                        {party.partyCode}
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <Building2 size={16} className="text-muted" />
                                            <span className="font-semibold">{party.partyName}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${party.partyType.toLowerCase()}`}>
                                            {party.partyType}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex flex-col gap-1 text-sm">
                                            {party.email && (
                                                <div className="flex items-center gap-1 text-muted">
                                                    <Mail size={12} />
                                                    {party.email}
                                                </div>
                                            )}
                                            {party.phone && (
                                                <div className="flex items-center gap-1 text-muted">
                                                    <Phone size={12} />
                                                    {party.phone}
                                                </div>
                                            )}
                                            {!party.email && !party.phone && '-'}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-1 text-sm text-muted">
                                            {party.address ? (
                                                <>
                                                    <MapPin size={12} />
                                                    <span className="truncate max-w-[150px]" title={party.address}>{party.address}</span>
                                                </>
                                            ) : '-'}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${party.status.toLowerCase()}`}>
                                            {party.status}
                                        </span>
                                    </td>
                                    <td>
                                        <TableActionMenu>
                                            <button onClick={(e) => handleEdit(party, e)}>
                                                <Edit size={14} /> Edit Party
                                            </button>
                                            {party.status !== 'Inactive' && (
                                                <button className="danger-text" onClick={(e) => handleDeactivate(party, e)}>
                                                    <Ban size={14} /> Deactivate
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

            <PartyFormDrawer 
                isOpen={isFormDrawerOpen}
                onClose={() => setIsFormDrawerOpen(false)}
                onSuccess={() => {
                    setIsFormDrawerOpen(false);
                    fetchParties();
                }}
                partyToEdit={selectedPartyForEdit}
            />

            <PartyDetailDrawer 
                isOpen={isDetailDrawerOpen}
                onClose={() => setIsDetailDrawerOpen(false)}
                partyId={selectedPartyId}
            />
        </div>
        </div>
    );
};

export default PartiesTab;
