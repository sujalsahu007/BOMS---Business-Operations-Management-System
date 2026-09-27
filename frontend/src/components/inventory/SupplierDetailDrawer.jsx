import React, { useState, useEffect } from 'react';
import { X, Building2, Phone, Mail, MapPin, Hash, Package, ShoppingCart, User, Clock, FileText, ChevronRight } from 'lucide-react';
import { suppliersApi, activityApi } from '../../services/api';
import SharedDrawer from '../shared/SharedDrawer';
import './InventoryDrawers.css';

const SupplierDetailDrawer = ({ supplierId, onClose }) => {
    const [supplier, setSupplier] = useState(null);
    const [activities, setActivities] = useState([]);
    const [activeSection, setActiveSection] = useState('overview'); // 'overview', 'orders', 'products', 'activity'
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (supplierId) {
            loadData();
        }
    }, [supplierId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [supRes, actRes] = await Promise.all([
                suppliersApi.getById(supplierId),
                activityApi.getForEntity('Supplier', supplierId)
            ]);
            
            setSupplier(supRes.data);
            setActivities(actRes.data || []);
        } catch (err) {
            console.error("Failed to load supplier details:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <SharedDrawer isOpen={true} onClose={onClose} title="Loading Supplier..." icon={Building2}>
                <div className="inventory-drawer-content p-6">
                    <div className="skeleton h-32 w-full mb-6 rounded-lg"></div>
                    <div className="flex gap-4 mb-6">
                        <div className="skeleton h-10 w-24"></div>
                        <div className="skeleton h-10 w-32"></div>
                        <div className="skeleton h-10 w-24"></div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="skeleton h-40 w-full rounded-lg"></div>
                        <div className="skeleton h-40 w-full rounded-lg"></div>
                        <div className="skeleton h-40 w-full rounded-lg"></div>
                        <div className="skeleton h-40 w-full rounded-lg"></div>
                    </div>
                </div>
            </SharedDrawer>
        );
    }

    if (!supplier) return null;

    return (
        <SharedDrawer
            isOpen={true}
            onClose={onClose}
            title={supplier.supplierName}
            subtitle={
                <div className="subtitle-group" style={{display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px'}}>
                    <span className="code-badge" style={{background: 'var(--surface-highlight)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontFamily: 'monospace'}}>{supplier.supplierCode}</span>
                    <span className={`status-badge ${supplier.status?.toLowerCase()}`}>
                        {supplier.status}
                    </span>
                </div>
            }
            icon={Building2}
        >
            <div className="inventory-drawer-content" style={{ padding: 0 }}>
                {/* Premium Detail Header Tabs */}
                <div className="detail-drawer-header" style={{padding: '0 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--surface-color)'}}>
                    <div className="section-tabs" style={{display: 'flex', gap: '24px', borderBottom: 'none'}}>
                        <button 
                            className={activeSection === 'overview' ? 'active' : ''} 
                            onClick={() => setActiveSection('overview')}
                            style={{padding: '12px 0', background: 'none', border: 'none', borderBottom: activeSection === 'overview' ? '2px solid var(--primary-color)' : '2px solid transparent', color: activeSection === 'overview' ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s'}}
                        >
                            <FileText size={16} /> Overview
                        </button>
                        <button 
                            className={activeSection === 'orders' ? 'active' : ''} 
                            onClick={() => setActiveSection('orders')}
                            style={{padding: '12px 0', background: 'none', border: 'none', borderBottom: activeSection === 'orders' ? '2px solid var(--primary-color)' : '2px solid transparent', color: activeSection === 'orders' ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s'}}
                        >
                            <ShoppingCart size={16} /> Purchase History
                        </button>
                        <button 
                            className={activeSection === 'products' ? 'active' : ''} 
                            onClick={() => setActiveSection('products')}
                            style={{padding: '12px 0', background: 'none', border: 'none', borderBottom: activeSection === 'products' ? '2px solid var(--primary-color)' : '2px solid transparent', color: activeSection === 'products' ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s'}}
                        >
                            <Package size={16} /> Products
                        </button>
                        <button 
                            className={activeSection === 'activity' ? 'active' : ''} 
                            onClick={() => setActiveSection('activity')}
                            style={{padding: '12px 0', background: 'none', border: 'none', borderBottom: activeSection === 'activity' ? '2px solid var(--primary-color)' : '2px solid transparent', color: activeSection === 'activity' ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s'}}
                        >
                            <Clock size={16} /> Activity
                        </button>
                    </div>
                </div>

                <div className="inventory-drawer-content" style={{background: 'var(--bg-gradient)', padding: 0}}>
                    <div className="detail-view">
                        
                        {/* Tab Content */}
                        <div className="section-content" style={{padding: '24px'}}>
                            {activeSection === 'overview' && (
                                <div className="overview-grid" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px'}}>
                                    
                                    {/* Business Information */}
                                    <div className="info-card" style={{background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '20px'}}>
                                        <div className="card-header" style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-main)'}}>
                                            <Building2 size={16} className="text-slate-400" />
                                            <h3 style={{margin: 0, fontSize: '0.95rem', fontWeight: '600'}}>Business Information</h3>
                                        </div>
                                        <div className="card-body" style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                                            <div className="info-row" style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                                                <span className="info-label" style={{fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Supplier Name</span>
                                                <span className="info-value font-medium" style={{color: 'var(--text-main)'}}>{supplier.supplierName}</span>
                                            </div>
                                            <div className="info-row" style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                                                <span className="info-label" style={{fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Supplier Code</span>
                                                <span className="info-value font-mono text-sm" style={{color: 'var(--text-main)'}}>{supplier.supplierCode}</span>
                                            </div>
                                            <div className="info-row" style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                                                <span className="info-label" style={{fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Current Status</span>
                                                <span className="info-value">
                                                    <span className={`status-badge ${supplier.status?.toLowerCase()}`}>
                                                        {supplier.status}
                                                    </span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Primary Contact */}
                                    <div className="info-card" style={{background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '20px'}}>
                                        <div className="card-header" style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-main)'}}>
                                            <User size={16} className="text-slate-400" />
                                            <h3 style={{margin: 0, fontSize: '0.95rem', fontWeight: '600'}}>Primary Contact</h3>
                                        </div>
                                        <div className="card-body" style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                                            <div className="info-row" style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                                                <span className="info-label" style={{fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Contact Person</span>
                                                <span className="info-value" style={{color: 'var(--text-main)'}}>{supplier.contactPerson || <span style={{color: 'var(--text-muted)'}}>Not provided</span>}</span>
                                            </div>
                                            <div className="info-row" style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                                                <span className="info-label" style={{fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Email Address</span>
                                                <span className="info-value">
                                                    {supplier.email ? (
                                                        <a href={`mailto:${supplier.email}`} style={{color: 'var(--primary-color)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px'}}>
                                                            {supplier.email}
                                                        </a>
                                                    ) : <span style={{color: 'var(--text-muted)'}}>Not provided</span>}
                                                </span>
                                            </div>
                                            <div className="info-row" style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                                                <span className="info-label" style={{fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Phone Number</span>
                                                <span className="info-value" style={{color: 'var(--text-main)'}}>{supplier.phone || <span style={{color: 'var(--text-muted)'}}>Not provided</span>}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Address Details */}
                                    <div className="info-card" style={{background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '20px'}}>
                                        <div className="card-header" style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-main)'}}>
                                            <MapPin size={16} className="text-slate-400" />
                                            <h3 style={{margin: 0, fontSize: '0.95rem', fontWeight: '600'}}>Address Details</h3>
                                        </div>
                                        <div className="card-body" style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                                            <div className="info-row full" style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                                                <span className="info-label" style={{fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Street Address</span>
                                                <span className="info-value" style={{color: 'var(--text-main)'}}>{supplier.address || <span style={{color: 'var(--text-muted)'}}>Not provided</span>}</span>
                                            </div>
                                            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px'}}>
                                                <div className="info-row" style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                                                    <span className="info-label" style={{fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em'}}>City</span>
                                                    <span className="info-value" style={{color: 'var(--text-main)'}}>{supplier.city || <span style={{color: 'var(--text-muted)'}}>-</span>}</span>
                                                </div>
                                                <div className="info-row" style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                                                    <span className="info-label" style={{fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em'}}>State / Province</span>
                                                    <span className="info-value" style={{color: 'var(--text-main)'}}>{supplier.state || <span style={{color: 'var(--text-muted)'}}>-</span>}</span>
                                                </div>
                                            </div>
                                            <div className="info-row" style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                                                <span className="info-label" style={{fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Country</span>
                                                <span className="info-value" style={{color: 'var(--text-main)'}}>{supplier.country || <span style={{color: 'var(--text-muted)'}}>-</span>}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tax Information */}
                                    <div className="info-card" style={{background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '20px'}}>
                                        <div className="card-header" style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-main)'}}>
                                            <Hash size={16} className="text-slate-400" />
                                            <h3 style={{margin: 0, fontSize: '0.95rem', fontWeight: '600'}}>Tax Information</h3>
                                        </div>
                                        <div className="card-body" style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                                            <div className="info-row full" style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                                                <span className="info-label" style={{fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Tax Number (VAT/EIN)</span>
                                                <span className="info-value font-mono" style={{background: 'var(--surface-highlight)', padding: '4px 8px', borderRadius: '6px', display: 'inline-block', width: 'fit-content', color: 'var(--text-main)'}}>
                                                    {supplier.taxNumber || 'Not registered'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            )}

                            {activeSection === 'products' && (
                                <div className="premium-empty-state" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', textAlign: 'center'}}>
                                    <div className="icon-wrapper" style={{background: 'var(--surface-highlight)', padding: '24px', borderRadius: '50%', marginBottom: '24px'}}>
                                        <Package size={48} style={{color: 'var(--text-muted)'}} />
                                    </div>
                                    <h4 style={{fontSize: '1.1rem', margin: '0 0 8px 0', color: 'var(--text-main)'}}>No Product Relationships</h4>
                                    <p style={{color: 'var(--text-muted)', maxWidth: '400px'}}>This supplier has not been linked to any products in your catalog yet.</p>
                                </div>
                            )}

                            {activeSection === 'orders' && (
                                <div className="premium-empty-state" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', textAlign: 'center'}}>
                                    <div className="icon-wrapper" style={{background: 'var(--surface-highlight)', padding: '24px', borderRadius: '50%', marginBottom: '24px'}}>
                                        <ShoppingCart size={48} style={{color: 'var(--text-muted)'}} />
                                    </div>
                                    <h4 style={{fontSize: '1.1rem', margin: '0 0 8px 0', color: 'var(--text-main)'}}>No Purchase History</h4>
                                    <p style={{color: 'var(--text-muted)', maxWidth: '400px'}}>There are no recorded purchase orders for this supplier in the system.</p>
                                </div>
                            )}

                            {activeSection === 'activity' && (
                                <div className="premium-timeline">
                                    {activities.length === 0 ? (
                                        <div className="premium-empty-state" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', textAlign: 'center'}}>
                                            <div className="icon-wrapper" style={{background: 'var(--surface-highlight)', padding: '24px', borderRadius: '50%', marginBottom: '24px'}}>
                                                <Clock size={48} style={{color: 'var(--text-muted)'}} />
                                            </div>
                                            <h4 style={{fontSize: '1.1rem', margin: '0 0 8px 0', color: 'var(--text-main)'}}>No Activity Recorded</h4>
                                            <p style={{color: 'var(--text-muted)', maxWidth: '400px'}}>There is no audit history available for this supplier.</p>
                                        </div>
                                    ) : (
                                        <div className="timeline-container" style={{position: 'relative', paddingLeft: '24px'}}>
                                            <div style={{position: 'absolute', left: '7px', top: '0', bottom: '0', width: '2px', background: 'var(--border-color)'}}></div>
                                            {activities.map((act, idx) => (
                                                <div key={act.activityId} className="timeline-item" style={{position: 'relative', marginBottom: '24px'}}>
                                                    <div className="timeline-dot" style={{position: 'absolute', left: '-24px', top: '4px', width: '16px', height: '16px', borderRadius: '50%', background: 'var(--surface-color)', border: '2px solid var(--primary-color)'}}></div>
                                                    <div className="timeline-content-box" style={{background: 'var(--surface-color)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)'}}>
                                                        <div className="timeline-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px'}}>
                                                            <span className="timeline-user" style={{display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500', color: 'var(--text-main)'}}>
                                                                <User size={14} className="text-slate-400" /> {act.userName}
                                                            </span>
                                                            <span className="timeline-time" style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>
                                                                {new Date(act.timestamp).toLocaleString(undefined, {
                                                                    month: 'short', day: 'numeric', year: 'numeric',
                                                                    hour: '2-digit', minute: '2-digit'
                                                                })}
                                                            </span>
                                                        </div>
                                                        <div className="timeline-desc" style={{color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5'}}>{act.description}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </SharedDrawer>
    );
};

export default SupplierDetailDrawer;
