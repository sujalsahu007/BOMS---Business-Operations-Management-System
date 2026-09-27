import React, { useState, useEffect } from 'react';
import { 
    FileText, Package, Gift, Download, Filter, Search,
    BarChart3, PieChart as PieChartIcon, TrendingUp, AlertTriangle, 
    CheckCircle2, Clock, Users, Database, LayoutDashboard
} from 'lucide-react';
import { 
    AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend, BarChart, Bar
} from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { contractApi } from '../services/contractApi';
import { inventoryDashboardApi } from '../services/api';
import { loyaltyDashboardApi } from '../services/loyaltyDashboardApi';
import './ReportsPage.css';

const COLORS = {
    primary: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    purple: '#8b5cf6',
    muted: '#64748b'
};

const ReportsPage = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterDate, setFilterDate] = useState('30 Days');
    const [filterModule, setFilterModule] = useState('All');
    const [isExporting, setIsExporting] = useState(false);
    
    // Data states
    const [contracts, setContracts] = useState(null);
    const [inventory, setInventory] = useState(null);
    const [loyalty, setLoyalty] = useState(null);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [cData, iData, lData] = await Promise.allSettled([
                contractApi.getDashboard(),
                inventoryDashboardApi.get(),
                loyaltyDashboardApi.getSummary()
            ]);

            if (cData.status === 'fulfilled') setContracts(cData.value);
            if (iData.status === 'fulfilled') setInventory(iData.value.data || iData.value);
            if (lData.status === 'fulfilled') setLoyalty(lData.value.data || lData.value);
            
        } catch (err) {
            console.error("Failed to load reports data:", err);
            setError("Failed to load cross-module data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [filterDate]); // reload on filter change simulation

    if (loading) {
        return (
            <div className="reports-page skeleton-loader">
                <div className="skeleton-header"></div>
                <div className="skeleton-kpis">
                    {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skel-box"></div>)}
                </div>
                <div className="skeleton-main"></div>
            </div>
        );
    }

    if (error && !contracts && !inventory && !loyalty) {
        return (
            <div className="reports-page flex-center h-full text-center">
                <AlertTriangle size={48} className="text-error mb-4" />
                <h2 className="text-xl font-bold">Error Loading Reports</h2>
                <p className="text-muted">{error}</p>
                <button className="rp-btn rp-btn-primary mt-4" onClick={loadData}>Retry</button>
            </div>
        );
    }

    // Safely extract Data
    const cKpis = contracts?.kpis || {};
    const iData = inventory || {};
    const lKpis = loyalty?.kpis || {};

    // For charts
    const contractStatusData = contracts?.statusDistribution ? 
        Object.entries(contracts.statusDistribution).map(([name, value]) => ({ name, value })).filter(d => d.value > 0) : [];
    
    const inventoryHealth = [
        { name: 'In Stock', value: iData.inStockItems || 0, color: COLORS.success },
        { name: 'Low Stock', value: iData.lowStockCount || 0, color: COLORS.warning },
        { name: 'Out of Stock', value: iData.outOfStockCount || 0, color: COLORS.error }
    ].filter(d => d.value > 0);

    const loyaltyProgData = loyalty?.programPerformance ? 
        loyalty.programPerformance.slice(0, 4).map(p => ({
            name: p.programName || p.ProgramName,
            members: p.membersCount || p.MembersCount || 0,
            earned: p.pointsEarned || p.PointsEarned || 0,
            redeemed: p.pointsRedeemed || p.PointsRedeemed || 0
        })) : [];

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="rp-tooltip">
                    <p className="rp-tt-label">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} className="rp-tt-item" style={{ color: entry.color || entry.payload.color || COLORS.primary }}>
                            <span>{entry.name}:</span>
                            <span className="rp-tt-val">{entry.value.toLocaleString()}</span>
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    // Export handler
    const handleExport = async () => {
        setIsExporting(true);
        // Wait for React to re-render and for Recharts SVGs to settle
        await new Promise(resolve => setTimeout(resolve, 800));
        
        try {
            const element = document.getElementById('reports-content-area');
            if (!element) return;
            
            // Temporarily adjust for capture
            const originalHeight = element.style.height;
            const originalOverflow = element.style.overflow;
            const originalPadding = element.style.padding;
            
            element.style.height = 'max-content';
            element.style.overflow = 'visible';
            element.style.padding = '32px'; // Even padding for PDF

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#0f172a',
                windowWidth: element.scrollWidth,
                windowHeight: element.scrollHeight,
                logging: false
            });

            // Restore original styles
            element.style.height = originalHeight;
            element.style.overflow = originalOverflow;
            element.style.padding = originalPadding;

            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            
            // Create PDF with points (pt) to match standard web CSS pixels better
            // Standard A4 width is ~595.28 pt
            const pdfWidth = 595.28; 
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            // Create a custom page size exactly fitting the dashboard height
            const pdf = new jsPDF('p', 'pt', [pdfWidth, pdfHeight]);
            
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`BOMS_Analytics_${filterModule}_${new Date().toISOString().split('T')[0]}.pdf`);

        } catch (err) {
            console.error("Export failed:", err);
            alert("Failed to generate PDF report.");
        } finally {
            setIsExporting(false);
        }
    };

    // Insights Generation
    const insights = [];
    if (cKpis.pendingApproval > 0) insights.push({ type: 'warning', text: `${cKpis.pendingApproval} contracts pending approval.` });
    if (cKpis.expiringSoon > 0) insights.push({ type: 'error', text: `${cKpis.expiringSoon} contracts expiring soon.` });
    if (iData.outOfStockCount > 0) insights.push({ type: 'error', text: `${iData.outOfStockCount} products are out of stock.` });
    if (iData.lowStockCount > 0) insights.push({ type: 'warning', text: `${iData.lowStockCount} products are below reorder level.` });
    if (lKpis.activeMembers > 0 && loyalty?.tierDistribution?.length === 0) insights.push({ type: 'info', text: `Loyalty members active but no tiers configured.` });
    
    if (insights.length === 0) insights.push({ type: 'success', text: 'Everything is on track. No critical issues.' });

    return (
        <div className={`reports-page ${isExporting ? 'export-mode' : ''}`} id="reports-content-area">
            
            {/* 1. HEADER */}
            <div className="rp-header">
                <div className="rp-header-left">
                    <h1>Reports & Analytics</h1>
                    <p>Business performance across contracts, inventory and customer loyalty.</p>
                </div>
                <div className="rp-header-right rp-hide-on-export">
                    <button className="rp-btn rp-btn-outline" onClick={handleExport} disabled={isExporting}>
                        {isExporting ? <Clock className="animate-spin" size={16} /> : <Download size={16} />} 
                        {isExporting ? 'Generating...' : 'Export Report'}
                    </button>
                </div>
            </div>

            {/* 2. FILTER BAR */}
            <div className="rp-filter-bar rp-hide-on-export">
                <div className="rp-filter-group">
                    <Filter size={16} className="text-muted" />
                    <select value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="rp-select">
                        <option>Today</option>
                        <option>7 Days</option>
                        <option>30 Days</option>
                        <option>90 Days</option>
                        <option>This Year</option>
                    </select>
                    <select value={filterModule} onChange={(e) => setFilterModule(e.target.value)} className="rp-select">
                        <option>All Modules</option>
                        <option>Contracts</option>
                        <option>Inventory</option>
                        <option>Customer Loyalty</option>
                    </select>
                </div>
                <div className="rp-filter-group">
                    <button className="rp-btn rp-btn-outline" onClick={loadData}>Refresh</button>
                    <button className="rp-btn rp-btn-primary">Apply</button>
                </div>
            </div>

            {/* 3. EXECUTIVE KPI STRIP */}
            {(filterModule === 'All' || filterModule === 'Contracts') && (
                <div className="rp-kpi-strip">
                    <div className="rp-kpi-card">
                        <div className="rp-kpi-icon text-blue bg-blue-dim"><FileText size={20}/></div>
                        <div className="rp-kpi-content">
                            <div className="rp-kpi-val">{cKpis.totalContracts || 0}</div>
                            <div className="rp-kpi-lbl">Total Contracts</div>
                            <div className="rp-kpi-desc">Across all statuses</div>
                        </div>
                    </div>
                    <div className="rp-kpi-card">
                        <div className="rp-kpi-icon text-success bg-success-dim"><CheckCircle2 size={20}/></div>
                        <div className="rp-kpi-content">
                            <div className="rp-kpi-val">{cKpis.activeContracts || 0}</div>
                            <div className="rp-kpi-lbl">Active Contracts</div>
                            <div className="rp-kpi-desc">Currently in effect</div>
                        </div>
                    </div>
                    <div className="rp-kpi-card">
                        <div className="rp-kpi-icon text-purple bg-purple-dim"><Package size={20}/></div>
                        <div className="rp-kpi-content">
                            <div className="rp-kpi-val">{iData.totalProducts || 0}</div>
                            <div className="rp-kpi-lbl">Inventory Items</div>
                            <div className="rp-kpi-desc">Unique products tracked</div>
                        </div>
                    </div>
                    <div className="rp-kpi-card">
                        <div className="rp-kpi-icon text-warning bg-warning-dim"><AlertTriangle size={20}/></div>
                        <div className="rp-kpi-content">
                            <div className="rp-kpi-val">{iData.lowStockCount || 0}</div>
                            <div className="rp-kpi-lbl">Low Stock Items</div>
                            <div className="rp-kpi-desc">Below reorder levels</div>
                        </div>
                    </div>
                    <div className="rp-kpi-card">
                        <div className="rp-kpi-icon text-blue bg-blue-dim"><Users size={20}/></div>
                        <div className="rp-kpi-content">
                            <div className="rp-kpi-val">{lKpis.activeMembers || 0}</div>
                            <div className="rp-kpi-lbl">Loyalty Members</div>
                            <div className="rp-kpi-desc">Active enrolled members</div>
                        </div>
                    </div>
                    <div className="rp-kpi-card">
                        <div className="rp-kpi-icon text-success bg-success-dim"><Gift size={20}/></div>
                        <div className="rp-kpi-content">
                            <div className="rp-kpi-val">{(lKpis.pointsEarnedAllTime || 0).toLocaleString()}</div>
                            <div className="rp-kpi-lbl">Points Earned</div>
                            <div className="rp-kpi-desc">Lifetime loyalty points</div>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. BUSINESS OVERVIEW */}
            {filterModule === 'All' && (
                <div className="rp-grid-main">
                    {/* LEFT */}
                    <div className="rp-panel" style={{ flex: 1.5 }}>
                        <div className="rp-panel-header">
                            <h2><TrendingUp size={18}/> Business Overview</h2>
                        </div>
                        <div className="rp-panel-body">
                            {/* Since cross-module time series might not align perfectly on demo data, we plot loyalty points activity as primary pulse if available, else a placeholder chart structure */}
                            {loyalty?.pointsActivity && loyalty.pointsActivity.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={loyalty.pointsActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                        <XAxis dataKey="dateLabel" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                                        <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area type="monotone" dataKey="earned" name="Business Activity (Earned Points)" stroke={COLORS.primary} strokeWidth={2} fillOpacity={0.15} fill={COLORS.primary} isAnimationActive={false} />
                                        <Area type="monotone" dataKey="redeemed" name="Business Activity (Redeemed Points)" stroke={COLORS.warning} strokeWidth={2} fillOpacity={0.15} fill={COLORS.warning} isAnimationActive={false} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="rp-empty h-full flex-center text-muted">No trend data available for selected period.</div>
                            )}
                        </div>
                    </div>
                    {/* RIGHT */}
                    <div className="rp-panel" style={{ flex: 1 }}>
                        <div className="rp-panel-header">
                            <h2><LayoutDashboard size={18}/> Module Summary</h2>
                        </div>
                        <div className="rp-panel-body" style={{ padding: '0' }}>
                            <div className="rp-summary-block">
                                <h3>Contracts</h3>
                                <div className="rp-sb-metrics">
                                    <div className="rp-sb-metric"><span>Total</span><strong>{cKpis.totalContracts || 0}</strong></div>
                                    <div className="rp-sb-metric"><span>Active</span><strong>{cKpis.activeContracts || 0}</strong></div>
                                    <div className="rp-sb-metric"><span>Pending</span><strong className="text-warning">{cKpis.pendingApproval || 0}</strong></div>
                                    <div className="rp-sb-metric"><span>Expiring</span><strong className="text-error">{cKpis.expiringSoon || 0}</strong></div>
                                </div>
                            </div>
                            <div className="rp-summary-block">
                                <h3>Inventory</h3>
                                <div className="rp-sb-metrics">
                                    <div className="rp-sb-metric"><span>Products</span><strong>{iData.totalProducts || 0}</strong></div>
                                    <div className="rp-sb-metric"><span>In Stock</span><strong>{iData.inStockItems || 0}</strong></div>
                                    <div className="rp-sb-metric"><span>Low</span><strong className="text-warning">{iData.lowStockCount || 0}</strong></div>
                                    <div className="rp-sb-metric"><span>Out</span><strong className="text-error">{iData.outOfStockCount || 0}</strong></div>
                                </div>
                            </div>
                            <div className="rp-summary-block" style={{ borderBottom: 'none' }}>
                                <h3>Customer Loyalty</h3>
                                <div className="rp-sb-metrics">
                                    <div className="rp-sb-metric"><span>Programs</span><strong>{lKpis.activePrograms || 0}</strong></div>
                                    <div className="rp-sb-metric"><span>Members</span><strong>{lKpis.activeMembers || 0}</strong></div>
                                    <div className="rp-sb-metric"><span>Earned</span><strong className="text-success">{(lKpis.pointsEarnedAllTime || 0).toLocaleString()}</strong></div>
                                    <div className="rp-sb-metric"><span>Redeemed</span><strong className="text-amber">{(lKpis.pointsRedeemedAllTime || 0).toLocaleString()}</strong></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 5. CONTRACT ANALYTICS */}
            {(filterModule === 'All' || filterModule === 'Contracts') && (
                <div className="rp-section">
                    <h2 className="rp-section-title">Contract Analytics</h2>
                    <div className="rp-grid-3">
                        <div className="rp-panel">
                            <div className="rp-panel-header"><h3>Status Distribution</h3></div>
                            <div className="rp-panel-body flex-center" style={{ height: '240px' }}>
                                {contractStatusData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={contractStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none" isAnimationActive={false}>
                                                {contractStatusData.map((e, i) => <Cell key={i} fill={Object.values(COLORS)[i % 5]} />)}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : <div className="rp-empty text-muted">No contract statuses</div>}
                            </div>
                        </div>
                        <div className="rp-panel" style={{ gridColumn: 'span 2' }}>
                            <div className="rp-panel-header"><h3>Expiry Timeline</h3></div>
                            <div className="rp-panel-body" style={{ padding: '24px' }}>
                                <div className="rp-expiry-bars">
                                    <div className="rp-eb-row">
                                        <div className="rp-eb-lbl">Expired</div>
                                        <div className="rp-eb-track"><div className="rp-eb-fill bg-error" style={{ width: `${Math.min(100, (contracts?.expiryOverview?.expired || 0)*10)}%`}}></div></div>
                                        <div className="rp-eb-val">{contracts?.expiryOverview?.expired || 0}</div>
                                    </div>
                                    <div className="rp-eb-row">
                                        <div className="rp-eb-lbl">Next 30 Days</div>
                                        <div className="rp-eb-track"><div className="rp-eb-fill bg-warning" style={{ width: `${Math.min(100, (contracts?.expiryOverview?.expiring30Days || 0)*10)}%`}}></div></div>
                                        <div className="rp-eb-val">{contracts?.expiryOverview?.expiring30Days || 0}</div>
                                    </div>
                                    <div className="rp-eb-row">
                                        <div className="rp-eb-lbl">Next 60 Days</div>
                                        <div className="rp-eb-track"><div className="rp-eb-fill bg-info" style={{ width: `${Math.min(100, (contracts?.expiryOverview?.expiring60Days || 0)*10)}%`}}></div></div>
                                        <div className="rp-eb-val">{contracts?.expiryOverview?.expiring60Days || 0}</div>
                                    </div>
                                    <div className="rp-eb-row">
                                        <div className="rp-eb-lbl">Next 90 Days</div>
                                        <div className="rp-eb-track"><div className="rp-eb-fill bg-primary" style={{ width: `${Math.min(100, (contracts?.expiryOverview?.expiring90Days || 0)*10)}%`}}></div></div>
                                        <div className="rp-eb-val">{contracts?.expiryOverview?.expiring90Days || 0}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 6. INVENTORY ANALYTICS */}
            {(filterModule === 'All' || filterModule === 'Inventory') && (
                <div className="rp-section">
                    <h2 className="rp-section-title">Inventory Analytics</h2>
                    <div className="rp-grid-main">
                        <div className="rp-panel" style={{ flex: 1 }}>
                            <div className="rp-panel-header"><h3>Stock Health</h3></div>
                            <div className="rp-panel-body" style={{ paddingBottom: '32px' }}>
                                {inventoryHealth.length > 0 ? (
                                    <>
                                        <div className="rp-flex-center" style={{ height: '180px' }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie data={inventoryHealth} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={2} dataKey="value" stroke="none" isAnimationActive={false}>
                                                        {inventoryHealth.map((e, i) => <Cell key={i} fill={e.color} />)}
                                                    </Pie>
                                                    <Tooltip content={<CustomTooltip />} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="rp-legend-compact">
                                            {inventoryHealth.map(h => (
                                                <div key={h.name} className="rp-lc-item">
                                                    <div className="rp-lc-dot" style={{ background: h.color }}></div>
                                                    <span className="rp-lc-name">{h.name}</span>
                                                    <span className="rp-lc-val">{h.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : <div className="rp-empty text-muted">No stock data</div>}
                            </div>
                        </div>
                        <div className="rp-panel" style={{ flex: 1.5 }}>
                            <div className="rp-panel-header"><h3>Low Stock Items</h3></div>
                            <div className="rp-panel-body" style={{ padding: 0 }}>
                                {iData.lowStockItems && iData.lowStockItems.length > 0 ? (
                                    <div className="rp-list">
                                        {iData.lowStockItems.slice(0, 4).map((item, idx) => (
                                            <div key={idx} className="rp-list-item">
                                                <div className="rp-li-main">
                                                    <div className="rp-li-title">{item.productName}</div>
                                                    <div className="rp-li-sub">{item.warehouseName || 'Multiple'}</div>
                                                </div>
                                                <div className="rp-li-stats">
                                                    <div className="rp-li-stat">
                                                        <span className="text-muted">Stock</span>
                                                        <strong className="text-warning">{item.availableQuantity}</strong>
                                                    </div>
                                                    <div className="rp-li-stat">
                                                        <span className="text-muted">Reorder</span>
                                                        <strong>{item.reorderLevel}</strong>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : <div className="rp-empty text-muted p-6 text-center">No low stock items.</div>}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 7. LOYALTY ANALYTICS */}
            {(filterModule === 'All' || filterModule === 'Customer Loyalty') && (
                <div className="rp-section">
                    <h2 className="rp-section-title">Loyalty Analytics</h2>
                    <div className="rp-grid-main">
                        <div className="rp-panel" style={{ flex: 1.5 }}>
                            <div className="rp-panel-header"><h3>Top Programs Performance</h3></div>
                            <div className="rp-panel-body">
                                {loyaltyProgData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={250}>
                                        <BarChart data={loyaltyProgData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-color)" />
                                            <XAxis type="number" stroke="var(--text-muted)" fontSize={11} axisLine={false} tickLine={false} />
                                            <YAxis dataKey="name" type="category" stroke="var(--text-main)" fontSize={12} width={120} axisLine={false} tickLine={false} />
                                            <Tooltip cursor={{fill: 'var(--overlay-bg)'}} content={<CustomTooltip />} />
                                            <Legend wrapperStyle={{ fontSize: '12px' }} />
                                            <Bar dataKey="earned" name="Points Earned" fill={COLORS.success} radius={[0, 4, 4, 0]} barSize={12} isAnimationActive={false} />
                                            <Bar dataKey="redeemed" name="Points Redeemed" fill={COLORS.warning} radius={[0, 4, 4, 0]} barSize={12} isAnimationActive={false} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : <div className="rp-empty text-muted flex-center h-full">No program data</div>}
                            </div>
                        </div>
                        <div className="rp-panel" style={{ flex: 1 }}>
                            <div className="rp-panel-header"><h3>Member Distribution</h3></div>
                            <div className="rp-panel-body flex-center flex-col" style={{ paddingBottom: '32px' }}>
                                {loyalty?.membershipOverview ? (
                                    <>
                                        <div className="rp-flex-center" style={{ height: '180px', width: '100%' }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie data={[
                                                        { name: 'Active', value: loyalty.membershipOverview.activeMembers || 0 },
                                                        { name: 'Inactive', value: loyalty.membershipOverview.inactiveMembers || 0 }
                                                    ]} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={2} dataKey="value" stroke="none" isAnimationActive={false}>
                                                        <Cell fill={COLORS.success} />
                                                        <Cell fill={COLORS.muted} />
                                                    </Pie>
                                                    <Tooltip content={<CustomTooltip />} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="rp-legend-compact">
                                            <div className="rp-lc-item">
                                                <div className="rp-lc-dot" style={{ background: COLORS.success }}></div>
                                                <span className="rp-lc-name">Active</span>
                                                <span className="rp-lc-val">{loyalty.membershipOverview.activeMembers || 0}</span>
                                            </div>
                                            <div className="rp-lc-item">
                                                <div className="rp-lc-dot" style={{ background: COLORS.muted }}></div>
                                                <span className="rp-lc-name">Inactive</span>
                                                <span className="rp-lc-val">{loyalty.membershipOverview.inactiveMembers || 0}</span>
                                            </div>
                                        </div>
                                    </>
                                ) : <div className="rp-empty text-muted">No member data</div>}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 8. KEY INSIGHTS & QUICK REPORTS */}
            {filterModule === 'All' && (
                <div className="rp-grid-main mt-6">
                    <div className="rp-panel" style={{ flex: 1 }}>
                        <div className="rp-panel-header">
                            <h2>Key Insights</h2>
                        </div>
                        <div className="rp-panel-body" style={{ padding: 0 }}>
                            <div className="rp-insights-list">
                                {insights.map((insight, idx) => (
                                    <div key={idx} className={`rp-insight-item type-${insight.type}`}>
                                        <div className="rp-ii-icon">
                                            {insight.type === 'error' && <AlertTriangle size={16} />}
                                            {insight.type === 'warning' && <AlertTriangle size={16} />}
                                            {insight.type === 'success' && <CheckCircle2 size={16} />}
                                            {insight.type === 'info' && <Database size={16} />}
                                        </div>
                                        <div className="rp-ii-text">{insight.text}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    <div className="rp-panel rp-hide-on-export" style={{ flex: 1.5 }}>
                        <div className="rp-panel-header">
                            <h2>Quick Reports</h2>
                        </div>
                        <div className="rp-panel-body">
                            <div className="rp-quick-reports">
                                <div className="rp-qr-card" onClick={handleExport}>
                                    <div className="rp-qr-icon text-blue"><FileText size={20}/></div>
                                    <div className="rp-qr-info">
                                        <h4>Contract Status Report</h4>
                                        <p>Full breakdown of active & pending</p>
                                    </div>
                                </div>
                                <div className="rp-qr-card" onClick={handleExport}>
                                    <div className="rp-qr-icon text-error"><Clock size={20}/></div>
                                    <div className="rp-qr-info">
                                        <h4>Expiry Risk Report</h4>
                                        <p>Contracts expiring in 90 days</p>
                                    </div>
                                </div>
                                <div className="rp-qr-card" onClick={handleExport}>
                                    <div className="rp-qr-icon text-purple"><Package size={20}/></div>
                                    <div className="rp-qr-info">
                                        <h4>Inventory Stock Levels</h4>
                                        <p>Current snapshot of all products</p>
                                    </div>
                                </div>
                                <div className="rp-qr-card" onClick={handleExport}>
                                    <div className="rp-qr-icon text-warning"><AlertTriangle size={20}/></div>
                                    <div className="rp-qr-info">
                                        <h4>Low Stock Replenishment</h4>
                                        <p>Items below reorder thresholds</p>
                                    </div>
                                </div>
                                <div className="rp-qr-card" onClick={handleExport}>
                                    <div className="rp-qr-icon text-success"><Users size={20}/></div>
                                    <div className="rp-qr-info">
                                        <h4>Loyalty Member Activity</h4>
                                        <p>Enrollments and point transactions</p>
                                    </div>
                                </div>
                                <div className="rp-qr-card" onClick={handleExport}>
                                    <div className="rp-qr-icon text-amber"><Gift size={20}/></div>
                                    <div className="rp-qr-info">
                                        <h4>Program Performance</h4>
                                        <p>ROI and engagement by program</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default ReportsPage;
