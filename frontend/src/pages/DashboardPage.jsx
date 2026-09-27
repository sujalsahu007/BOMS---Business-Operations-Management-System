import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Box, FileText, Users, Clock, AlertTriangle, 
    CheckCircle2, PackageX, Calendar, ArrowRight, ShieldAlert,
    TrendingUp, FileSignature, Award, Activity, 
    AlertCircle, AlertOctagon
} from 'lucide-react';
import { api, inventoryDashboardApi } from '../services/api';
import { contractApi } from '../services/contractApi';
import { loyaltyDashboardApi } from '../services/loyaltyDashboardApi';
import './DashboardPage.css';

const DashboardPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    
    const [globalData, setGlobalData] = useState(null);
    const [invData, setInvData] = useState(null);
    const [contractData, setContractData] = useState(null);
    const [loyaltyData, setLoyaltyData] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [lastUpdated, setLastUpdated] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const fetchAll = async () => {
        setLoading(true);
        setError(false);
        try {
            const [dashRes, invRes, conRes, loyRes] = await Promise.allSettled([
                api.get('/dashboard'),
                inventoryDashboardApi.get(),
                contractApi.getDashboard(),
                loyaltyDashboardApi.getSummary()
            ]);

            setGlobalData(dashRes.status === 'fulfilled' ? dashRes.value.data : null);
            setInvData(invRes.status === 'fulfilled' ? invRes.value.data : null);
            setContractData(conRes.status === 'fulfilled' ? conRes.value : null);
            setLoyaltyData(loyRes.status === 'fulfilled' ? loyRes.value.data : null);
            setLastUpdated(new Date());
        } catch (err) {
            console.error("Dashboard error:", err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, []);

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    const getUsername = () => {
        try {
            const token = localStorage.getItem('boms_token');
            if (token) {
                const payload = JSON.parse(atob(token.split('.')[1]));
                return payload.name || payload.unique_name || payload.given_name || 'Administrator';
            }
        } catch(e) {}
        return 'Administrator';
    };

    if (loading) {
        return (
            <div className="erp-dashboard">
                <div className="erp-header skeleton" style={{ height: '100px' }}></div>
                <div className="erp-kpi-row">
                    {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: '100px', borderRadius: '12px' }}></div>)}
                </div>
                <div className="skeleton" style={{ height: '200px', marginTop: '24px', borderRadius: '12px' }}></div>
            </div>
        );
    }

    if (error && !globalData && !invData) {
        return (
            <div className="erp-dashboard flex-center">
                <div className="erp-empty-state">
                    <AlertCircle size={48} className="text-error mb-4" />
                    <h2>Unable to load command center</h2>
                    <p>The server is currently unreachable.</p>
                    <button className="erp-btn primary mt-4" onClick={fetchAll}>Retry Connection</button>
                </div>
            </div>
        );
    }

    // Safely extract metrics
    const totalProducts = invData?.totalProducts || 0;
    const totalContracts = contractData?.kpis?.totalContracts || 0;
    const activeMembers = loyaltyData?.kpis?.activeMembers || 0;
    const pendingActions = (contractData?.kpis?.pendingApproval || 0) + (invData?.pendingPurchaseOrders || 0) + (contractData?.kpis?.expiringSoon || 0);

    // Build Attention Required list
    const alerts = [];
    if (contractData?.kpis?.pendingApproval > 0) {
        alerts.push({ 
            severity: 'amber', 
            module: 'Contracts', 
            title: `${contractData.kpis.pendingApproval} Pending Approvals`,
            desc: 'Contracts requiring administrator review',
            actionText: 'Review',
            onClick: () => navigate('/contracts') 
        });
    }
    if (contractData?.kpis?.expiringSoon > 0) {
        alerts.push({ 
            severity: 'amber', 
            module: 'Contracts', 
            title: `${contractData.kpis.expiringSoon} Expiring Soon`,
            desc: 'Contracts expire within the next 30 days',
            actionText: 'Renew',
            onClick: () => navigate('/contracts') 
        });
    }
    if (contractData?.expiryOverview?.expired > 0) {
        alerts.push({ 
            severity: 'red', 
            module: 'Contracts', 
            title: `${contractData.expiryOverview.expired} Expired Contracts`,
            desc: 'Contracts that have passed their end date',
            actionText: 'Review',
            onClick: () => navigate('/contracts') 
        });
    }
    if (invData?.lowStockCount > 0) {
        alerts.push({ 
            severity: 'amber', 
            module: 'Inventory', 
            title: `${invData.lowStockCount} Low Stock Products`,
            desc: 'Items below their minimum reorder level',
            actionText: 'Restock',
            onClick: () => navigate('/inventory') 
        });
    }
    if (invData?.outOfStockCount > 0) {
        alerts.push({ 
            severity: 'red', 
            module: 'Inventory', 
            title: `${invData.outOfStockCount} Out of Stock`,
            desc: 'Products with zero available quantity',
            actionText: 'Restock',
            onClick: () => navigate('/inventory') 
        });
    }

    // Inventory Health Calc
    const invHealthy = Math.max(0, totalProducts - (invData?.lowStockCount || 0) - (invData?.outOfStockCount || 0));
    const invLow = invData?.lowStockCount || 0;
    const invOut = invData?.outOfStockCount || 0;
    const invTotal = totalProducts || 1; // prevent div by zero

    // Contract Health Calc
    const conDist = contractData?.statusDistribution || {};
    const conDraft = conDist['Draft'] || 0;
    const conReview = conDist['Under Review'] || 0;
    const conActive = contractData?.kpis?.activeContracts || 0;
    const conExpired = conDist['Expired'] || 0;
    const conTotal = totalContracts || 1;

    // Loyalty Health Calc
    const loyActive = loyaltyData?.kpis?.activePrograms || 0;
    const loyTotalPoints = loyaltyData?.kpis?.pointsEarnedAllTime || 0;
    const loyRedeemed = loyaltyData?.kpis?.pointsRedeemedAllTime || 0;

    // Inventory Risk formatting
    const stockAlerts = [...(invData?.outOfStockItems || []), ...(invData?.lowStockItems || [])].slice(0, 5);

    return (
        <div className="erp-dashboard">
            {/* 1. HEADER / WELCOME */}
            <div className="erp-header">
                <div className="erp-hero-left">
                    <h1>{getGreeting()}, {getUsername()}</h1>
                    <p>Here's your BOMS overview for today.</p>
                </div>
                <div className="erp-hero-right">
                    <div className="erp-time-block">
                        <div className="erp-time">{currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</div>
                        <div className="erp-date">
                            <Calendar size={14} />
                            {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                    </div>
                    <div className="erp-last-updated">
                        Last updated {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
            </div>

            {/* 2. EXECUTIVE KPI STRIP */}
            <div className="erp-kpi-row">
                <div className="erp-kpi-card">
                    <div className="kpi-icon blue"><Box size={20} /></div>
                    <div className="kpi-content">
                        <div className="kpi-label">TOTAL PRODUCTS</div>
                        <div className="kpi-value">{totalProducts.toLocaleString()}</div>
                        <div className="kpi-desc">Tracked across warehouses</div>
                    </div>
                </div>
                <div className="erp-kpi-card">
                    <div className="kpi-icon purple"><FileText size={20} /></div>
                    <div className="kpi-content">
                        <div className="kpi-label">TOTAL CONTRACTS</div>
                        <div className="kpi-value">{totalContracts.toLocaleString()}</div>
                        <div className="kpi-desc">Across all statuses</div>
                    </div>
                </div>
                <div className="erp-kpi-card">
                    <div className="kpi-icon green"><Users size={20} /></div>
                    <div className="kpi-content">
                        <div className="kpi-label">ACTIVE MEMBERS</div>
                        <div className="kpi-value">{activeMembers.toLocaleString()}</div>
                        <div className="kpi-desc">Enrolled in loyalty</div>
                    </div>
                </div>
                <div className="erp-kpi-card">
                    <div className="kpi-icon amber"><AlertTriangle size={20} /></div>
                    <div className="kpi-content">
                        <div className="kpi-label">PENDING ACTIONS</div>
                        <div className="kpi-value">{pendingActions.toLocaleString()}</div>
                        <div className="kpi-desc">Requires attention</div>
                    </div>
                </div>
            </div>

            {/* 3. ATTENTION REQUIRED */}
            <div className="erp-section">
                <h2 className="erp-section-title">Attention Required</h2>
                <div className="erp-attention-panel">
                    {alerts.length > 0 ? (
                        <div className="attention-grid">
                            {alerts.map((alert, idx) => (
                                <div key={idx} className={`attention-card severity-${alert.severity}`}>
                                    <div className="att-header">
                                        <span className="att-module">{alert.module}</span>
                                        {alert.severity === 'red' ? <AlertOctagon size={16} /> : <AlertTriangle size={16} />}
                                    </div>
                                    <h3 className="alert-title">{alert.title}</h3>
                                    <p className="alert-desc">{alert.desc}</p>
                                    <button className="att-action" onClick={alert.onClick}>
                                        {alert.actionText} <ArrowRight size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="erp-empty-positive">
                            <CheckCircle2 size={32} className="text-success" />
                            <div className="empty-title">All caught up</div>
                            <div className="empty-desc">No immediate attention required across modules.</div>
                        </div>
                    )}
                </div>
            </div>

            {/* 4. BUSINESS HEALTH & OPERATIONS */}
            <div className="erp-section">
                <h2 className="erp-section-title">Business Health</h2>
                <div className="erp-health-grid">
                    
                    {/* INVENTORY HEALTH */}
                    <div className="health-panel">
                        <div className="hp-header">
                            <h3><Box size={16} /> Inventory</h3>
                            <button className="hp-nav" onClick={() => navigate('/inventory')}>View <ArrowRight size={14}/></button>
                        </div>
                        <div className="hp-body">
                            <div className="hp-segmented-bar">
                                <div className="seg healthy" style={{ width: `${(invHealthy/invTotal)*100}%` }}></div>
                                <div className="seg low" style={{ width: `${(invLow/invTotal)*100}%` }}></div>
                                <div className="seg out" style={{ width: `${(invOut/invTotal)*100}%` }}></div>
                            </div>
                            <div className="hp-legend">
                                <div className="leg-item">
                                    <div className="leg-dot healthy"></div>
                                    <span className="leg-val">{invHealthy}</span>
                                    <span className="leg-lbl">Healthy</span>
                                </div>
                                <div className="leg-item">
                                    <div className="leg-dot low"></div>
                                    <span className="leg-val">{invLow}</span>
                                    <span className="leg-lbl">Low Stock</span>
                                </div>
                                <div className="leg-item">
                                    <div className="leg-dot out"></div>
                                    <span className="leg-val">{invOut}</span>
                                    <span className="leg-lbl">Out</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CONTRACT HEALTH */}
                    <div className="health-panel">
                        <div className="hp-header">
                            <h3><FileText size={16} /> Contracts</h3>
                            <button className="hp-nav" onClick={() => navigate('/contracts')}>View <ArrowRight size={14}/></button>
                        </div>
                        <div className="hp-body">
                            <div className="hp-segmented-bar">
                                <div className="seg draft" style={{ width: `${(conDraft/conTotal)*100}%` }}></div>
                                <div className="seg review" style={{ width: `${(conReview/conTotal)*100}%` }}></div>
                                <div className="seg active" style={{ width: `${(conActive/conTotal)*100}%` }}></div>
                                <div className="seg expired" style={{ width: `${(conExpired/conTotal)*100}%` }}></div>
                            </div>
                            <div className="hp-legend">
                                <div className="leg-item"><div className="leg-dot draft"></div><span className="leg-val">{conDraft}</span><span className="leg-lbl">Draft</span></div>
                                <div className="leg-item"><div className="leg-dot review"></div><span className="leg-val">{conReview}</span><span className="leg-lbl">Review</span></div>
                                <div className="leg-item"><div className="leg-dot active"></div><span className="leg-val">{conActive}</span><span className="leg-lbl">Active</span></div>
                                <div className="leg-item"><div className="leg-dot expired"></div><span className="leg-val">{conExpired}</span><span className="leg-lbl text-error">Expired</span></div>
                            </div>
                        </div>
                    </div>

                    {/* LOYALTY HEALTH */}
                    <div className="health-panel">
                        <div className="hp-header">
                            <h3><Award size={16} /> Customer Loyalty</h3>
                            <button className="hp-nav" onClick={() => navigate('/loyalty')}>View <ArrowRight size={14}/></button>
                        </div>
                        <div className="hp-body">
                            <div className="loyalty-metrics-compact">
                                <div className="lmc-box">
                                    <div className="lmc-lbl">Active Programs</div>
                                    <div className="lmc-val">{loyActive}</div>
                                </div>
                                <div className="lmc-box">
                                    <div className="lmc-lbl">Points Issued</div>
                                    <div className="lmc-val text-success">{loyTotalPoints.toLocaleString()}</div>
                                </div>
                                <div className="lmc-box">
                                    <div className="lmc-lbl">Points Redeemed</div>
                                    <div className="lmc-val">{loyRedeemed.toLocaleString()}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 7 & 8. RISK VISUALS ROW */}
            <div className="erp-split-row">
                {/* CONTRACT EXPIRY VISUAL */}
                <div className="erp-panel split-panel">
                    <div className="panel-header">
                        <h2 className="panel-title">Contract Expiry Outlook</h2>
                    </div>
                    <div className="panel-body">
                        {!contractData?.expiryOverview ? (
                            <div className="erp-empty-text">No contract expiry data available</div>
                        ) : (
                            <div className="expiry-buckets">
                                <div className="bucket" onClick={() => navigate('/contracts')}>
                                    <div className="buc-label text-error">Expired</div>
                                    <div className="buc-val">{contractData.expiryOverview.expired || 0}</div>
                                    <div className="buc-bar-bg"><div className="buc-bar fill-error" style={{width: `${Math.min(100, ((contractData.expiryOverview.expired || 0)/conTotal)*100)}%`}}></div></div>
                                </div>
                                <div className="bucket" onClick={() => navigate('/contracts')}>
                                    <div className="buc-label text-warning">0–30 Days</div>
                                    <div className="buc-val">{contractData.expiryOverview.expiring30Days || 0}</div>
                                    <div className="buc-bar-bg"><div className="buc-bar fill-warning" style={{width: `${Math.min(100, ((contractData.expiryOverview.expiring30Days || 0)/conTotal)*100)}%`}}></div></div>
                                </div>
                                <div className="bucket" onClick={() => navigate('/contracts')}>
                                    <div className="buc-label text-info">31–60 Days</div>
                                    <div className="buc-val">{contractData.expiryOverview.expiring60Days || 0}</div>
                                    <div className="buc-bar-bg"><div className="buc-bar fill-info" style={{width: `${Math.min(100, ((contractData.expiryOverview.expiring60Days || 0)/conTotal)*100)}%`}}></div></div>
                                </div>
                                <div className="bucket" onClick={() => navigate('/contracts')}>
                                    <div className="buc-label">61–90 Days</div>
                                    <div className="buc-val">{contractData.expiryOverview.expiring90Days || 0}</div>
                                    <div className="buc-bar-bg"><div className="buc-bar fill-main" style={{width: `${Math.min(100, ((contractData.expiryOverview.expiring90Days || 0)/conTotal)*100)}%`}}></div></div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* INVENTORY RISK VISUAL */}
                <div className="erp-panel split-panel">
                    <div className="panel-header">
                        <h2 className="panel-title">Inventory Risk</h2>
                    </div>
                    <div className="panel-body">
                        {stockAlerts.length > 0 ? (
                            <div className="stock-risk-list">
                                {stockAlerts.map((item, idx) => {
                                    const ratio = item.AvailableQuantity / (item.ReorderLevel || 1);
                                    const percent = Math.min(100, Math.max(0, ratio * 100));
                                    const isOut = item.AvailableQuantity === 0;
                                    
                                    return (
                                        <div key={idx} className="stock-risk-row">
                                            <div className="sr-info">
                                                <div className="sr-name">{item.ProductName} <span className="sr-sku">({item.SKU})</span></div>
                                                <div className={`sr-status ${isOut ? 'text-error' : 'text-warning'}`}>
                                                    {isOut ? 'CRITICAL' : 'LOW STOCK'}
                                                </div>
                                            </div>
                                            <div className="sr-visual">
                                                <div className="sr-bar-bg">
                                                    <div className={`sr-bar ${isOut ? 'bg-error' : 'bg-warning'}`} style={{ width: `${percent}%` }}></div>
                                                </div>
                                                <div className="sr-nums">
                                                    <strong>{item.AvailableQuantity}</strong> / {item.ReorderLevel}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="erp-empty-positive small">
                                <CheckCircle2 size={24} className="text-success mb-2" />
                                <div>Inventory is within healthy stock levels</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 9 & 10. RECENT ACTIVITY + QUICK ACTIONS */}
            <div className="erp-split-row">
                <div className="erp-panel" style={{ flex: 2 }}>
                    <div className="panel-header">
                        <h2 className="panel-title">Recent Activity</h2>
                    </div>
                    <div className="panel-body">
                        {globalData?.recentActivities?.length > 0 ? (
                            <div className="erp-timeline">
                                {globalData.recentActivities.map((act, idx) => (
                                    <div key={idx} className="timeline-item">
                                        <div className="tl-indicator"></div>
                                        <div className="tl-content">
                                            <div className="tl-primary">
                                                <span className="tl-module-badge">{act.module}</span>
                                                <span className="tl-action">{act.action}</span>
                                            </div>
                                            <div className="tl-secondary">
                                                <span className="tl-user">{act.user}</span>
                                                <span className="tl-time">{act.time}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="erp-empty-text">No operational activity recorded yet</div>
                        )}
                    </div>
                </div>

                <div className="erp-panel" style={{ flex: 1 }}>
                    <div className="panel-header">
                        <h2 className="panel-title">Quick Actions</h2>
                    </div>
                    <div className="panel-body">
                        <div className="quick-action-list">
                            <button className="qa-btn" onClick={() => navigate('/contracts')}>
                                <FileSignature size={16} /> Create Contract
                            </button>
                            <button className="qa-btn" onClick={() => navigate('/inventory')}>
                                <Box size={16} /> Add Product
                            </button>
                            <button className="qa-btn" onClick={() => navigate('/inventory')}>
                                <Activity size={16} /> Stock Adjustment
                            </button>
                            <button className="qa-btn" onClick={() => navigate('/loyalty')}>
                                <Award size={16} /> Create Loyalty Program
                            </button>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default DashboardPage;
