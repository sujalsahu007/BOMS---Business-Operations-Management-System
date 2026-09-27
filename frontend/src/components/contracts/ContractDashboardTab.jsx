import React, { useState, useEffect } from 'react';
import { 
    FileText, CalendarClock, ShieldAlert, CheckCircle, 
    TrendingUp, Activity, PieChart as PieChartIcon,
    AlertCircle, FileSignature, ArrowRight
} from 'lucide-react';
import { 
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import { contractApi } from '../../services/contractApi';
import './ContractDashboardTab.css';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b', '#0ea5e9', '#ec4899'];

const ContractDashboardTab = ({ onNavigate }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                setLoading(true);
                const res = await contractApi.getDashboard();
                setData(res);
            } catch (err) {
                console.error("Failed to fetch dashboard", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col gap-6 p-6 h-full w-full">
                <div className="grid grid-cols-6 gap-4">
                    {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-24 rounded-lg"></div>)}
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="skeleton h-64 rounded-lg"></div>
                    <div className="skeleton h-64 rounded-lg"></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="skeleton h-64 rounded-lg"></div>
                    <div className="skeleton h-64 rounded-lg"></div>
                </div>
            </div>
        );
    }

    if (!data) return (
        <div className="flex flex-col items-center justify-center h-full text-muted p-8">
            <AlertCircle size={48} className="mb-4 opacity-50" />
            <h3 className="text-xl mb-2">Unable to load contract dashboard.</h3>
            <button className="primary-btn mt-4" onClick={() => window.location.reload()}>Retry</button>
        </div>
    );

    const { 
        kpis, statusDistribution, expiryOverview, 
        approvalOverview, obligationOverview, 
        recentContracts, expiringContracts 
    } = data;

    const statusData = Object.entries(statusDistribution || {}).map(([name, value]) => ({
        name,
        value
    })).filter(item => item.value > 0);

    const formatCurrency = (val, cur) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur || 'USD' }).format(val || 0);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString();
    };

    return (
        <div className="dashboard-wrapper" style={{ padding: '24px', overflowY: 'auto' }}>
            
            {/* 1. HEADER */}
            <div className="cd-flex cd-justify-between cd-items-center cd-mb-6">
                <div>
                    <h2 className="cd-text-xl cd-font-bold cd-text-main" style={{ marginBottom: '4px' }}>Contract Dashboard</h2>
                    <p className="cd-text-sm cd-text-muted">Overview of contract portfolio, risks and upcoming actions.</p>
                </div>
                <div className="cd-flex cd-items-center cd-gap-3">
                    <button className="primary-btn cd-flex cd-items-center cd-gap-2" onClick={() => onNavigate('contracts')}>
                        <FileText size={16} /> <span>Create Contract</span>
                    </button>
                    <div className="cd-flex cd-items-center cd-gap-2" style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '12px', marginLeft: '4px' }}>
                        <button className="secondary-btn cd-flex cd-items-center cd-gap-2" onClick={() => onNavigate('approvals')}>
                            <CheckCircle size={14} /> <span className="cd-text-sm">Approvals</span>
                        </button>
                        <button className="secondary-btn cd-flex cd-items-center cd-gap-2" onClick={() => onNavigate('renewals')}>
                            <CalendarClock size={14} /> <span className="cd-text-sm">Renewals</span>
                        </button>
                        <button className="secondary-btn cd-flex cd-items-center cd-gap-2" onClick={() => onNavigate('obligations')}>
                            <ShieldAlert size={14} /> <span className="cd-text-sm">Obligations</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. KPI STRIP */}
            <div className="dashboard-kpi-strip">
                <div className="premium-kpi-card clickable" onClick={() => onNavigate('contracts')}>
                    <div className="kpi-icon-glow" style={{ color: 'var(--primary-color)' }}>
                        <FileText size={26} />
                    </div>
                    <div className="kpi-content">
                        <div className="kpi-title">Total Contracts</div>
                        <div className="kpi-value">{kpis?.totalContracts || 0}</div>
                    </div>
                </div>
                <div className="premium-kpi-card clickable" onClick={() => onNavigate('contracts')}>
                    <div className="kpi-icon-glow" style={{ color: 'var(--success-color)' }}>
                        <Activity size={26} />
                    </div>
                    <div className="kpi-content">
                        <div className="kpi-title">Active Contracts</div>
                        <div className="kpi-value">{kpis?.activeContracts || 0}</div>
                    </div>
                </div>
                <div className="premium-kpi-card clickable" onClick={() => onNavigate('approvals')}>
                    <div className="kpi-icon-glow" style={{ color: 'var(--warning-color)' }}>
                        <CheckCircle size={26} />
                    </div>
                    <div className="kpi-content">
                        <div className="kpi-title">Pending Approvals</div>
                        <div className="kpi-value">{kpis?.pendingApproval || 0}</div>
                    </div>
                </div>
                <div className="premium-kpi-card clickable" onClick={() => onNavigate('renewals')}>
                    <div className="kpi-icon-glow" style={{ color: 'var(--error-color)' }}>
                        <AlertCircle size={26} />
                    </div>
                    <div className="kpi-content">
                        <div className="kpi-title">Expiring Soon</div>
                        <div className="kpi-value">{kpis?.expiringSoon || 0}</div>
                    </div>
                </div>
            </div>

            {/* 3. CONTRACT HEALTH / STATUS */}
            <div className="cd-grid-2 cd-mb-6">
                <div className="dashboard-panel">
                    <div className="panel-header">
                        <h3 className="panel-title"><PieChartIcon size={18} /> Contract Status</h3>
                    </div>
                    <div className="panel-content cd-flex cd-flex-row cd-items-center cd-justify-between cd-px-4" style={{ height: '220px' }}>
                        {statusData.length > 0 ? (
                            <>
                                <div style={{ flex: 1, minWidth: '180px', paddingRight: '16px' }}>
                                    {statusData.map((entry, index) => {
                                        const percent = kpis?.totalContracts ? Math.round((entry.value / kpis.totalContracts) * 100) : 0;
                                        return (
                                            <div key={entry.name} className="cd-flex cd-items-center cd-justify-between cd-gap-4 cd-mb-2">
                                                <div className="cd-flex cd-items-center cd-gap-2">
                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[index % COLORS.length], boxShadow: `0 0 8px ${COLORS[index % COLORS.length]}` }}></div>
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
                                <div className="chart-container-200" style={{ position: 'relative', height: '100%', width: '160px', flexShrink: 0 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={3} dataKey="value" stroke="none">
                                                {statusData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ background: 'var(--surface-highlight)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', padding: '8px 12px' }} itemStyle={{ color: 'var(--text-main)', fontSize: '14px', fontWeight: 'bold' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                                        <div className="cd-text-xs cd-font-bold cd-text-muted" style={{ letterSpacing: '0.05em' }}>TOTAL</div>
                                        <div className="cd-text-xl cd-font-bold cd-text-main" style={{ lineHeight: '1' }}>{kpis?.totalContracts || 0}</div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="dashboard-empty cd-w-full cd-h-full cd-flex cd-flex-col cd-items-center cd-justify-center">
                                <div className="empty-icon-ring" style={{ marginBottom: '16px' }}><PieChartIcon size={32} /></div>
                                <h4 className="cd-text-main cd-mb-2">No Status Data</h4>
                            </div>
                        )}
                    </div>
                </div>

                <div className="dashboard-panel">
                    <div className="panel-header">
                        <h3 className="panel-title"><Activity size={18} /> Portfolio Health</h3>
                    </div>
                    <div className="panel-content cd-flex cd-flex-col cd-justify-center cd-gap-4 cd-px-4 cd-h-full">
                        {[
                            { label: 'Active', value: kpis?.activeContracts || 0, color: 'var(--success-color)' },
                            { label: 'Under Review', value: statusDistribution?.['Under Review'] || 0, color: 'var(--info-color)' },
                            { label: 'Pending Approval', value: kpis?.pendingApproval || 0, color: 'var(--warning-color)' },
                            { label: 'Expiring Soon', value: kpis?.expiringSoon || 0, color: '#f97316' },
                            { label: 'Expired', value: statusDistribution?.Expired || 0, color: 'var(--error-color)' }
                        ].map((stat, idx) => {
                            const percent = kpis?.totalContracts ? Math.round((stat.value / kpis.totalContracts) * 100) : 0;
                            return (
                                <div key={idx} style={{ marginBottom: '8px' }}>
                                    <div className="cd-flex cd-justify-between cd-items-center cd-mb-1">
                                        <span className="cd-text-sm cd-font-semibold">{stat.label}</span>
                                        <span className="cd-text-sm font-mono">{stat.value} <span className="cd-text-xs cd-text-muted">({percent}%)</span></span>
                                    </div>
                                    <div className="progress-bar-bg">
                                        <div className="progress-bar-fill" style={{ width: `${Math.max(percent, 2)}%`, backgroundColor: stat.color, boxShadow: `0 0 10px ${stat.color}80` }}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* 4. APPROVAL & EXPIRY ANALYTICS */}
            <div className="cd-grid-2 cd-mb-6">
                <div className="dashboard-panel">
                    <div className="panel-header">
                        <h3 className="panel-title"><CheckCircle size={18} /> Approval Overview</h3>
                        <button className="view-all-btn" onClick={() => onNavigate('approvals')}>View All</button>
                    </div>
                    <div className="panel-content cd-flex cd-flex-col cd-gap-4 cd-px-4" style={{ justifyContent: 'center' }}>
                        <div className="cd-flex cd-justify-between cd-items-center cd-p-4 cd-rounded-lg" style={{ background: 'var(--surface-highlight)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                            <div className="cd-flex cd-items-center cd-gap-3">
                                <div className="cd-p-2 cd-rounded-lg" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
                                    <TrendingUp size={20} color="#f59e0b" />
                                </div>
                                <span className="cd-font-bold cd-text-sm">Pending Request</span>
                            </div>
                            <span className="font-mono cd-font-bold cd-text-xl" style={{ color: '#f59e0b' }}>{approvalOverview?.pendingApprovals || 0}</span>
                        </div>
                        <div className="cd-flex cd-justify-between cd-items-center cd-p-4 cd-rounded-lg" style={{ background: 'var(--surface-highlight)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                            <div className="cd-flex cd-items-center cd-gap-3">
                                <div className="cd-p-2 cd-rounded-lg" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                                    <CheckCircle size={20} color="#10b981" />
                                </div>
                                <span className="cd-font-bold cd-text-sm">Approved</span>
                            </div>
                            <span className="font-mono cd-font-bold cd-text-xl" style={{ color: '#10b981' }}>{approvalOverview?.approved || 0}</span>
                        </div>
                        <div className="cd-flex cd-justify-between cd-items-center cd-p-4 cd-rounded-lg" style={{ background: 'var(--surface-highlight)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                            <div className="cd-flex cd-items-center cd-gap-3">
                                <div className="cd-p-2 cd-rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                                    <AlertCircle size={20} color="#ef4444" />
                                </div>
                                <span className="cd-font-bold cd-text-sm">Rejected</span>
                            </div>
                            <span className="font-mono cd-font-bold cd-text-xl" style={{ color: '#ef4444' }}>{approvalOverview?.rejected || 0}</span>
                        </div>
                    </div>
                </div>

                <div className="dashboard-panel">
                    <div className="panel-header">
                        <h3 className="panel-title"><AlertCircle size={18} /> Expiry Risk</h3>
                        <button className="view-all-btn" onClick={() => onNavigate('renewals')}>View Actions</button>
                    </div>
                    <div className="panel-content cd-grid-2 cd-gap-4 cd-px-4 cd-items-center">
                        <div className="cd-flex cd-flex-col cd-items-center cd-justify-center cd-p-4 cd-rounded-lg" style={{ background: 'var(--error-bg)', border: '1px solid var(--error-color)', boxShadow: 'var(--shadow-sm)' }}>
                            <span className="cd-text-xl cd-font-bold cd-mb-1" style={{ color: 'var(--error-color)' }}>{expiryOverview?.expired || 0}</span>
                            <span className="cd-text-xs cd-font-bold" style={{ textTransform: 'uppercase', color: 'var(--error-color)' }}>Expired</span>
                        </div>
                        <div className="cd-flex cd-flex-col cd-items-center cd-justify-center cd-p-4 cd-rounded-lg" style={{ background: 'var(--warning-bg)', border: '1px solid var(--warning-color)', boxShadow: 'var(--shadow-sm)' }}>
                            <span className="cd-text-xl cd-font-bold cd-mb-1" style={{ color: 'var(--warning-color)' }}>{expiryOverview?.expiring30Days || 0}</span>
                            <span className="cd-text-xs cd-font-bold" style={{ textTransform: 'uppercase', color: 'var(--warning-color)' }}>Next 30 Days</span>
                        </div>
                        <div className="cd-flex cd-flex-col cd-items-center cd-justify-center cd-p-4 cd-rounded-lg" style={{ background: 'var(--info-bg)', border: '1px solid var(--info-color)', boxShadow: 'var(--shadow-sm)' }}>
                            <span className="cd-text-xl cd-font-bold cd-mb-1" style={{ color: 'var(--info-color)' }}>{expiryOverview?.expiring60Days || 0}</span>
                            <span className="cd-text-xs cd-font-bold" style={{ textTransform: 'uppercase', color: 'var(--info-color)' }}>Next 60 Days</span>
                        </div>
                        <div className="cd-flex cd-flex-col cd-items-center cd-justify-center cd-p-4 cd-rounded-lg" style={{ background: 'var(--surface-highlight)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                            <span className="cd-text-xl cd-font-bold cd-mb-1 cd-text-main">{expiryOverview?.expiring90Days || 0}</span>
                            <span className="cd-text-xs cd-font-bold cd-text-muted" style={{ textTransform: 'uppercase' }}>Next 90 Days</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 5. OBLIGATION INSIGHTS */}
            <div className="dashboard-panel cd-mb-6">
                <div className="panel-header">
                    <h3 className="panel-title"><ShieldAlert size={18} /> Obligation Overview</h3>
                    <button className="view-all-btn" onClick={() => onNavigate('obligations')}>View All</button>
                </div>
                <div className="panel-content cd-grid-4 cd-gap-6 cd-px-4">
                    <div className="cd-flex cd-items-center cd-gap-4 cd-p-4 cd-rounded-lg" style={{ background: 'var(--surface-highlight)', border: '1px solid var(--border-color)' }}>
                        <div style={{ padding: '12px', background: 'var(--info-bg)', borderRadius: '12px', color: 'var(--info-color)' }}>
                            <FileSignature size={24} />
                        </div>
                        <div>
                            <div className="cd-text-xs cd-font-bold cd-text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Open</div>
                            <div className="cd-text-xl cd-font-bold cd-text-main">{obligationOverview?.openObligations || 0}</div>
                        </div>
                    </div>
                    <div className="cd-flex cd-items-center cd-gap-4 cd-p-4 cd-rounded-lg" style={{ background: 'var(--surface-highlight)', border: '1px solid var(--border-color)' }}>
                        <div style={{ padding: '12px', background: 'var(--warning-bg)', borderRadius: '12px', color: 'var(--warning-color)' }}>
                            <CalendarClock size={24} />
                        </div>
                        <div>
                            <div className="cd-text-xs cd-font-bold cd-text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Due Soon</div>
                            <div className="cd-text-xl cd-font-bold cd-text-main">{obligationOverview?.dueSoon || 0}</div>
                        </div>
                    </div>
                    <div className="cd-flex cd-items-center cd-gap-4 cd-p-4 cd-rounded-lg" style={{ background: 'var(--surface-highlight)', border: '1px solid var(--border-color)' }}>
                        <div style={{ padding: '12px', background: 'var(--error-bg)', borderRadius: '12px', color: 'var(--error-color)' }}>
                            <AlertCircle size={24} />
                        </div>
                        <div>
                            <div className="cd-text-xs cd-font-bold cd-text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Overdue</div>
                            <div className="cd-text-xl cd-font-bold cd-text-main">{obligationOverview?.overdue || 0}</div>
                        </div>
                    </div>
                    <div className="cd-flex cd-items-center cd-gap-4 cd-p-4 cd-rounded-lg" style={{ background: 'var(--surface-highlight)', border: '1px solid var(--border-color)' }}>
                        <div style={{ padding: '12px', background: 'var(--success-bg)', borderRadius: '12px', color: 'var(--success-color)' }}>
                            <CheckCircle size={24} />
                        </div>
                        <div>
                            <div className="cd-text-xs cd-font-bold cd-text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completed</div>
                            <div className="cd-text-xl cd-font-bold cd-text-main">{obligationOverview?.completed || 0}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 6. UPCOMING EXPIRIES */}
            <div className="dashboard-panel cd-mb-6">
                <div className="panel-header">
                    <h3 className="panel-title"><TrendingUp size={18} /> Upcoming Expiries</h3>
                    <button className="view-all-btn" onClick={() => onNavigate('renewals')}>View Timeline</button>
                </div>
                <div className="panel-content cd-px-4" style={{ paddingBottom: '8px' }}>
                    {(!expiringContracts || expiringContracts.length === 0) ? (
                        <div className="dashboard-empty cd-flex cd-flex-col cd-items-center cd-justify-center" style={{ padding: '32px' }}>
                            <CalendarClock size={32} style={{ color: 'var(--text-muted)', opacity: 0.5, marginBottom: '12px' }} />
                            <h4 className="cd-text-main">No upcoming expiries</h4>
                        </div>
                    ) : (
                        <div className="cd-flex cd-flex-col cd-gap-3">
                            {expiringContracts.slice(0, 4).map(c => {
                                const diffTime = new Date(c.endDate) - new Date();
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                const riskColor = diffDays <= 0 ? 'var(--error-color)' : diffDays <= 30 ? 'var(--warning-color)' : 'var(--info-color)';
                                const riskBg = diffDays <= 0 ? 'var(--error-bg)' : diffDays <= 30 ? 'var(--warning-bg)' : 'var(--info-bg)';
                                
                                return (
                                    <div key={c.contractId} className="cd-flex cd-items-center cd-justify-between cd-p-4 cd-rounded-lg" style={{ border: '1px solid var(--border-color)', background: 'var(--surface-color)' }}>
                                        <div className="cd-flex cd-items-center cd-gap-4">
                                            <div style={{ width: '4px', height: '40px', borderRadius: '4px', backgroundColor: riskColor }}></div>
                                            <div>
                                                <div className="cd-font-bold cd-text-sm cd-text-main">{c.title || c.contractNumber}</div>
                                                <div className="cd-text-xs cd-text-muted">{c.partyName || c.contractNumber}</div>
                                            </div>
                                        </div>
                                        <div className="cd-flex cd-items-center cd-gap-6">
                                            <div className="cd-text-right">
                                                <div className="cd-text-xs cd-text-muted cd-mb-1">END DATE</div>
                                                <div className="font-mono cd-text-sm cd-font-bold">{formatDate(c.endDate)}</div>
                                            </div>
                                            <div style={{ padding: '6px 12px', borderRadius: '8px', background: riskBg, color: riskColor, minWidth: '100px', textAlign: 'center' }}>
                                                <span className="cd-font-bold cd-text-xs" style={{ textTransform: 'uppercase' }}>
                                                    {diffDays < 0 ? `${Math.abs(diffDays)}d Overdue` : diffDays === 0 ? 'Today' : `${diffDays} Days Left`}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* 7. RECENT CONTRACTS */}
            <div className="dashboard-panel cd-mb-8">
                <div className="panel-header">
                    <h3 className="panel-title"><FileSignature size={18} /> Recent Contracts</h3>
                    <button className="view-all-btn" onClick={() => onNavigate('contracts')}>View All</button>
                </div>
                <div className="panel-content" style={{ overflowX: 'auto', padding: '0 24px 24px 24px' }}>
                    {(!recentContracts || recentContracts.length === 0) ? (
                        <div className="dashboard-empty cd-flex cd-flex-col cd-items-center cd-justify-center" style={{ padding: '32px' }}>
                            <FileSignature size={32} style={{ color: 'var(--text-muted)', opacity: 0.5, marginBottom: '12px' }} />
                            <h4 className="cd-text-main">No recent contracts</h4>
                        </div>
                    ) : (
                        <table className="premium-table">
                            <thead>
                                <tr>
                                    <th>Contract</th>
                                    <th>Party</th>
                                    <th>End Date</th>
                                    <th>Status</th>
                                    <th>Updated</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentContracts.slice(0, 5).map(c => (
                                    <tr key={c.contractId}>
                                        <td>
                                            <div className="cd-font-bold cd-text-sm cd-text-main">{c.contractNumber}</div>
                                            <div className="cd-text-xs cd-text-muted" style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</div>
                                        </td>
                                        <td className="cd-text-sm">{c.partyName || '-'}</td>
                                        <td className="cd-text-sm font-mono">{formatDate(c.endDate)}</td>
                                        <td>
                                            <span className={`status-pill ${(c.status || '').toLowerCase().replace(' ', '-')}`}>
                                                {c.status}
                                            </span>
                                        </td>
                                        <td className="cd-text-sm cd-text-muted">{formatDate(c.updatedAt || c.createdAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

        </div>
    );
};

export default ContractDashboardTab;
