import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, FileText, ChevronLeft, ChevronRight, Download, RefreshCw, ExternalLink } from 'lucide-react';
import { purchaseOrdersApi, suppliersApi, warehousesApi } from '../../services/api';
import PurchaseOrderFormDrawer from './PurchaseOrderFormDrawer';
import PurchaseOrderDetailDrawer from './PurchaseOrderDetailDrawer';
import TableActionMenu from '../shared/TableActionMenu';

const PurchaseOrdersTab = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    
    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [supplierFilter, setSupplierFilter] = useState('');
    const [warehouseFilter, setWarehouseFilter] = useState('');
    const [page, setPage] = useState(1);
    const pageSize = 10;

    // Filter Options
    const [suppliers, setSuppliers] = useState([]);
    const [warehouses, setWarehouses] = useState([]);

    // Drawers
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [detailId, setDetailId] = useState(null);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1); // Reset page on search
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Load filter options
    useEffect(() => {
        const loadOptions = async () => {
            try {
                const [suppRes, whRes] = await Promise.all([
                    suppliersApi.getAll({ pageSize: 1000 }),
                    warehousesApi.getAll()
                ]);
                const suppliersData = suppRes.data.items || (Array.isArray(suppRes.data) ? suppRes.data : []);
                const warehousesData = whRes.data.items || (Array.isArray(whRes.data) ? whRes.data : []);
                
                // Filter only active for options
                setSuppliers(suppliersData.filter(s => s.status === 'Active'));
                setWarehouses(warehousesData.filter(w => w.status === 'Active'));
            } catch (error) {
                console.error("Failed to load filter options", error);
            }
        };
        loadOptions();
    }, []);

    // Load Data
    const loadOrders = useCallback(async () => {
        setLoading(true);
        try {
            const res = await purchaseOrdersApi.getAll({
                search: debouncedSearch,
                status: statusFilter,
                supplierId: supplierFilter || null,
                warehouseId: warehouseFilter || null,
                page,
                pageSize
            });
            setOrders(res.data.items || []);
            setTotalCount(res.data.totalCount || 0);
        } catch (error) {
            console.error("Failed to load purchase orders", error);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, statusFilter, supplierFilter, warehouseFilter, page, pageSize]);

    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    const handleExport = () => {
        if (orders.length === 0) return;
        const headers = ["PO Number", "Supplier", "Warehouse", "Order Date", "Expected Delivery", "Total", "Status", "Approval Status", "Created By"];
        const csvContent = [
            headers.join(","),
            ...orders.map(o => [
                o.poNumber,
                `"${o.supplierName}"`,
                `"${o.warehouseCode}"`,
                new Date(o.orderDate).toLocaleDateString(),
                o.expectedDeliveryDate ? new Date(o.expectedDeliveryDate).toLocaleDateString() : "",
                o.grandTotal,
                o.status,
                o.approvalStatus,
                `"${o.creatorName}"`
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `purchase_orders_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getStatusClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'approved': return 'active';
            case 'pending approval': return 'warning';
            case 'rejected': return 'inactive';
            case 'draft': return 'neutral';
            case 'cancelled': return 'inactive';
            case 'ordered': return 'active';
            case 'partiallyreceived': return 'warning';
            case 'fullyreceived': return 'active';
            default: return 'neutral';
        }
    };

    return (
        <div className="contracts-module-wrapper" style={{ height: '100%' }}>
            <div className="tab-container">
                <div className="tab-header">
                    <div className="search-filter-group">
                        <div className="search-bar">
                            <Search size={18} className="search-icon" />
                            <input 
                                type="text" 
                                placeholder="Search PO Number, Supplier..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        
                        <select className="filter-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                            <option value="">All Statuses</option>
                            <option value="Draft">Draft</option>
                            <option value="Pending Approval">Pending Approval</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                            <option value="Ordered">Ordered</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                        
                        <select className="filter-select" value={supplierFilter} onChange={(e) => { setSupplierFilter(e.target.value); setPage(1); }}>
                            <option value="">All Suppliers</option>
                            {suppliers.map(s => (
                                <option key={s.supplierId} value={s.supplierId}>{s.supplierName}</option>
                            ))}
                        </select>

                        <select className="filter-select" value={warehouseFilter} onChange={(e) => { setWarehouseFilter(e.target.value); setPage(1); }}>
                            <option value="">All Warehouses</option>
                            {warehouses.map(w => (
                                <option key={w.warehouseId} value={w.warehouseId}>{w.warehouseCode} - {w.warehouseName}</option>
                            ))}
                        </select>
                        
                        <button className="icon-btn" onClick={loadOrders} title="Refresh">
                            <RefreshCw size={18} className={loading ? "spin" : ""} />
                        </button>
                    </div>

                    <div className="action-group">
                        <button className="secondary-btn" onClick={handleExport} disabled={orders.length === 0}>
                            <Download size={16} /> Export CSV
                        </button>
                        <button className="primary-btn" onClick={() => setIsFormOpen(true)}>
                            <Plus size={18} /> 
                            <span>Create PO</span>
                        </button>
                    </div>
                </div>

            {/* Content Area */}
            <div className="module-content">
                {loading ? (
                    <div className="enterprise-table-container">
                        <table className="enterprise-table">
                            <thead>
                                <tr>
                                    <th>PO Details</th>
                                    <th>Supplier</th>
                                    <th>Warehouse</th>
                                    <th>Dates</th>
                                    <th>Total</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[1, 2, 3, 4, 5].map(i => (
                                    <tr key={i}>
                                        <td><div className="skeleton h-4 w-24"></div></td>
                                        <td><div className="skeleton h-4 w-32"></div></td>
                                        <td><div className="skeleton h-4 w-16"></div></td>
                                        <td><div className="skeleton h-4 w-24"></div></td>
                                        <td><div className="skeleton h-4 w-16"></div></td>
                                        <td><div className="skeleton h-6 w-20 rounded"></div></td>
                                        <td><div className="skeleton h-8 w-8 rounded"></div></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="enterprise-empty-state">
                        <div className="empty-icon-wrapper">
                            <FileText size={48} className="text-slate-400" />
                        </div>
                        <h3>No Purchase Orders Found</h3>
                        <p>{searchQuery || statusFilter || supplierFilter || warehouseFilter 
                            ? "No purchase orders match your current filter criteria. Try clearing some filters." 
                            : "You haven't created any purchase orders yet."}</p>
                        {!(searchQuery || statusFilter || supplierFilter || warehouseFilter) && (
                            <button className="btn-primary mt-4" onClick={() => setIsFormOpen(true)}>
                                Create First Purchase Order
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="enterprise-table-container">
                        <table className="enterprise-table">
                            <thead>
                                <tr>
                                    <th>PO Details</th>
                                    <th>Supplier</th>
                                    <th>Warehouse</th>
                                    <th>Dates</th>
                                    <th>Total</th>
                                    <th>Status</th>
                                    <th style={{width: '60px'}}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map(order => (
                                    <tr key={order.purchaseOrderId} onClick={() => setDetailId(order.purchaseOrderId)}>
                                        <td>
                                            <div className="td-primary code-font">{order.poNumber}</div>
                                            <div className="td-secondary">By: {order.creatorName}</div>
                                        </td>
                                        <td>
                                            <div className="td-primary">{order.supplierName}</div>
                                        </td>
                                        <td>
                                            <div className="td-primary">{order.warehouseCode}</div>
                                        </td>
                                        <td>
                                            <div className="td-primary">{new Date(order.orderDate).toLocaleDateString()}</div>
                                            {order.expectedDeliveryDate && (
                                                <div className="td-secondary">Exp: {new Date(order.expectedDeliveryDate).toLocaleDateString()}</div>
                                            )}
                                        </td>
                                        <td>
                                            <div className="td-primary font-mono">${order.grandTotal.toFixed(2)}</div>
                                        </td>
                                        <td>
                                            <div style={{display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start'}}>
                                                <span className={`status-badge ${getStatusClass(order.status)}`}>
                                                    {order.status}
                                                </span>
                                                {order.status !== 'Draft' && order.status !== 'Cancelled' && (
                                                    <span style={{fontSize: '0.7rem', color: 'var(--text-muted)'}}>
                                                        {order.approvalStatus}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td onClick={(e) => e.stopPropagation()}>
                                            <TableActionMenu>
                                                <button onClick={() => setDetailId(order.purchaseOrderId)}>
                                                    <ExternalLink size={14} /> View Details
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
            {!loading && orders.length > 0 && (
                <div className="module-pagination">
                    <div className="pagination-info">
                        Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} entries
                    </div>
                    <div className="pagination-controls">
                        <button 
                            className="btn-secondary" 
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            style={{padding: '4px 8px'}}
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="page-number">Page {page}</span>
                        <button 
                            className="btn-secondary" 
                            disabled={page * pageSize >= totalCount}
                            onClick={() => setPage(p => p + 1)}
                            style={{padding: '4px 8px'}}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Drawers */}
            {isFormOpen && (
                <PurchaseOrderFormDrawer 
                    onClose={() => setIsFormOpen(false)} 
                    onSuccess={() => { setIsFormOpen(false); loadOrders(); }}
                    suppliers={suppliers}
                    warehouses={warehouses}
                />
            )}
            
            {detailId && (
                <PurchaseOrderDetailDrawer
                    poId={detailId}
                    onClose={() => setDetailId(null)}
                    onUpdate={() => loadOrders()}
                />
            )}
        </div>
    </div>
    );
};

export default PurchaseOrdersTab;
