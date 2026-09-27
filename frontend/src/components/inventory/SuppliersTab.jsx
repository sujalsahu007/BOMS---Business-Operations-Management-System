import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Download, RefreshCw, ChevronLeft, ChevronRight, Building2, MapPin, Mail, Phone, ExternalLink } from 'lucide-react';
import { suppliersApi } from '../../services/api';
import SupplierFormDrawer from './SupplierFormDrawer';
import SupplierDetailDrawer from './SupplierDetailDrawer';
import TableActionMenu from '../shared/TableActionMenu';
import './SuppliersTab.css';

const SuppliersTab = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    
    // Filters & Pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [countryFilter, setCountryFilter] = useState('All');
    const [page, setPage] = useState(1);
    const pageSize = 15;

    // Derived unique countries for filter
    const [availableCountries, setAvailableCountries] = useState([]);

    // Drawers State
    const [isFormDrawerOpen, setIsFormDrawerOpen] = useState(false);
    const [selectedSupplierForEdit, setSelectedSupplierForEdit] = useState(null);
    const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
    const [selectedSupplierId, setSelectedSupplierId] = useState(null);

    // Debounce search input
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(1); // Reset to page 1 on search
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    // Fetch data
    const fetchSuppliers = useCallback(async () => {
        try {
            setLoading(true);
            const params = { page, pageSize };
            if (debouncedSearch) params.search = debouncedSearch;
            if (statusFilter !== 'All') params.status = statusFilter;
            
            const response = await suppliersApi.getAll(params);
            
            // Client-side country filtering because API doesn't support it directly
            let fetchedItems = response.data.items || [];
            
            // Extract unique countries from the raw fetched items (before filtering) for the dropdown
            if (availableCountries.length === 0 && fetchedItems.length > 0) {
                const countries = [...new Set(fetchedItems.map(s => s.country).filter(Boolean))];
                setAvailableCountries(countries.sort());
            }

            if (countryFilter !== 'All') {
                fetchedItems = fetchedItems.filter(s => s.country === countryFilter);
            }

            setSuppliers(fetchedItems);
            setTotalCount(response.data.totalCount || 0);
        } catch (error) {
            console.error("Failed to fetch suppliers:", error);
            // Show toast in a real app
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, debouncedSearch, statusFilter, countryFilter, availableCountries.length]);

    useEffect(() => {
        fetchSuppliers();
    }, [fetchSuppliers]);

    // Handlers
    const handleCreate = () => {
        setSelectedSupplierForEdit(null);
        setIsFormDrawerOpen(true);
    };

    const handleEdit = (supplier) => {
        setSelectedSupplierForEdit(supplier);
        setIsFormDrawerOpen(true);
    };

    const handleView = (id) => {
        setSelectedSupplierId(id);
        setIsDetailDrawerOpen(true);
    };

    const handleToggleStatus = async (supplier) => {
        try {
            const newStatus = supplier.status === 'Active' ? 'Inactive' : 'Active';
            await suppliersApi.update(supplier.supplierId, { ...supplier, status: newStatus });
            fetchSuppliers();
        } catch (err) {
            console.error("Failed to toggle status", err);
        }
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setDebouncedSearch('');
        setStatusFilter('All');
        setCountryFilter('All');
        setPage(1);
    };

    const handleExportCSV = () => {
        if (suppliers.length === 0) return;
        
        const headers = ['Supplier Code', 'Supplier Name', 'Contact Person', 'Email', 'Phone', 'City', 'Country', 'Status'];
        const csvRows = [headers.join(',')];
        
        suppliers.forEach(s => {
            const row = [
                `"${s.supplierCode || ''}"`,
                `"${(s.supplierName || '').replace(/"/g, '""')}"`,
                `"${(s.contactPerson || '').replace(/"/g, '""')}"`,
                `"${s.email || ''}"`,
                `"${s.phone || ''}"`,
                `"${(s.city || '').replace(/"/g, '""')}"`,
                `"${(s.country || '').replace(/"/g, '""')}"`,
                `"${s.status || ''}"`
            ];
            csvRows.push(row.join(','));
        });
        
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', `suppliers_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    // Renders
    const renderSkeletons = () => (
        <div className="table-container">
            <table className="enterprise-table">
                <thead>
                    <tr>
                        <th>Supplier</th>
                        <th>Contact</th>
                        <th>Email</th>
                        <th>Location</th>
                        <th>Status</th>
                        <th className="text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {[...Array(5)].map((_, i) => (
                        <tr key={`sk-${i}`}>
                            <td><div className="skeleton h-4 w-32 mb-2"></div><div className="skeleton h-3 w-20"></div></td>
                            <td><div className="skeleton h-4 w-24 mb-2"></div><div className="skeleton h-3 w-20"></div></td>
                            <td><div className="skeleton h-4 w-32"></div></td>
                            <td><div className="skeleton h-4 w-24 mb-2"></div><div className="skeleton h-3 w-16"></div></td>
                            <td><div className="skeleton h-6 w-16 rounded-full"></div></td>
                            <td className="text-right"><div className="skeleton h-8 w-8 rounded-md ml-auto"></div></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderEmptyState = () => {
        const isFiltering = debouncedSearch || statusFilter !== 'All' || countryFilter !== 'All';
        
        return (
            <div className="enterprise-empty-state">
                <div className="empty-icon-wrapper">
                    <Building2 size={48} className="text-slate-300" />
                </div>
                <h3>{isFiltering ? 'No suppliers match your filters' : 'Build your supplier network'}</h3>
                <p>
                    {isFiltering 
                        ? 'Try adjusting your search or clearing your filters to see more results.'
                        : 'Add your first procurement partner to start managing your enterprise supply chain.'}
                </p>
                {isFiltering ? (
                    <button className="btn btn-secondary mt-4" onClick={handleClearFilters}>
                        Clear Filters
                    </button>
                ) : (
                    <button className="btn btn-primary mt-4" onClick={handleCreate}>
                        <Plus size={16} /> Add Supplier
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className="contracts-module-wrapper" style={{ height: '100%' }}>
            <div className="tab-container">
                <div className="tab-header">
                    <div className="search-filter-group">
                        <div className="search-bar">
                            <Search size={16} className="search-icon" />
                            <input 
                                type="text" 
                                placeholder="Search by name, code, email..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        
                        <select className="filter-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                            <option value="All">All Status</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                        
                        <select className="filter-select" value={countryFilter} onChange={(e) => { setCountryFilter(e.target.value); setPage(1); }}>
                            <option value="All">All Countries</option>
                            {availableCountries.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>

                        {(searchTerm || statusFilter !== 'All' || countryFilter !== 'All') && (
                            <button className="secondary-btn" style={{ padding: '6px 12px', fontSize: '0.875rem' }} onClick={handleClearFilters}>
                                Clear Filters
                            </button>
                        )}

                        <button className="icon-btn" onClick={fetchSuppliers} title="Refresh">
                            <RefreshCw size={18} className={loading ? 'spin' : ''} />
                        </button>
                    </div>

                    <div className="action-group">
                        <button 
                            className="secondary-btn" 
                            onClick={handleExportCSV}
                            disabled={suppliers.length === 0}
                        >
                            <Download size={16} /> Export CSV
                        </button>
                        <button className="primary-btn" onClick={handleCreate}>
                            <Plus size={18} /> <span>Add Supplier</span>
                        </button>
                    </div>
                </div>

            {/* Table Content */}
            <div className="module-content">
                {loading ? (
                    renderSkeletons()
                ) : suppliers.length === 0 ? (
                    renderEmptyState()
                ) : (
                    <div className="table-container">
                        <table className="enterprise-table">
                            <thead>
                                <tr>
                                    <th>Supplier</th>
                                    <th>Contact</th>
                                    <th>Email</th>
                                    <th>Location</th>
                                    <th>Status</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {suppliers.map(s => (
                                    <tr key={s.supplierId} onClick={() => handleView(s.supplierId)} className="clickable-row">
                                        <td>
                                            <div className="td-primary">{s.supplierName}</div>
                                            <div className="td-secondary code-font">{s.supplierCode}</div>
                                        </td>
                                        <td>
                                            <div className="td-primary">{s.contactPerson || '-'}</div>
                                            <div className="td-secondary flex items-center gap-1">
                                                {s.phone && <Phone size={12} />}
                                                {s.phone || '-'}
                                            </div>
                                        </td>
                                        <td>
                                            {s.email ? (
                                                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                                    <Mail size={14} /> {s.email}
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td>
                                            <div className="td-primary">{s.city || '-'}</div>
                                            <div className="td-secondary flex items-center gap-1">
                                                {s.country && <MapPin size={12} />}
                                                {s.country || '-'}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${s.status?.toLowerCase()}`}>
                                                {s.status}
                                            </span>
                                        </td>
                                        <td className="text-right" onClick={(e) => e.stopPropagation()}>
                                            <TableActionMenu>
                                                <button onClick={() => handleView(s.supplierId)}>
                                                    <ExternalLink size={14} /> View Details
                                                </button>
                                                <button onClick={() => handleEdit(s)}>
                                                    <Building2 size={14} /> Edit Supplier
                                                </button>
                                                <div className="menu-divider"></div>
                                                <button 
                                                    className={s.status === 'Active' ? 'danger-text' : ''}
                                                    onClick={() => handleToggleStatus(s)}
                                                >
                                                    {s.status === 'Active' ? 'Deactivate' : 'Activate'}
                                                </button>
                                            </TableActionMenu>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {!loading && suppliers.length > 0 && (
                <div className="module-pagination">
                    <div className="pagination-info">
                        Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} suppliers
                    </div>
                    <div className="pagination-controls">
                        <button 
                            className="icon-btn" 
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="page-number">Page {page} of {totalPages}</span>
                        <button 
                            className="icon-btn" 
                            disabled={page === totalPages}
                            onClick={() => setPage(p => p + 1)}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Drawers */}
            {isFormDrawerOpen && (
                <SupplierFormDrawer 
                    supplier={selectedSupplierForEdit}
                    onClose={() => setIsFormDrawerOpen(false)}
                    onSave={() => {
                        setIsFormDrawerOpen(false);
                        fetchSuppliers();
                    }}
                />
            )}

            {isDetailDrawerOpen && (
                <SupplierDetailDrawer
                    supplierId={selectedSupplierId}
                    onClose={() => setIsDetailDrawerOpen(false)}
                />
            )}
            </div>
        </div>
    );
};

export default SuppliersTab;
