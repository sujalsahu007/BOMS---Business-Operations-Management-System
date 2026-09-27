import React, { useState, useEffect } from 'react';
import { X, MapPin, User, Package, Archive } from 'lucide-react';
import { warehousesApi, stockApi, activityApi } from '../../services/api';
import SharedDrawer from '../shared/SharedDrawer';
import './InventoryDrawers.css';

const WarehouseDetailDrawer = ({ warehouseId, onClose }) => {
    const [warehouse, setWarehouse] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [activities, setActivities] = useState([]);
    const [activeSection, setActiveSection] = useState('stock'); // 'stock', 'transactions', 'activity'
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (warehouseId) {
            loadData();
        }
    }, [warehouseId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [whRes, txRes, actRes] = await Promise.all([
                warehousesApi.getById(warehouseId),
                stockApi.getTransactions({ warehouseId }),
                activityApi.getForEntity('Warehouse', warehouseId)
            ]);
            
            setWarehouse(whRes.data);
            setTransactions(txRes.data.items || []);
            setActivities(actRes.data || []);
        } catch (err) {
            console.error("Failed to load warehouse details:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <SharedDrawer isOpen={true} onClose={onClose} title="Loading Warehouse..." icon={Package}>
                <div className="inventory-drawer-content p-6">
                    <div className="loading-state">Loading warehouse details...</div>
                </div>
            </SharedDrawer>
        );
    }

    if (!warehouse) return null;

    return (
        <SharedDrawer
            isOpen={true}
            onClose={onClose}
            title="Warehouse Details"
            icon={Package}
        >
            <div className="inventory-drawer-content">
                    <div className="detail-view">
                        
                        {/* Overview Section */}
                        <div className="detail-header-section">
                            <div className="detail-title-row">
                                <h3>{warehouse.warehouseName}</h3>
                                <span className={`status-badge ${warehouse.status.toLowerCase()}`}>
                                    {warehouse.status}
                                </span>
                            </div>
                            
                            <div className="detail-grid">
                                <div className="detail-item">
                                    <span className="detail-label">Warehouse Code</span>
                                    <span className="detail-value code-badge large">{warehouse.warehouseCode}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Capacity</span>
                                    <span className="detail-value">{warehouse.capacity.toLocaleString()} units</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Location</span>
                                    <span className="detail-value flex items-center gap-2">
                                        <MapPin size={14} className="text-slate-400" />
                                        {warehouse.location || '-'}
                                    </span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Manager</span>
                                    <span className="detail-value flex items-center gap-2">
                                        <User size={14} className="text-slate-400" />
                                        {warehouse.managerName}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="section-tabs">
                            <button 
                                className={activeSection === 'stock' ? 'active' : ''} 
                                onClick={() => setActiveSection('stock')}
                            >
                                Stock ({warehouse.stock?.length || 0})
                            </button>
                            <button 
                                className={activeSection === 'transactions' ? 'active' : ''} 
                                onClick={() => setActiveSection('transactions')}
                            >
                                Transactions ({transactions.length})
                            </button>
                            <button 
                                className={activeSection === 'activity' ? 'active' : ''} 
                                onClick={() => setActiveSection('activity')}
                            >
                                Activity
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className="section-content">
                            {activeSection === 'stock' && (
                                <div className="table-container">
                                    {warehouse.stock?.length === 0 ? (
                                        <div className="empty-state">
                                            <Package size={32} />
                                            <p>No stock currently in this warehouse.</p>
                                        </div>
                                    ) : (
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th>Product</th>
                                                    <th>SKU</th>
                                                    <th>Available</th>
                                                    <th>Reserved</th>
                                                    <th>Reorder Level</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {warehouse.stock.map(s => (
                                                    <tr key={s.warehouseStockId}>
                                                        <td className="product-cell">
                                                            {s.imageUrl ? (
                                                                <img src={`https://boms-9707.onrender.com${s.imageUrl}`} alt={s.productName} className="product-thumb" />
                                                            ) : (
                                                                <div className="product-thumb placeholder">
                                                                    <Package size={16} />
                                                                </div>
                                                            )}
                                                            <span>{s.productName}</span>
                                                        </td>
                                                        <td>{s.sku}</td>
                                                        <td><strong>{s.availableQuantity.toLocaleString()}</strong></td>
                                                        <td>{s.reservedQuantity.toLocaleString()}</td>
                                                        <td>{s.reorderLevel.toLocaleString()}</td>
                                                        <td>
                                                            <span className={`status-badge stock-${s.stockStatus.replace(/\s+/g, '-').toLowerCase()}`}>
                                                                {s.stockStatus}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            )}

                            {activeSection === 'transactions' && (
                                <div className="table-container">
                                    {transactions.length === 0 ? (
                                        <div className="empty-state">
                                            <Archive size={32} />
                                            <p>No inventory transactions found.</p>
                                        </div>
                                    ) : (
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th>TXN Code</th>
                                                    <th>Type</th>
                                                    <th>Product</th>
                                                    <th>Qty Change</th>
                                                    <th>New Qty</th>
                                                    <th>User</th>
                                                    <th>Date</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {transactions.map(t => (
                                                    <tr key={t.transactionId}>
                                                        <td><span className="code-badge">{t.transactionCode}</span></td>
                                                        <td>{t.transactionType}</td>
                                                        <td>{t.productName}</td>
                                                        <td style={{ color: t.quantity > 0 ? '#16a34a' : (t.quantity < 0 ? '#dc2626' : 'inherit'), fontWeight: 600 }}>
                                                            {t.quantity > 0 ? '+' : ''}{t.quantity}
                                                        </td>
                                                        <td>{t.newQuantity}</td>
                                                        <td>{t.creatorName}</td>
                                                        <td>{new Date(t.createdAt).toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            )}

                            {activeSection === 'activity' && (
                                <div className="timeline">
                                    {activities.length === 0 ? (
                                        <p className="text-slate-500">No activity recorded yet.</p>
                                    ) : (
                                        activities.map(act => (
                                            <div key={act.activityId} className="timeline-item">
                                                <div className="timeline-content">
                                                    <div className="timeline-header">
                                                        <span className="timeline-action">{act.userName}</span>
                                                        <span className="timeline-time">{new Date(act.timestamp).toLocaleString()}</span>
                                                    </div>
                                                    <div className="timeline-desc">{act.description}</div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                    </div>
                </div>
        </SharedDrawer>
    );
};

export default WarehouseDetailDrawer;
