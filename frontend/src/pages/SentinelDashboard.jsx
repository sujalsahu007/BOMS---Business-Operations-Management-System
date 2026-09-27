import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ShieldAlert, ShieldCheck, Radar, RefreshCw, Search, ArrowRight, CheckCircle2 } from 'lucide-react';
import { sentinelApi } from '../services/api';
import '../components/sentinel/Sentinel.css';

const SentinelDashboard = () => {
    const navigate = useNavigate();
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    
    // Filters
    const [severityFilter, setSeverityFilter] = useState('All');
    const [moduleFilter, setModuleFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    const fetchDashboard = async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);
            
            const res = await sentinelApi.getDashboard();
            setDashboard(res.data);
            setError(null);
        } catch (err) {
            console.error(err);
            setError("Unable to load Sentinel findings.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, []);

    const handleAcknowledge = async (id) => {
        try {
            await sentinelApi.acknowledge(id);
            // Optimistic UI update
            const updateFindings = (findings) => findings.filter(f => f.id !== id);
            setDashboard(prev => ({
                ...prev,
                immediateAttention: updateFindings(prev.immediateAttention),
                otherItems: updateFindings(prev.otherItems)
            }));
        } catch (err) {
            console.error("Failed to acknowledge", err);
        }
    };

    if (loading) {
        return (
            <div className="sentinel-page">
                <div className="sentinel-empty" style={{ border: 'none' }}>
                    <RefreshCw size={48} className="spin" style={{ animation: 'spin 1s linear infinite', color: 'var(--primary-color)' }} />
                    <p>Loading Sentinel Intelligence...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="sentinel-page">
                <div className="sentinel-empty">
                    <ShieldAlert size={48} style={{ color: 'var(--danger-color)' }} />
                    <h3>{error}</h3>
                    <button className="btn-action btn-primary" onClick={() => fetchDashboard()}>Retry</button>
                </div>
            </div>
        );
    }

    const { immediateAttention = [], otherItems = [], severityCounts, lastScanned } = dashboard;
    
    // Calculate current status
    const criticalCount = severityCounts?.Critical || 0;
    const highCount = severityCounts?.High || 0;
    const totalCount = (severityCounts?.Critical || 0) + (severityCounts?.High || 0) + (severityCounts?.Medium || 0) + (severityCounts?.Low || 0);
    
    let statusClass = "status-all-clear";
    let StatusIcon = ShieldCheck;
    let statusTitle = "All Clear";
    let statusDesc = "Sentinel is monitoring your BOMS data.";

    if (criticalCount > 0) {
        statusClass = "status-critical";
        StatusIcon = ShieldAlert;
        statusTitle = "Critical Attention Required";
        statusDesc = "Sentinel has detected critical operational issues.";
    } else if (totalCount > 0) {
        statusClass = "status-attention";
        StatusIcon = Shield;
        statusTitle = "Attention Required";
        statusDesc = "Sentinel is actively monitoring your business data.";
    }

    const filterFindings = (list) => {
        return list.filter(f => {
            const matchSeverity = severityFilter === 'All' || f.severity === severityFilter;
            const matchModule = moduleFilter === 'All' || f.module === moduleFilter;
            const matchSearch = !searchQuery || f.title.toLowerCase().includes(searchQuery.toLowerCase()) || f.description.toLowerCase().includes(searchQuery.toLowerCase());
            return matchSeverity && matchModule && matchSearch;
        });
    };

    const filteredImmediate = filterFindings(immediateAttention);
    const filteredOther = filterFindings(otherItems);
    const totalVisible = filteredImmediate.length + filteredOther.length;

    const FindingCard = ({ finding }) => (
        <div className={`finding-card severity-${finding.severity.toLowerCase()}`}>
            <div className="finding-header">
                <div className="finding-meta">
                    <span className={`meta-severity ${finding.severity.toLowerCase()}`}>
                        {finding.severity === 'Critical' && '🔴 '}
                        {finding.severity === 'High' && '🟠 '}
                        {finding.severity === 'Medium' && '🟡 '}
                        {finding.severity === 'Low' && '🔵 '}
                        {finding.severity}
                    </span>
                    <span className="meta-module">· {finding.module.toUpperCase()}</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(finding.detectedAt).toLocaleDateString()}
                </span>
            </div>
            <h4 className="finding-title">{finding.title}</h4>
            <p className="finding-desc">{finding.description}</p>
            
            {finding.metric && (
                <div className="finding-metric">
                    {finding.metric}
                </div>
            )}

            <div className="finding-actions">
                <button 
                    className="btn-action btn-secondary"
                    onClick={() => handleAcknowledge(finding.id)}
                >
                    Acknowledge
                </button>
                {finding.primaryAction?.url && (
                    <button 
                        className="btn-action btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => navigate(finding.primaryAction.url)}
                    >
                        {finding.primaryAction.label} <ArrowRight size={14} />
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <div className="sentinel-page">
            <header className="sentinel-header">
                <div className="sentinel-title-area">
                    <h1 className="sentinel-title"><Radar size={28} color="var(--primary-color)" /> BOMS Sentinel</h1>
                    <p className="sentinel-subtitle">Identify what needs attention across your business.</p>
                </div>
                <div className="sentinel-actions">
                    <span className="last-scanned">Last scanned: {new Date(lastScanned).toLocaleTimeString()}</span>
                    <button 
                        className={`btn-refresh ${refreshing ? 'loading' : ''}`}
                        onClick={() => fetchDashboard(true)}
                        disabled={refreshing}
                    >
                        <RefreshCw size={16} /> Refresh
                    </button>
                </div>
            </header>

            <div className={`sentinel-status-area ${statusClass}`}>
                <div className="status-main">
                    <div className="status-icon-wrapper">
                        <StatusIcon size={32} />
                    </div>
                    <div className="status-text">
                        <h2>{totalCount > 0 ? `${totalCount} items require your attention` : statusTitle}</h2>
                        <p>{statusDesc}</p>
                    </div>
                </div>
                {totalCount > 0 && (
                    <div className="status-metrics">
                        {['Critical', 'High', 'Medium', 'Low'].map(sev => (
                            <div key={sev} className="metric-item">
                                <span className="metric-value">{severityCounts[sev] || 0}</span>
                                <span className="metric-label">{sev}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {totalCount > 0 && (
                <div className="distribution-bar">
                    {['Critical', 'High', 'Medium', 'Low'].map(sev => {
                        const count = severityCounts[sev] || 0;
                        if (count === 0) return null;
                        const percentage = (count / totalCount) * 100;
                        return (
                            <div 
                                key={sev} 
                                className={`dist-segment dist-${sev.toLowerCase()}`} 
                                style={{ width: `${percentage}%` }}
                                title={`${sev}: ${count}`}
                            />
                        );
                    })}
                </div>
            )}

            <div className="sentinel-toolbar">
                <div className="sentinel-search">
                    <Search size={16} />
                    <input 
                        type="text" 
                        placeholder="Search Sentinel findings..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <select className="sentinel-filter" value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}>
                    <option value="All">All Severities</option>
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                </select>
                <select className="sentinel-filter" value={moduleFilter} onChange={e => setModuleFilter(e.target.value)}>
                    <option value="All">All Modules</option>
                    <option value="Inventory">Inventory</option>
                    <option value="Contracts">Contracts</option>
                    <option value="Loyalty">Customer Loyalty</option>
                </select>
            </div>

            {totalVisible === 0 && totalCount > 0 ? (
                <div className="sentinel-empty" style={{ height: '200px' }}>
                    <p>No findings match your filters.</p>
                </div>
            ) : null}

            {totalCount === 0 ? (
                <div className="sentinel-empty">
                    <ShieldCheck size={64} />
                    <h3>All Clear</h3>
                    <p>No issues currently require your attention.</p>
                </div>
            ) : (
                <>
                    {filteredImmediate.length > 0 && (
                        <div className="sentinel-section">
                            <h3 className="section-title"><ShieldAlert size={20} color="var(--danger-color)"/> Immediate Attention</h3>
                            <div className="finding-grid">
                                {filteredImmediate.map(f => <FindingCard key={f.id} finding={f} />)}
                            </div>
                        </div>
                    )}
                    
                    {filteredOther.length > 0 && (
                        <div className="sentinel-section">
                            <h3 className="section-title">
                                {filteredImmediate.length > 0 ? "Other Items" : "Current Attention"}
                            </h3>
                            <div className="finding-grid">
                                {filteredOther.map(f => <FindingCard key={f.id} finding={f} />)}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default SentinelDashboard;
