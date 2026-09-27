import React, { useState, useEffect } from 'react';
import { 
    Package, Warehouse, Layers, AlertTriangle, XOctagon, 
    ShoppingCart, FileInput, Activity, AlertCircle, RefreshCw, 
    Plus, History, BarChart3, TrendingDown, ArrowUpRight, ArrowDownRight, Clock, Box
} from 'lucide-react';
import { inventoryDashboardApi, warehousesApi } from '../../services/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import './InventoryDashboardTab.css';

const InventoryDashboardTab = ({ onNavigate = () => {} }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadDashboard = async () => {
        setLoading(true);
        setError(null);
        try {
            const [dashRes, whRes] = await Promise.all([
                inventoryDashboardApi.get(),
                warehousesApi.getAll({ page: 1, pageSize: 10 })
            ]);
            setData({
                ...dashRes.data,
                warehouses: Array.isArray(whRes.data) ? whRes.data : (whRes.data?.items || whRes.data?.Items || [])
            });
        } catch (err) {
            console.error("Dashboard load error:", err);
            setError("Unable to load inventory dashboard.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboard();
    }, []);

    if (error) {
        return (
            <div className="cd-flex cd-flex-col cd-items-center cd-justify-center cd-h-full cd-w-full cd-p-6">
                <AlertCircle size={48} style={{ color: 'var(--error-color)', marginBottom: '16px' }} />
                <h3 className="cd-text-xl cd-font-bold cd-text-main cd-mb-4">{error}</h3>
                <button className="cd-btn cd-btn-primary" onClick={loadDashboard}>
                    <RefreshCw size={16} /> Retry
                </button>
            </div>
        );
    }

    if (loading || !data) {
        return (
            <div className="inventory-dashboard-container cd-p-6">
                <div className="dashboard-kpi-strip cd-mb-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="premium-kpi-card" style={{ opacity: 0.5 }}>
                            <div className="kpi-icon-container" style={{ background: 'var(--overlay-bg)' }}></div>
                            <div className="kpi-info cd-flex-col cd-gap-2">
                                <div style={{ height: '12px', width: '60%', background: 'var(--overlay-bg)', borderRadius: '4px' }}></div>
                                <div style={{ height: '24px', width: '40%', background: 'var(--overlay-bg)', borderRadius: '4px' }}></div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="cd-grid-2">
                    <div className="dashboard-panel" style={{ height: '300px', opacity: 0.5, background: 'var(--surface-color)' }}></div>
                    <div className="dashboard-panel" style={{ height: '300px', opacity: 0.5, background: 'var(--surface-color)' }}></div>
                </div>
            </div>
        );
    }

    const {
        totalProducts = 0,
        totalWarehouses = 0,
        totalStockQuantity = 0,
        lowStockCount = 0,
        outOfStockCount = 0,
        pendingPurchaseOrders = 0,
        pendingGoodsReceipts = 0,
        inStockItems = 0,
        lowStockItems = [],
        outOfStockItems = [],
        recentTransactions = [],
        warehouses = []
    } = data;

    const COLORS = ['#10b981', '#f59e0b', '#ef4444'];
    const stockHealthData = [
        { name: 'Healthy', value: inStockItems },
        { name: 'Low Stock', value: lowStockCount },
        { name: 'Out of Stock', value: outOfStockCount }
    ].filter(item => item.value > 0);

    const totalItemsForHealth = inStockItems + lowStockCount + outOfStockCount;
    const healthyPercent = totalItemsForHealth ? Math.round((inStockItems / totalItemsForHealth) * 100) : 0;
    const lowPercent = totalItemsForHealth ? Math.round((lowStockCount / totalItemsForHealth) * 100) : 0;
    const outPercent = totalItemsForHealth ? Math.round((outOfStockCount / totalItemsForHealth) * 100) : 0;

    return (
        <div className="inventory-dashboard-container cd-p-6">
            
            {/* 1. HEADER */}
            <div className="panel-header cd-mb-6 cd-flex-row cd-items-center cd-justify-between" style={{ padding: '0', background: 'transparent', border: 'none' }}>
                <div>
                    <h2 className="cd-text-2xl cd-font-bold cd-text-main">Inventory Dashboard</h2>
                    <p className="cd-text-sm cd-text-muted">Overview of stock levels, availability and inventory activity.</p>
                </div>
                <div className="cd-flex cd-gap-3">
                    <button className="cd-btn cd-btn-secondary" onClick={() => onNavigate('stock-operations')}>
                        <RefreshCw size={16} /> Stock Adjustment
                    </button>
                    <button className="cd-btn cd-btn-secondary" onClick={() => onNavigate('warehouses')}>
                        <Warehouse size={16} /> Warehouses
                    </button>
                    <button className="cd-btn cd-btn-secondary" onClick={() => onNavigate('purchase-orders')}>
                        <ShoppingCart size={16} /> Purchase Orders
                    </button>
                    <button className="cd-btn cd-btn-primary" onClick={() => onNavigate('products', { action: 'new' })}>
                        <Plus size={16} /> Add Product
                    </button>
                </div>
            </div>

            {/* 2. KPI ROW */}
            <div className="dashboard-kpi-strip cd-mb-6">
                <div className="premium-kpi-card clickable" onClick={() => onNavigate('products')}>
                    <div className="kpi-icon-glow" style={{ color: 'var(--primary-color)' }}>
                        <Package size={26} />
                    </div>
                    <div className="kpi-content">
                        <div className="kpi-title">Total Products</div>
                        <div className="kpi-value">{totalProducts}</div>
                    </div>
                </div>
                <div className="premium-kpi-card clickable" onClick={() => onNavigate('products')}>
                    <div className="kpi-icon-glow" style={{ color: 'var(--info-color)' }}>
                        <Layers size={26} />
                    </div>
                    <div className="kpi-content">
                        <div className="kpi-title">Total Stock</div>
                        <div className="kpi-value">{totalStockQuantity.toLocaleString()}</div>
                    </div>
                </div>
                <div className="premium-kpi-card clickable" onClick={() => onNavigate('products')}>
                    <div className="kpi-icon-glow" style={{ color: 'var(--warning-color)' }}>
                        <AlertTriangle size={26} />
                    </div>
                    <div className="kpi-content">
                        <div className="kpi-title">Low Stock Items</div>
                        <div className="kpi-value">{lowStockCount}</div>
                    </div>
                </div>
                <div className="premium-kpi-card clickable" onClick={() => onNavigate('products')}>
                    <div className="kpi-icon-glow" style={{ color: 'var(--error-color)' }}>
                        <XOctagon size={26} />
                    </div>
                    <div className="kpi-content">
                        <div className="kpi-title">Out of Stock</div>
                        <div className="kpi-value">{outOfStockCount}</div>
                    </div>
                </div>
            </div>

            {/* 3. STOCK HEALTH & OVERVIEW */}
            <div className="cd-grid-2 cd-mb-6">
                <div className="dashboard-panel">
                    <div className="panel-header">
                        <h3 className="panel-title"><Activity size={18} /> Stock Health</h3>
                    </div>
                    <div className="panel-content cd-flex cd-flex-row cd-items-center cd-justify-between cd-px-4" style={{ height: '220px' }}>
                        {stockHealthData.length > 0 ? (
                            <>
                                <div style={{ position: 'relative', height: '180px', width: '180px', flexShrink: 0 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={stockHealthData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none">
                                                {stockHealthData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ background: 'var(--surface-highlight)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', padding: '8px 12px' }} itemStyle={{ color: 'var(--text-main)', fontSize: '14px', fontWeight: 'bold' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                                        <div className="cd-text-xs cd-font-bold cd-text-muted" style={{ letterSpacing: '0.05em' }}>TOTAL</div>
                                        <div className="cd-text-xl cd-font-bold cd-text-main" style={{ lineHeight: '1' }}>{totalItemsForHealth}</div>
                                    </div>
                                </div>
                                <div style={{ flex: 1, minWidth: '160px', paddingLeft: '24px' }}>
                                    {stockHealthData.map((entry, index) => {
                                        const percent = totalItemsForHealth ? Math.round((entry.value / totalItemsForHealth) * 100) : 0;
                                        return (
                                            <div key={entry.name} className="cd-flex cd-items-center cd-justify-between cd-gap-4 cd-mb-3">
                                                <div className="cd-flex cd-items-center cd-gap-2">
                                                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: COLORS[index], boxShadow: `0 0 8px ${COLORS[index]}` }}></div>
                                                    <span className="cd-text-sm cd-font-semibold">{entry.name}</span>
                                                </div>
                                                <div className="cd-flex cd-items-center cd-gap-2">
                                                    <span className="cd-text-sm font-mono cd-font-bold">{entry.value}</span>
                                                    <span className="cd-text-xs cd-text-muted font-mono">({percent}%)</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        ) : (
                            <div className="dashboard-empty cd-w-full cd-h-full">
                                <Box size={32} style={{ color: 'var(--text-muted)', opacity: 0.5, marginBottom: '12px' }} />
                                <h4 className="cd-text-main">No Stock Data</h4>
                            </div>
                        )}
                    </div>
                </div>

                <div className="dashboard-panel">
                    <div className="panel-header">
                        <h3 className="panel-title"><BarChart3 size={18} /> Product Availability</h3>
                    </div>
                    <div className="panel-content cd-flex cd-flex-col cd-justify-center cd-gap-4 cd-px-4 cd-h-full">
                        {[
                            { label: 'Products with Stock', value: inStockItems, percent: healthyPercent, color: 'var(--success-color)' },
                            { label: 'Low Stock', value: lowStockCount, percent: lowPercent, color: 'var(--warning-color)' },
                            { label: 'Out of Stock', value: outOfStockCount, percent: outPercent, color: 'var(--error-color)' }
                        ].map((item, idx) => (
                            <div key={idx} className="cd-w-full">
                                <div className="cd-flex cd-justify-between cd-items-end cd-mb-1">
                                    <span className="cd-text-sm cd-font-semibold">{item.label}</span>
                                    <div className="cd-flex cd-items-baseline cd-gap-2">
                                        <span className="cd-font-bold">{item.value}</span>
                                        <span className="cd-text-xs cd-text-muted font-mono">{item.percent}%</span>
                                    </div>
                                </div>
                                <div className="progress-bar-bg">
                                    <div className="progress-bar-fill" style={{ width: `${item.percent}%`, backgroundColor: item.color }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 4. STOCK RISK & WAREHOUSE DISTRIBUTION */}
            <div className="cd-grid-2 cd-mb-6">
                <div className="dashboard-panel">
                    <div className="panel-header">
                        <h3 className="panel-title"><AlertTriangle size={18} /> Stock Risk</h3>
                        <button className="view-all-btn" onClick={() => onNavigate('products')}>View All</button>
                    </div>
                    <div className="panel-content" style={{ padding: '16px', maxHeight: '280px', overflowY: 'auto' }}>
                        {lowStockItems.length === 0 && outOfStockItems.length === 0 ? (
                            <div className="cd-w-full cd-h-full cd-flex cd-flex-col cd-items-center cd-justify-center cd-p-6">
                                <Activity size={32} style={{ color: 'var(--success-color)', opacity: 0.5, marginBottom: '12px' }} />
                                <h4 className="cd-text-success cd-font-bold cd-mb-1">All Stock Healthy</h4>
                                <p className="cd-text-xs cd-text-muted">No critical inventory risks detected.</p>
                            </div>
                        ) : (
                            <div className="cd-flex cd-flex-col cd-gap-2">
                                {outOfStockItems.slice(0, 3).map((item, idx) => (
                                    <div key={`out-${idx}`} className="risk-card" style={{ borderLeft: '4px solid var(--error-color)' }}>
                                        <div>
                                            <div className="cd-font-bold cd-text-sm">{item.productName}</div>
                                            <div className="cd-text-xs cd-text-muted">{item.warehouseName || 'Multiple Locations'}</div>
                                        </div>
                                        <div className="cd-text-right">
                                            <div className="cd-font-bold cd-text-error">0</div>
                                            <div className="cd-text-xs cd-text-muted">Out of Stock</div>
                                        </div>
                                    </div>
                                ))}
                                {lowStockItems.slice(0, 4).map((item, idx) => (
                                    <div key={`low-${idx}`} className="risk-card" style={{ borderLeft: '4px solid var(--warning-color)' }}>
                                        <div>
                                            <div className="cd-font-bold cd-text-sm">{item.productName}</div>
                                            <div className="cd-text-xs cd-text-muted">{item.warehouseName || 'Multiple Locations'}</div>
                                        </div>
                                        <div className="cd-text-right">
                                            <div className="cd-font-bold cd-text-warning">{item.availableQuantity} / {item.reorderLevel}</div>
                                            <div className="cd-text-xs cd-text-muted">Low Stock</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="dashboard-panel">
                    <div className="panel-header">
                        <h3 className="panel-title"><Warehouse size={18} /> Warehouse Distribution</h3>
                        <button className="view-all-btn" onClick={() => onNavigate('warehouses')}>Manage</button>
                    </div>
                    <div className="panel-content cd-flex cd-flex-col cd-justify-center cd-p-6">
                        {(!warehouses || warehouses.length === 0) ? (
                            <div className="cd-flex cd-flex-col cd-items-center cd-justify-center cd-w-full cd-h-full" style={{ padding: '32px' }}>
                                <Warehouse size={40} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: '16px' }} />
                                <h4 className="cd-text-main cd-font-bold cd-mb-1">Detailed Data Unavailable</h4>
                                <p className="cd-text-sm cd-text-muted cd-text-center">Aggregated warehouse distribution metrics are not currently provided by the API.</p>
                            </div>
                        ) : (
                            <div className="cd-w-full cd-flex cd-flex-col cd-gap-2">
                                {warehouses.sort((a, b) => b.totalAvailableUnits - a.totalAvailableUnits).slice(0, 4).map(w => {
                                    const percent = totalStockQuantity ? Math.round((w.totalAvailableUnits / totalStockQuantity) * 100) : 0;
                                    return (
                                        <div key={w.warehouseId} className="cd-w-full cd-mb-2">
                                            <div className="cd-flex cd-justify-between cd-items-end cd-mb-1">
                                                <span className="cd-text-sm cd-font-semibold">{w.warehouseName}</span>
                                                <div className="cd-flex cd-items-baseline cd-gap-2">
                                                    <span className="cd-font-bold">{w.totalAvailableUnits.toLocaleString()}</span>
                                                    <span className="cd-text-xs cd-text-muted font-mono">{percent}%</span>
                                                </div>
                                            </div>
                                            <div className="progress-bar-bg">
                                                <div className="progress-bar-fill" style={{ width: `${percent}%`, backgroundColor: 'var(--primary-color)' }}></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 5. RECENT INVENTORY ACTIVITY */}
            <div className="dashboard-panel">
                <div className="panel-header">
                    <h3 className="panel-title"><History size={18} /> Recent Inventory Activity</h3>
                    <button className="view-all-btn" onClick={() => onNavigate('stock-operations')}>View Full Log</button>
                </div>
                <div className="panel-content" style={{ padding: '0 24px 24px 24px' }}>
                    {recentTransactions.length === 0 ? (
                        <div className="dashboard-empty cd-py-6">
                            <Clock size={32} style={{ color: 'var(--text-muted)', opacity: 0.5, marginBottom: '12px' }} />
                            <h4 className="cd-text-main">No recent activity</h4>
                        </div>
                    ) : (
                        <div className="activity-timeline cd-mt-4">
                            {recentTransactions.slice(0, 5).map((trx, idx) => {
                                const isPos = !['TransferOut', 'AdjustmentDecrease', 'StockOut'].includes(trx.transactionType);
                                const isNeg = ['TransferOut', 'AdjustmentDecrease', 'StockOut'].includes(trx.transactionType);
                                
                                let icon = <Activity size={16} />;
                                let colorClass = 'cd-text-info';
                                let bgClass = 'rgba(59, 130, 246, 0.1)';

                                if (isPos) {
                                    icon = <ArrowDownRight size={16} />;
                                    colorClass = 'cd-text-success';
                                    bgClass = 'rgba(16, 185, 129, 0.1)';
                                } else if (isNeg) {
                                    icon = <ArrowUpRight size={16} />;
                                    colorClass = 'cd-text-error';
                                    bgClass = 'rgba(239, 68, 68, 0.1)';
                                }

                                return (
                                    <div key={idx} className="timeline-item">
                                        <div className="timeline-icon" style={{ color: `var(--${isPos ? 'success' : isNeg ? 'error' : 'info'}-color)`, background: bgClass }}>
                                            {icon}
                                        </div>
                                        <div className="timeline-content">
                                            <div>
                                                <div className="cd-font-bold cd-text-sm cd-mb-1">{trx.transactionType}</div>
                                                <div className="cd-text-xs cd-text-muted">
                                                    {trx.productName} <span style={{ margin: '0 4px' }}>•</span> {trx.warehouseName}
                                                </div>
                                            </div>
                                            <div className="cd-text-right">
                                                <div className={`cd-font-bold font-mono ${colorClass}`}>
                                                    {isPos ? '+' : isNeg ? '−' : ''}{trx.quantity}
                                                </div>
                                                <div className="cd-text-xs cd-text-muted">
                                                    {new Date(trx.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

export default InventoryDashboardTab;
