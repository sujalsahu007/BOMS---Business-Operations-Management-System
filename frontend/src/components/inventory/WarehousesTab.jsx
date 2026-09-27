import React, { useState, useEffect } from 'react';
import { 
    Search, Plus, Filter, LayoutGrid, List, AlertCircle, Warehouse, 
    Box, Activity, MoreVertical, Edit2, Archive, Package
} from 'lucide-react';
import { warehousesApi, stockApi, productsApi, usersApi } from '../../services/api';
import WarehouseFormDrawer from './WarehouseFormDrawer';
import WarehouseDetailDrawer from './WarehouseDetailDrawer';
import InitializeStockDrawer from './InitializeStockDrawer';
import './WarehousesTab.css';

const WarehousesTab = () => {
    // Top Level State
    const [subTab, setSubTab] = useState('warehouses'); // 'warehouses' | 'stock'
    
    // Warehouses State
    const [warehouses, setWarehouses] = useState([]);
    const [loadingWarehouses, setLoadingWarehouses] = useState(true);
    const [warehouseSearch, setWarehouseSearch] = useState('');
    const [warehouseStatusFilter, setWarehouseStatusFilter] = useState('All');
    
    // Stock State
    const [stockItems, setStockItems] = useState([]);
    const [loadingStock, setLoadingStock] = useState(false);
    const [stockWarehouseFilter, setStockWarehouseFilter] = useState('All');
    const [stockProductFilter, setStockProductFilter] = useState('All');
    const [stockStatusFilter, setStockStatusFilter] = useState('All');

    // Filter Dropdown Data
    const [filterWarehouses, setFilterWarehouses] = useState([]);
    const [filterProducts, setFilterProducts] = useState([]);

    // Drawers State
    const [isWarehouseDrawerOpen, setIsWarehouseDrawerOpen] = useState(false);
    const [selectedWarehouseForEdit, setSelectedWarehouseForEdit] = useState(null);
    const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
    const [selectedWarehouseId, setSelectedWarehouseId] = useState(null);
    const [isInitStockDrawerOpen, setIsInitStockDrawerOpen] = useState(false);

    useEffect(() => {
        if (subTab === 'warehouses') {
            fetchWarehouses();
        } else {
            fetchStock();
            if (filterWarehouses.length === 0) fetchFilterOptions();
        }
    }, [subTab, warehouseSearch, warehouseStatusFilter, stockWarehouseFilter, stockProductFilter, stockStatusFilter]);

    const fetchFilterOptions = async () => {
        try {
            const [whRes, prodRes] = await Promise.all([
                warehousesApi.getAll({ status: 'Active', pageSize: 100 }),
                productsApi.getAll({ status: 'Active', pageSize: 100 })
            ]);
            setFilterWarehouses(whRes.data.items || []);
            setFilterProducts(prodRes.data.items || []);
        } catch (error) {
            console.error("Failed to load filter options", error);
        }
    };

    const fetchWarehouses = async () => {
        try {
            setLoadingWarehouses(true);
            const params = { page: 1, pageSize: 50 };
            if (warehouseSearch) params.search = warehouseSearch;
            if (warehouseStatusFilter !== 'All') params.status = warehouseStatusFilter;
            
            const response = await warehousesApi.getAll(params);
            setWarehouses(response.data.items || []);
        } catch (error) {
            console.error("Failed to fetch warehouses:", error);
        } finally {
            setLoadingWarehouses(false);
        }
    };

    const fetchStock = async () => {
        try {
            setLoadingStock(true);
            const params = { page: 1, pageSize: 50 };
            if (stockWarehouseFilter !== 'All') params.warehouseId = stockWarehouseFilter;
            if (stockProductFilter !== 'All') params.productId = stockProductFilter;
            if (stockStatusFilter !== 'All') params.stockStatus = stockStatusFilter;

            const response = await stockApi.getOverview(params);
            setStockItems(response.data.items || []);
        } catch (error) {
            console.error("Failed to fetch stock:", error);
        } finally {
            setLoadingStock(false);
        }
    };

    const handleCreateWarehouse = () => {
        setSelectedWarehouseForEdit(null);
        setIsWarehouseDrawerOpen(true);
    };

    const handleEditWarehouse = (e, warehouse) => {
        e.stopPropagation();
        setSelectedWarehouseForEdit(warehouse);
        setIsWarehouseDrawerOpen(true);
    };

    const handleViewWarehouse = (id) => {
        setSelectedWarehouseId(id);
        setIsDetailDrawerOpen(true);
    };

    const renderWarehousesTable = () => {
        if (loadingWarehouses) return <div className="loading-state">Loading warehouses...</div>;
        if (warehouses.length === 0) {
            return (
                <div className="empty-state">
                    <Warehouse size={48} />
                    <h3>No warehouses found</h3>
                    <p>Get started by adding your first warehouse location.</p>
                    <button className="btn btn-primary" onClick={handleCreateWarehouse}>
                        <Plus size={16} /> Add Warehouse
                    </button>
                </div>
            );
        }

        return (
            <div className="table-container">
                <table className="enterprise-table">
                    <thead>
                        <tr>
                            <th>Code</th>
                            <th>Warehouse</th>
                            <th>Location</th>
                            <th>Manager</th>
                            <th>Capacity</th>
                            <th>Products</th>
                            <th>Total Units</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {warehouses.map(w => (
                            <tr key={w.warehouseId} onClick={() => handleViewWarehouse(w.warehouseId)} className="clickable-row">
                                <td><span className="code-badge">{w.warehouseCode}</span></td>
                                <td>{w.warehouseName}</td>
                                <td>{w.location || '-'}</td>
                                <td>{w.managerName}</td>
                                <td>{w.capacity?.toLocaleString() ?? '0'}</td>
                                <td>{w.productsCount}</td>
                                <td>{w.totalAvailableUnits?.toLocaleString() ?? '0'}</td>
                                <td>
                                    <span className={`status-badge ${(w.status || 'active').toLowerCase()}`}>
                                        {w.status || 'Active'}
                                    </span>
                                </td>
                                    <td className="actions-col">
                                        <button 
                                            className="icon-btn" 
                                            onClick={(e) => handleEditWarehouse(e, w)}
                                            title="Edit Warehouse"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                    </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderStockTable = () => {
        if (loadingStock) return <div className="loading-state">Loading stock...</div>;
        if (stockItems.length === 0) {
            return (
                <div className="empty-state">
                    <Package size={48} />
                    <h3>No stock recorded</h3>
                    <p>Initialize stock for your products to see them here.</p>
                    <button className="btn btn-primary" onClick={() => setIsInitStockDrawerOpen(true)}>
                        <Plus size={16} /> Initialize Stock
                    </button>
                </div>
            );
        }

        return (
            <div className="table-container">
                <table className="enterprise-table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>SKU</th>
                            <th>Warehouse</th>
                            <th>Available</th>
                            <th>Reserved</th>
                            <th>Reorder Level</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stockItems.map(s => (
                            <tr key={s.warehouseStockId}>
                                <td className="product-cell">
                                    {s.imageUrl ? (
                                        <img src={`http://localhost:5280${s.imageUrl}`} alt={s.productName} className="product-thumb" />
                                    ) : (
                                        <div className="product-thumb placeholder">
                                            <Package size={16} />
                                        </div>
                                    )}
                                    <span>{s.productName}</span>
                                </td>
                                <td>{s.sku}</td>
                                <td>{s.warehouseName}</td>
                                <td><strong>{s.availableQuantity?.toLocaleString() ?? '0'}</strong></td>
                                <td>{s.reservedQuantity?.toLocaleString() ?? '0'}</td>
                                <td>{s.reorderLevel?.toLocaleString() ?? '0'}</td>
                                <td>
                                    <span className={`status-badge stock-${(s.stockStatus || 'unknown').replace(/\s+/g, '-').toLowerCase()}`}>
                                        {s.stockStatus || 'Unknown'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="contracts-module-wrapper" style={{ height: '100%' }}>
            <div className="tab-container">
                <div className="tab-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '1rem' }}>
                    <div className="sub-tabs" style={{ marginBottom: 0 }}>
                        <button 
                            className={subTab === 'warehouses' ? 'active' : ''} 
                            onClick={() => setSubTab('warehouses')}
                        >
                            Warehouses
                        </button>
                        <button 
                            className={subTab === 'stock' ? 'active' : ''} 
                            onClick={() => setSubTab('stock')}
                        >
                            Stock Overview
                        </button>
                    </div>
                
                    {subTab === 'warehouses' ? (
                    <div style={{ display: 'flex', gap: '1rem', width: '100%', justifyContent: 'space-between' }}>
                        <div className="search-filter-group">
                            <div className="search-bar">
                                <Search size={16} className="search-icon" />
                                <input 
                                    type="text" 
                                    placeholder="Search warehouses..." 
                                    value={warehouseSearch}
                                    onChange={(e) => setWarehouseSearch(e.target.value)}
                                />
                            </div>
                            <select 
                                className="filter-select"
                                value={warehouseStatusFilter}
                                onChange={(e) => setWarehouseStatusFilter(e.target.value)}
                            >
                                <option value="All">All Status</option>
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                        <div className="action-group">
                            <button className="primary-btn" onClick={handleCreateWarehouse}>
                                <Plus size={16} /> <span>Add Warehouse</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', gap: '1rem', width: '100%', justifyContent: 'space-between' }}>
                        <div className="search-filter-group">
                            <select 
                                className="filter-select"
                                value={stockWarehouseFilter}
                                onChange={(e) => setStockWarehouseFilter(e.target.value)}
                            >
                                <option value="All">All Warehouses</option>
                                {filterWarehouses.map(w => (
                                    <option key={w.warehouseId} value={w.warehouseId}>{w.warehouseName}</option>
                                ))}
                            </select>
                            <select 
                                className="filter-select"
                                value={stockProductFilter}
                                onChange={(e) => setStockProductFilter(e.target.value)}
                            >
                                <option value="All">All Products</option>
                                {filterProducts.map(p => (
                                    <option key={p.productId} value={p.productId}>{p.productName}</option>
                                ))}
                            </select>
                            <select 
                                className="filter-select"
                                value={stockStatusFilter}
                                onChange={(e) => setStockStatusFilter(e.target.value)}
                            >
                                <option value="All">All Stock Status</option>
                                <option value="In Stock">In Stock</option>
                                <option value="Low Stock">Low Stock</option>
                                <option value="Out of Stock">Out of Stock</option>
                            </select>
                        </div>
                        <div className="action-group">
                            <button className="primary-btn" onClick={() => setIsInitStockDrawerOpen(true)}>
                                <Plus size={16} /> <span>Initialize Stock</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="tab-body">
                {subTab === 'warehouses' ? renderWarehousesTable() : renderStockTable()}
            </div>

            {isWarehouseDrawerOpen && (
                <WarehouseFormDrawer 
                    warehouse={selectedWarehouseForEdit}
                    onClose={() => setIsWarehouseDrawerOpen(false)}
                    onSave={() => {
                        setIsWarehouseDrawerOpen(false);
                        fetchWarehouses();
                    }}
                />
            )}

            {isDetailDrawerOpen && (
                <WarehouseDetailDrawer
                    warehouseId={selectedWarehouseId}
                    onClose={() => setIsDetailDrawerOpen(false)}
                />
            )}

            {isInitStockDrawerOpen && (
                <InitializeStockDrawer
                    onClose={() => setIsInitStockDrawerOpen(false)}
                    onSave={() => {
                        setIsInitStockDrawerOpen(false);
                        fetchStock();
                        if (subTab === 'warehouses') fetchWarehouses();
                    }}
                />
            )}
        </div>
        </div>
    );
};

export default WarehousesTab;
