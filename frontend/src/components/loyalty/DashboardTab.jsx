import React, { useState, useEffect } from 'react';
import { 
    Gift, Users, Activity, Target, Shield,
    ArrowUpRight, ArrowDownRight, RefreshCw, AlertTriangle,
    TrendingUp, Trophy, ArrowRight, CheckCircle2,
    Plus, UserPlus, AlertCircle
} from 'lucide-react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { loyaltyDashboardApi } from '../../services/loyaltyDashboardApi';
import './DashboardTab.css';

const CustomAreaTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="loyalty-premium-tooltip">
                <p className="loyalty-tt-label">{label}</p>
                {payload.map((entry, index) => (
                    <p key={index} className="loyalty-tt-item" style={{ color: entry.color }}>
                        <span className="loyalty-tt-name">{entry.name}:</span>
                        <span className="loyalty-tt-val">{entry.value.toLocaleString()}</span>
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div className="loyalty-premium-tooltip">
                <p className="loyalty-tt-item" style={{ color: payload[0].payload.fill, margin: 0 }}>
                    <span className="loyalty-tt-name">{payload[0].name}:</span>
                    <span className="loyalty-tt-val">{payload[0].value.toLocaleString()}</span>
                </p>
            </div>
        );
    }
    return null;
};

const DashboardTab = ({ setActiveTab }) => {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchSummary = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await loyaltyDashboardApi.getSummary();
            setSummary(response.data);
        } catch (err) {
            console.error("Error fetching loyalty dashboard:", err);
            setError(err.message || "Failed to load loyalty data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSummary();
    }, []);

    if (loading) {
        return (
            <div className="loyalty-s-dashboard">
                <div className="ls-header skeleton" style={{ height: '80px' }}></div>
                <div className="ls-kpi-row">
                    {[1, 2, 3, 4].map(i => <div key={i} className="ls-skeleton-card"></div>)}
                </div>
                <div className="ls-split-row">
                    <div className="ls-skeleton-card" style={{ height: '300px', flex: 2 }}></div>
                    <div className="ls-skeleton-card" style={{ height: '300px', flex: 1 }}></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="loyalty-s-dashboard flex-center">
                <div className="ls-empty-state">
                    <AlertCircle size={48} className="text-error mb-4" />
                    <h2>Unable to load Customer Loyalty</h2>
                    <p>{error}</p>
                    <button className="ls-btn mt-4" onClick={fetchSummary}>
                        <RefreshCw size={16} /> Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!summary) return null;

    const { kpis, membershipOverview, programPerformance, pointsActivity, tierDistribution, recentActivity } = summary;

    // Derived Metrics
    const totalMembers = (membershipOverview?.activeMembers || 0) + (membershipOverview?.inactiveMembers || 0);
    const activeMembers = membershipOverview?.activeMembers || 0;
    const inactiveMembers = membershipOverview?.inactiveMembers || 0;
    
    const pieData = [
        { name: 'Active', value: activeMembers, fill: '#10b981' },
        { name: 'Inactive', value: inactiveMembers, fill: '#64748b' }
    ];

    const redemptionRate = kpis?.pointsEarnedAllTime > 0 
        ? ((kpis.pointsRedeemedAllTime / kpis.pointsEarnedAllTime) * 100).toFixed(1) 
        : 0;

    // Loyalty Health Calc
    const activeRatio = totalMembers > 0 ? (activeMembers / totalMembers) : 0;
    const emptyPrograms = programPerformance ? programPerformance.filter(p => p.membersCount === 0).length : 0;
    
    const healthIndicators = [
        {
            label: "Program Health",
            status: (kpis?.activePrograms === 0) ? 'attention' : (emptyPrograms > 0 ? 'attention' : 'healthy'),
            desc: emptyPrograms > 0 ? `${emptyPrograms} programs with 0 members` : 'All programs active'
        },
        {
            label: "Member Engagement",
            status: activeRatio > 0.6 ? 'healthy' : (activeRatio > 0.3 ? 'attention' : 'critical'),
            desc: `${(activeRatio*100).toFixed(0)}% active members`
        },
        {
            label: "Reward Utilization",
            status: redemptionRate > 20 ? 'healthy' : (redemptionRate > 0 ? 'attention' : 'critical'),
            desc: `${redemptionRate}% redemption rate`
        },
        {
            label: "Tier Configuration",
            status: (!tierDistribution || tierDistribution.length === 0) ? 'attention' : 'healthy',
            desc: (!tierDistribution || tierDistribution.length === 0) ? 'No tiers configured' : `${tierDistribution.length} active tiers`
        }
    ];

    const allHealthy = healthIndicators.every(h => h.status === 'healthy');

    return (
        <div className="loyalty-s-dashboard">
            {/* 1. HEADER */}
            <div className="ls-header">
                <div className="ls-hero-left">
                    <h1>Customer Loyalty</h1>
                    <p>Monitor loyalty programs, customer engagement and rewards performance.</p>
                </div>
                <div className="ls-hero-right">
                    <button className="ls-btn secondary" onClick={() => setActiveTab('programs')}>
                        <Plus size={16} /> Create Program
                    </button>
                    <button className="ls-btn primary" onClick={() => setActiveTab('customers')}>
                        <UserPlus size={16} /> Enroll Customer
                    </button>
                </div>
            </div>

            {/* 2. KPI SUMMARY */}
            <div className="ls-kpi-row">
                <div className="ls-kpi-card">
                    <div className="lsk-icon color-blue"><Gift size={20} /></div>
                    <div className="lsk-content">
                        <div className="lsk-value">{(kpis?.activePrograms || 0).toLocaleString()}</div>
                        <div className="lsk-label">ACTIVE PROGRAMS</div>
                        <div className="lsk-desc">Currently running</div>
                    </div>
                </div>
                <div className="ls-kpi-card">
                    <div className="lsk-icon color-green"><Users size={20} /></div>
                    <div className="lsk-content">
                        <div className="lsk-value">{(kpis?.activeMembers || 0).toLocaleString()}</div>
                        <div className="lsk-label">ACTIVE MEMBERS</div>
                        <div className="lsk-desc">Enrolled in programs</div>
                    </div>
                </div>
                <div className="ls-kpi-card">
                    <div className="lsk-icon color-emerald"><TrendingUp size={20} /></div>
                    <div className="lsk-content">
                        <div className="lsk-value">{(kpis?.pointsEarnedAllTime || 0).toLocaleString()}</div>
                        <div className="lsk-label">POINTS EARNED</div>
                        <div className="lsk-desc">Lifetime points issued</div>
                    </div>
                </div>
                <div className="ls-kpi-card">
                    <div className="lsk-icon color-amber"><Target size={20} /></div>
                    <div className="lsk-content">
                        <div className="lsk-value">{(kpis?.pointsRedeemedAllTime || 0).toLocaleString()}</div>
                        <div className="lsk-label">POINTS REDEEMED</div>
                        <div className="lsk-desc">Lifetime points claimed</div>
                    </div>
                </div>
            </div>

            {/* 3. PRIMARY ANALYTICS ROW */}
            <div className="ls-split-row">
                {/* LEFT: POINTS ACTIVITY */}
                <div className="ls-panel" style={{ flex: 2 }}>
                    <div className="ls-panel-header">
                        <h2>Points Activity</h2>
                        <div className="ls-ph-actions">
                            <span className="ls-ph-tab active">30 Days</span>
                        </div>
                    </div>
                    <div className="ls-panel-body" style={{ height: '320px', padding: '20px 20px 0 0' }}>
                        {!pointsActivity || pointsActivity.length === 0 ? (
                            <div className="ls-empty-text h-full flex-center">No transaction activity recorded</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={pointsActivity} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorEarned" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorRedeemed" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="dateLabel" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v} />
                                    <RechartsTooltip content={<CustomAreaTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                    <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                                    <Area type="monotone" dataKey="earned" name="Earned Points" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorEarned)" />
                                    <Area type="monotone" dataKey="redeemed" name="Redeemed Points" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorRedeemed)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* RIGHT: MEMBER ENGAGEMENT */}
                <div className="ls-panel" style={{ flex: 1 }}>
                    <div className="ls-panel-header">
                        <h2>Member Engagement</h2>
                    </div>
                    <div className="ls-panel-body flex-col-center" style={{ paddingBottom: '32px' }}>
                        {totalMembers === 0 ? (
                            <div className="ls-empty-text h-full flex-center">No members enrolled yet</div>
                        ) : (
                            <>
                                <div className="ls-donut-wrap">
                                    <ResponsiveContainer width="100%" height={200}>
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%" cy="50%"
                                                innerRadius={65} outerRadius={85}
                                                paddingAngle={2}
                                                dataKey="value" stroke="none"
                                            >
                                                {pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip content={<CustomPieTooltip />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="ls-donut-center">
                                        <div className="ls-dc-val">{totalMembers.toLocaleString()}</div>
                                        <div className="ls-dc-lbl">TOTAL MEMBERS</div>
                                    </div>
                                </div>
                                <div className="ls-engagement-stats">
                                    <div className="lses-item">
                                        <div className="lses-dot bg-success"></div>
                                        <div className="lses-info">
                                            <span className="lses-lbl">Active</span>
                                            <span className="lses-val">{activeMembers.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="lses-item">
                                        <div className="lses-dot bg-slate"></div>
                                        <div className="lses-info">
                                            <span className="lses-lbl">Inactive</span>
                                            <span className="lses-val">{inactiveMembers.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="lses-item" style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '16px' }}>
                                        <div className="lses-info">
                                            <span className="lses-lbl">Active %</span>
                                            <span className="lses-val text-success">{(activeRatio * 100).toFixed(0)}%</span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* 4 & 5. PROGRAM PERFORMANCE & TIER DISTRIBUTION */}
            <div className="ls-split-row">
                
                {/* LEFT: PROGRAM PERFORMANCE */}
                <div className="ls-panel" style={{ flex: 1.2 }}>
                    <div className="ls-panel-header">
                        <h2>Program Performance</h2>
                        <button className="ls-nav-btn" onClick={() => setActiveTab('programs')}>View All <ArrowRight size={14}/></button>
                    </div>
                    <div className="ls-panel-body">
                        {!programPerformance || programPerformance.length === 0 ? (
                            <div className="ls-empty-text">No active programs yet</div>
                        ) : (
                            <div className="ls-ranking-list">
                                {programPerformance.slice(0, 4).map((p, idx) => {
                                    const maxMembers = Math.max(...programPerformance.map(x => x.membersCount || 1));
                                    const pct = Math.min(100, ((p.membersCount || 0) / maxMembers) * 100);
                                    
                                    return (
                                        <div key={idx} className="ls-rank-row">
                                            <div className="lsrr-rank text-muted">0{idx + 1}</div>
                                            <div className="lsrr-icon"><Gift size={16} /></div>
                                            <div className="lsrr-main">
                                                <div className="lsrr-name">{p.ProgramName || p.programName}</div>
                                                <div className="lsrr-stats">{(p.MembersCount || p.membersCount || 0).toLocaleString()} Members</div>
                                                <div className="lsrr-bar-bg"><div className="lsrr-bar bg-blue" style={{ width: `${pct}%` }}></div></div>
                                            </div>
                                            <div className="lsrr-points">
                                                <div className="lsrp-earn"><span className="text-success">{p.PointsEarned || p.pointsEarned || 0}</span> earned</div>
                                                <div className="lsrp-redeem"><span className="text-amber">{p.PointsRedeemed || p.pointsRedeemed || 0}</span> redeemed</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT: TIER DISTRIBUTION */}
                <div className="ls-panel" style={{ flex: 1 }}>
                    <div className="ls-panel-header">
                        <h2>Tier Distribution</h2>
                    </div>
                    <div className="ls-panel-body">
                        {!tierDistribution || tierDistribution.length === 0 ? (
                            <div className="ls-empty-text">No tiers configured yet</div>
                        ) : (
                            <div className="ls-tier-list">
                                {tierDistribution.map((t, idx) => {
                                    const count = t.count || 0;
                                    const pct = totalMembers > 0 ? (count / totalMembers) * 100 : 0;
                                    return (
                                        <div key={idx} className="ls-tier-row">
                                            <div className="lstr-icon"><Trophy size={16} /></div>
                                            <div className="lstr-name">{t.tierName}</div>
                                            <div className="lstr-count">{count.toLocaleString()} <span className="text-muted">members</span></div>
                                            <div className="lstr-bar-wrap">
                                                <div className="lstr-bar-bg"><div className="lstr-bar bg-purple" style={{ width: `${pct}%` }}></div></div>
                                            </div>
                                            <div className="lstr-pct">{pct.toFixed(0)}%</div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* 6 & 7. REWARD INSIGHTS & LOYALTY HEALTH */}
            <div className="ls-split-row">
                
                {/* LEFT: REWARD INSIGHTS */}
                <div className="ls-panel" style={{ flex: 1 }}>
                    <div className="ls-panel-header">
                        <h2>Reward Insights</h2>
                    </div>
                    <div className="ls-panel-body">
                        <div className="ls-reward-insight">
                            <div className="lri-top">
                                <div className="lri-rate-circle">
                                    <svg viewBox="0 0 36 36" className="circular-chart">
                                        <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                        <path className="circle" strokeDasharray={`${redemptionRate}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                    </svg>
                                    <div className="lri-rate-val">{redemptionRate}%</div>
                                </div>
                                <div className="lri-metrics">
                                    <div className="lri-metric">
                                        <span className="lrim-lbl">Total Earned</span>
                                        <span className="lrim-val text-success">{(kpis?.pointsEarnedAllTime || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="lri-metric mt-2">
                                        <span className="lrim-lbl">Total Redeemed</span>
                                        <span className="lrim-val text-amber">{(kpis?.pointsRedeemedAllTime || 0).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="lri-bottom">
                                <div className="lri-bar-compare">
                                    <div className="lri-bc-seg bg-success" style={{ width: `${Math.max(10, 100 - redemptionRate)}%` }}></div>
                                    <div className="lri-bc-seg bg-amber" style={{ width: `${Math.max(10, redemptionRate)}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: LOYALTY HEALTH */}
                <div className="ls-panel" style={{ flex: 1 }}>
                    <div className="ls-panel-header">
                        <h2>Loyalty Health</h2>
                    </div>
                    <div className="ls-panel-body">
                        {allHealthy ? (
                            <div className="ls-empty-positive h-full flex-col-center">
                                <CheckCircle2 size={32} className="text-success mb-3" />
                                <h3>Loyalty Program Healthy</h3>
                                <p className="text-muted text-sm mt-1">All engagement and configuration metrics are optimal.</p>
                            </div>
                        ) : (
                            <div className="ls-health-grid">
                                {healthIndicators.map((hi, idx) => (
                                    <div key={idx} className="ls-health-item">
                                        <div className="lshi-top">
                                            <span className="lshi-lbl">{hi.label}</span>
                                            {hi.status === 'healthy' && <div className="lshi-status text-success bg-success-dim">Healthy</div>}
                                            {hi.status === 'attention' && <div className="lshi-status text-amber bg-amber-dim">Attention</div>}
                                            {hi.status === 'critical' && <div className="lshi-status text-error bg-error-dim">Critical</div>}
                                        </div>
                                        <div className="lshi-desc">{hi.desc}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* 8. RECENT ACTIVITY */}
            <div className="ls-section">
                <div className="ls-panel">
                    <div className="ls-panel-header">
                        <h2>Recent Activity</h2>
                        <button className="ls-nav-btn" onClick={() => setActiveTab('transactions')}>View All <ArrowRight size={14}/></button>
                    </div>
                    <div className="ls-panel-body">
                        {!recentActivity || recentActivity.length === 0 ? (
                            <div className="ls-empty-text">No loyalty activity yet</div>
                        ) : (
                            <div className="ls-timeline">
                                {recentActivity.slice(0, 6).map((t, idx) => {
                                    const isEarned = t.transactionType === 'Earned';
                                    const isRedeemed = t.transactionType === 'Redeemed';
                                    
                                    return (
                                        <div key={idx} className="ls-tl-item">
                                            <div className={`ls-tl-icon ${isEarned ? 'bg-success-dim text-success' : isRedeemed ? 'bg-amber-dim text-amber' : 'bg-blue-dim text-info'}`}>
                                                {isEarned ? <ArrowUpRight size={14}/> : isRedeemed ? <ArrowDownRight size={14}/> : <Activity size={14}/>}
                                            </div>
                                            <div className="ls-tl-content">
                                                <div className="lstc-main">
                                                    <span className="font-semibold text-main">{t.customerName || 'Customer'}</span>
                                                    <span className="text-muted mx-2">{isEarned ? 'earned' : isRedeemed ? 'redeemed' : 'processed'}</span>
                                                    {t.points ? (
                                                        <span className={`font-mono font-bold ${isEarned ? 'text-success' : isRedeemed ? 'text-amber' : 'text-main'}`}>
                                                            {isEarned ? '+' : isRedeemed ? '-' : ''}{t.points.toLocaleString()} pts
                                                        </span>
                                                    ) : null}
                                                    {t.programName && (
                                                        <>
                                                            <span className="text-muted mx-2">in</span>
                                                            <span className="font-medium text-main">{t.programName}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="ls-tl-time text-muted font-mono text-xs">
                                                {t.transactionDate ? new Date(t.transactionDate).toLocaleString() : 'Just now'}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
};

export default DashboardTab;
