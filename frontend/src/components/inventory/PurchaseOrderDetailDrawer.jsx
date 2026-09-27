import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, User, Building2, MapPin, Package, Calendar, Clock, CheckCircle, XCircle, AlertCircle, Send, Ban, ChevronRight } from 'lucide-react';
import { purchaseOrdersApi, activityApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import SharedDrawer from '../shared/SharedDrawer';
import './InventoryDrawers.css';

const PurchaseOrderDetailDrawer = ({ poId, onClose, onUpdate }) => {
    const { currentUser } = useAuth();
    
    const hasPermission = (permissionCode) => {
        if (!permissionCode) return true;
        return currentUser?.permissions?.includes(permissionCode);
    };
    const [po, setPo] = useState(null);
    const [activities, setActivities] = useState([]);
    const [activeSection, setActiveSection] = useState('overview'); // overview, items, approval, receiving, timeline
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    
    // Approval state
    const [approvalReason, setApprovalReason] = useState('');
    const [showRejectInput, setShowRejectInput] = useState(false);

    useEffect(() => {
        if (poId) {
            loadData();
        }
    }, [poId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [poRes, actResWithNumber] = await Promise.all([
                purchaseOrdersApi.getById(poId),
                purchaseOrdersApi.getById(poId).then(res => activityApi.getForEntity('PurchaseOrder', res.data.poNumber))
            ]);
            
            setPo(poRes.data);
            setActivities(actResWithNumber.data || []);
            
        } catch (err) {
            console.error("Failed to load PO details:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (actionFn, successMessage) => {
        setActionLoading(true);
        try {
            await actionFn();
            alert(successMessage);
            await loadData();
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error("Action failed:", error);
            alert(error.response?.data?.Message || error.message);
        } finally {
            setActionLoading(false);
            setShowRejectInput(false);
        }
    };

    const submitForApproval = () => handleAction(() => purchaseOrdersApi.submit(poId), "Purchase order submitted for approval.");
    const approvePO = () => handleAction(() => purchaseOrdersApi.approve(poId, { action: 'Approve' }), "Purchase order approved successfully.");
    const cancelPO = () => handleAction(() => purchaseOrdersApi.cancel(poId), "Purchase order cancelled.");
    
    const rejectPO = () => {
        if (!approvalReason.trim()) {
            alert("A rejection reason is required.");
            return;
        }
        handleAction(() => purchaseOrdersApi.reject(poId, { action: 'Reject', comment: approvalReason }), "Purchase order rejected.");
    };

    // Helper for formatting currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    if (loading) {
        return (
            <SharedDrawer isOpen={true} onClose={onClose} title="Loading PO..." icon={ShoppingCart} width="1000px">
                <div className="inventory-drawer-content p-6 flex items-center justify-center">
                    <div className="spinning"><ShoppingCart size={32} className="text-slate-300" /></div>
                </div>
            </SharedDrawer>
        );
    }

    if (!po) return null;

    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'approved': return 'active';
            case 'pending approval': return 'warning';
            case 'rejected': return 'inactive';
            case 'draft': return 'neutral';
            case 'cancelled': return 'inactive';
            case 'ordered': return 'active';
            case 'partially received': return 'warning';
            case 'fully received': return 'active';
            default: return 'neutral';
        }
    };

    const renderLifecycle = () => {
        const stages = [
            { id: 'Draft', label: 'Draft' },
            { id: 'Pending Approval', label: 'Pending Approval' },
            { id: 'Approved', label: 'Approved' },
            { id: 'Ordered', label: 'Ordered' },
            { id: 'Partially Received', label: 'Receiving' },
            { id: 'Fully Received', label: 'Received' }
        ];

        let currentStageIndex = stages.findIndex(s => s.id === po.status);
        
        // Handle terminal states outside the happy path
        if (po.status === 'Rejected' || po.status === 'Cancelled') {
            return (
                <div style={{display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '20px'}}>
                    <Ban size={18} className="text-red-500" />
                    <span style={{fontWeight: '500', color: '#ef4444'}}>Purchase Order {po.status}</span>
                </div>
            );
        }

        if (currentStageIndex === -1) currentStageIndex = 0; // Fallback

        return (
            <div className="po-lifecycle" style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '20px'}}>
                {stages.map((stage, idx) => {
                    const isCompleted = idx < currentStageIndex;
                    const isCurrent = idx === currentStageIndex;
                    
                    return (
                        <React.Fragment key={stage.id}>
                            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 2, flex: 1}}>
                                <div style={{
                                    width: '24px', height: '24px', borderRadius: '50%', 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: isCompleted ? 'var(--primary-color)' : isCurrent ? 'var(--primary-color)' : 'var(--surface-color)',
                                    border: isCompleted || isCurrent ? 'none' : '2px solid var(--border-color)',
                                    color: isCompleted ? 'white' : isCurrent ? 'white' : 'var(--text-muted)'
                                }}>
                                    {isCompleted ? <CheckCircle size={14} /> : <span style={{fontSize: '0.75rem', fontWeight: 'bold'}}>{idx + 1}</span>}
                                </div>
                                <span style={{fontSize: '0.75rem', fontWeight: isCurrent ? '600' : '500', color: isCurrent ? 'var(--primary-color)' : 'var(--text-muted)'}}>
                                    {stage.label}
                                </span>
                            </div>
                            {idx < stages.length - 1 && (
                                <div style={{height: '2px', flex: 2, background: idx < currentStageIndex ? 'var(--primary-color)' : 'var(--border-color)', margin: '0 -10%'}} />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        );
    };

    const footer = (
        <div className="drawer-footer-actions" style={{display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: '1rem'}}>
            <button className="btn-secondary" onClick={onClose} disabled={actionLoading}>Close</button>
            
            <div style={{display: 'flex', gap: '12px'}}>
                {(po.status === 'Draft' || po.status === 'Pending Approval' || po.status === 'Approved') && hasPermission('Inventory.Edit') && (
                    <button className="btn-secondary" onClick={cancelPO} disabled={actionLoading} style={{color: '#ef4444', borderColor: '#ef4444', background: 'transparent'}}>
                        Cancel PO
                    </button>
                )}
                
                {po.status === 'Pending Approval' && hasPermission('Inventory.Approve') && (
                    <>
                        <div style={{position: 'relative'}}>
                            <button className="btn-secondary" onClick={() => setShowRejectInput(!showRejectInput)} disabled={actionLoading} style={{color: '#ef4444', borderColor: '#ef4444', background: 'rgba(239, 68, 68, 0.1)'}}>
                                <XCircle size={16} /> Reject
                            </button>
                            
                            {showRejectInput && (
                                <div style={{position: 'absolute', bottom: 'calc(100% + 12px)', right: 0, background: 'var(--surface-color)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)', width: '300px', zIndex: 20}}>
                                    <label style={{display: 'block', marginBottom: '8px', color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: '500'}}>Rejection Reason *</label>
                                    <input 
                                        type="text" 
                                        autoFocus
                                        value={approvalReason}
                                        onChange={(e) => setApprovalReason(e.target.value)}
                                        placeholder="Explain why..."
                                        style={{width: '100%', background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', padding: '8px', borderRadius: '6px', marginBottom: '12px', fontSize: '0.85rem'}}
                                    />
                                    <div style={{display: 'flex', justifyContent: 'flex-end', gap: '8px'}}>
                                        <button className="btn-secondary" onClick={() => setShowRejectInput(false)} style={{padding: '4px 10px', fontSize: '0.8rem'}}>Cancel</button>
                                        <button className="btn-primary" onClick={rejectPO} disabled={actionLoading || !approvalReason.trim()} style={{background: '#ef4444', border: 'none', padding: '4px 10px', fontSize: '0.8rem'}}>
                                            Confirm Rejection
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <button className="btn-primary" onClick={approvePO} disabled={actionLoading} style={{background: '#10b981', border: 'none'}}>
                            <CheckCircle size={16} /> Approve
                        </button>
                    </>
                )}

                {po.status === 'Draft' && hasPermission('Inventory.Edit') && (
                    <button className="btn-primary" onClick={submitForApproval} disabled={actionLoading}>
                        {actionLoading ? 'Submitting...' : <><Send size={16} /> Submit for Approval</>}
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <SharedDrawer
            isOpen={true}
            onClose={onClose}
            title={po.poNumber}
            subtitle={
                <div className="subtitle-group" style={{display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px'}}>
                    <span className={`status-badge ${getStatusBadge(po.status)}`} style={{padding: '2px 8px', fontSize: '0.75rem'}}>{po.status}</span>
                    {po.status !== 'Draft' && po.status !== 'Cancelled' && (
                        <span className={`status-badge ${getStatusBadge(po.approvalStatus)}`} style={{padding: '2px 8px', fontSize: '0.75rem'}}>Approval: {po.approvalStatus}</span>
                    )}
                </div>
            }
            icon={ShoppingCart}
            width="1000px"
            footer={footer}
        >
            <div className="inventory-drawer-content" style={{ padding: 0 }}>
                {/* Premium Header - Tabs */}
                <div className="detail-drawer-header" style={{padding: '0 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--surface-color)'}}>

                    <div className="section-tabs" style={{display: 'flex', gap: '24px', borderBottom: 'none'}}>
                        <button className={activeSection === 'overview' ? 'active' : ''} onClick={() => setActiveSection('overview')}>
                            Overview
                        </button>
                        <button className={activeSection === 'items' ? 'active' : ''} onClick={() => setActiveSection('items')}>
                            Items <span style={{background: 'var(--surface-highlight)', padding: '2px 6px', borderRadius: '10px', fontSize: '0.7rem', marginLeft: '4px'}}>{po.items.length}</span>
                        </button>
                        <button className={activeSection === 'approval' ? 'active' : ''} onClick={() => setActiveSection('approval')}>
                            Approval
                        </button>
                        <button className={activeSection === 'receiving' ? 'active' : ''} onClick={() => setActiveSection('receiving')}>
                            Receiving
                        </button>
                        <button className={activeSection === 'timeline' ? 'active' : ''} onClick={() => setActiveSection('timeline')}>
                            Timeline
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="inventory-drawer-content" style={{background: 'var(--bg-main)', flex: 1, overflowY: 'auto', padding: '24px'}}>
                    
                    {/* Lifecycle Visualizer */}
                    {renderLifecycle()}

                    <div className="section-content">
                        {activeSection === 'overview' && (
                            <div className="overview-grid" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
                                
                                <div className="info-card" style={{background: 'var(--surface-color)', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '16px'}}>
                                    <div className="card-header" style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--text-main)'}}>
                                        <Building2 size={16} className="text-slate-400" />
                                        <h3 style={{margin: 0, fontSize: '0.9rem', fontWeight: '600'}}>Vendor & Delivery</h3>
                                    </div>
                                    <div className="card-body" style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                                        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
                                            <div className="info-row" style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                                                <span className="info-label" style={{fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase'}}>Supplier</span>
                                                <span className="info-value font-medium" style={{color: 'var(--text-main)', fontSize: '0.9rem'}}>{po.supplierName}</span>
                                                <span style={{fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace'}}>{po.supplierCode}</span>
                                            </div>
                                            <div className="info-row" style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                                                <span className="info-label" style={{fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase'}}>Warehouse</span>
                                                <span className="info-value font-medium" style={{color: 'var(--text-main)', fontSize: '0.9rem'}}>{po.warehouseCode}</span>
                                            </div>
                                            <div className="info-row" style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                                                <span className="info-label" style={{fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase'}}>Expected Delivery</span>
                                                <span className="info-value" style={{color: 'var(--text-main)', fontSize: '0.9rem'}}>{po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString() : 'Not Set'}</span>
                                            </div>
                                            <div className="info-row" style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                                                <span className="info-label" style={{fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase'}}>Order Date</span>
                                                <span className="info-value" style={{color: 'var(--text-main)', fontSize: '0.9rem'}}>{new Date(po.orderDate).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        
                                        {po.remarks && (
                                            <div className="info-row mt-2 pt-3 border-t border-slate-100" style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                                                <span className="info-label" style={{fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase'}}>Remarks</span>
                                                <span className="info-value" style={{color: 'var(--text-main)', fontSize: '0.85rem', whiteSpace: 'pre-wrap'}}>{po.remarks}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
                                    <div className="info-card" style={{background: 'var(--surface-color)', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '16px'}}>
                                        <div className="card-header" style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--text-main)'}}>
                                            <AlertCircle size={16} className="text-slate-400" />
                                            <h3 style={{margin: 0, fontSize: '0.9rem', fontWeight: '600'}}>Financial Summary</h3>
                                        </div>
                                        <div className="card-body" style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                                            <div style={{display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.9rem'}}>
                                                <span>Subtotal</span>
                                                <span>{formatCurrency(po.subtotal)}</span>
                                            </div>
                                            <div style={{display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.9rem'}}>
                                                <span>Discount</span>
                                                <span>-{formatCurrency(po.discount)}</span>
                                            </div>
                                            <div style={{display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.9rem'}}>
                                                <span>Tax</span>
                                                <span>{formatCurrency(po.tax)}</span>
                                            </div>
                                            <div style={{display: 'flex', justifyContent: 'space-between', color: 'var(--text-main)', fontWeight: 'bold', paddingTop: '8px', borderTop: '1px solid var(--border-color)', fontSize: '1.1rem'}}>
                                                <span>Grand Total</span>
                                                <span>{formatCurrency(po.grandTotal)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="info-card" style={{background: 'var(--surface-color)', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '16px'}}>
                                        <div className="card-header" style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--text-main)'}}>
                                            <User size={16} className="text-slate-400" />
                                            <h3 style={{margin: 0, fontSize: '0.9rem', fontWeight: '600'}}>Audit</h3>
                                        </div>
                                        <div className="card-body" style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                                            <div className="info-row" style={{display: 'flex', justifyContent: 'space-between'}}>
                                                <span className="info-label" style={{fontSize: '0.85rem', color: 'var(--text-muted)'}}>Created By</span>
                                                <span className="info-value font-medium" style={{color: 'var(--text-main)', fontSize: '0.85rem'}}>{po.creatorName}</span>
                                            </div>
                                            <div className="info-row" style={{display: 'flex', justifyContent: 'space-between'}}>
                                                <span className="info-label" style={{fontSize: '0.85rem', color: 'var(--text-muted)'}}>Created At</span>
                                                <span className="info-value" style={{color: 'var(--text-main)', fontSize: '0.85rem'}}>{new Date(po.createdAt).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'items' && (
                            <div className="enterprise-table-container" style={{margin: 0, border: '1px solid var(--border-color)', borderRadius: '8px'}}>
                                <table className="enterprise-table compact" style={{width: '100%'}}>
                                    <thead>
                                        <tr style={{background: 'var(--surface-highlight)', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)'}}>
                                            <th style={{padding: '10px 16px', width: '40%'}}>Product</th>
                                            <th style={{padding: '10px 16px', textAlign: 'right'}}>Qty</th>
                                            <th style={{padding: '10px 16px', textAlign: 'right'}}>Unit Price</th>
                                            <th style={{padding: '10px 16px', textAlign: 'right'}}>Tax/Disc</th>
                                            <th style={{padding: '10px 16px', textAlign: 'right'}}>Line Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {po.items.map((item, idx) => (
                                            <tr key={item.poItemId} style={{borderTop: idx > 0 ? '1px solid var(--border-color)' : 'none'}}>
                                                <td style={{padding: '12px 16px'}}>
                                                    <div style={{color: 'var(--text-main)', fontWeight: '500', fontSize: '0.9rem'}}>{item.productName}</div>
                                                    <div style={{color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.8rem'}}>{item.sku}</div>
                                                </td>
                                                <td style={{padding: '12px 16px', color: 'var(--text-main)', textAlign: 'right', fontSize: '0.9rem'}}>{item.quantity}</td>
                                                <td style={{padding: '12px 16px', color: 'var(--text-main)', textAlign: 'right', fontSize: '0.9rem'}}>{formatCurrency(item.unitPrice)}</td>
                                                <td style={{padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'right'}}>
                                                    <div>T: {formatCurrency(item.tax)}</div>
                                                    <div>D: {formatCurrency(item.discount)}</div>
                                                </td>
                                                <td style={{padding: '12px 16px', color: 'var(--text-main)', fontWeight: '600', textAlign: 'right', fontSize: '0.9rem'}}>{formatCurrency(item.lineTotal)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeSection === 'approval' && (
                            <div className="premium-timeline">
                                {po.approvals.length === 0 ? (
                                    <div className="premium-empty-state" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center', background: 'var(--surface-color)', borderRadius: '8px', border: '1px solid var(--border-color)'}}>
                                        <div className="icon-wrapper" style={{background: 'var(--surface-highlight)', padding: '16px', borderRadius: '50%', marginBottom: '16px'}}>
                                            <CheckCircle size={32} style={{color: 'var(--text-muted)'}} />
                                        </div>
                                        <h4 style={{fontSize: '1rem', margin: '0 0 8px 0', color: 'var(--text-main)'}}>No Approval History</h4>
                                        <p style={{color: 'var(--text-muted)', maxWidth: '400px', fontSize: '0.9rem'}}>This purchase order has not been approved or rejected yet.</p>
                                    </div>
                                ) : (
                                    <div className="timeline-container" style={{position: 'relative', paddingLeft: '24px'}}>
                                        <div style={{position: 'absolute', left: '7px', top: '0', bottom: '0', width: '2px', background: 'var(--border-color)'}}></div>
                                        {po.approvals.map((app, idx) => (
                                            <div key={app.approvalId} className="timeline-item" style={{position: 'relative', marginBottom: '20px'}}>
                                                <div className="timeline-dot" style={{position: 'absolute', left: '-22px', top: '4px', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--surface-color)', border: `2px solid ${app.action === 'Approve' ? '#10b981' : '#ef4444'}`}}></div>
                                                <div className="timeline-content-box" style={{background: 'var(--surface-color)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)'}}>
                                                    <div className="timeline-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px'}}>
                                                        <span className="timeline-user" style={{display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500', color: 'var(--text-main)', fontSize: '0.9rem'}}>
                                                            <User size={14} className="text-slate-400" /> {app.approverName}
                                                        </span>
                                                        <span className="timeline-time" style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>
                                                            {new Date(app.timestamp).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'}}>
                                                        <span className={`status-badge ${app.action === 'Approve' ? 'active' : 'inactive'}`} style={{padding: '2px 8px', fontSize: '0.75rem'}}>
                                                            {app.action}d
                                                        </span>
                                                    </div>
                                                    {app.comment && (
                                                        <div className="timeline-desc" style={{color: 'var(--text-main)', fontSize: '0.85rem', lineHeight: '1.5', background: 'var(--bg-main)', padding: '10px 12px', borderRadius: '6px', marginTop: '8px', fontStyle: 'italic'}}>
                                                            "{app.comment}"
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeSection === 'receiving' && (
                            <div className="premium-empty-state" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center', background: 'var(--surface-color)', borderRadius: '8px', border: '1px solid var(--border-color)'}}>
                                <div className="icon-wrapper" style={{background: 'var(--surface-highlight)', padding: '16px', borderRadius: '50%', marginBottom: '16px'}}>
                                    <Package size={32} style={{color: 'var(--text-muted)'}} />
                                </div>
                                <h4 style={{fontSize: '1rem', margin: '0 0 8px 0', color: 'var(--text-main)'}}>Goods Receipts</h4>
                                <p style={{color: 'var(--text-muted)', maxWidth: '400px', fontSize: '0.9rem'}}>The Goods Receipts feature is currently under development. Receiving history will appear here.</p>
                            </div>
                        )}

                        {activeSection === 'timeline' && (
                            <div className="premium-timeline">
                                {activities.length === 0 ? (
                                    <div className="premium-empty-state" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center', background: 'var(--surface-color)', borderRadius: '8px', border: '1px solid var(--border-color)'}}>
                                        <p style={{color: 'var(--text-muted)'}}>No timeline activity available.</p>
                                    </div>
                                ) : (
                                    <div className="timeline-container" style={{position: 'relative', paddingLeft: '24px'}}>
                                        <div style={{position: 'absolute', left: '7px', top: '0', bottom: '0', width: '2px', background: 'var(--border-color)'}}></div>
                                        {activities.map((act) => (
                                            <div key={act.activityId} className="timeline-item" style={{position: 'relative', marginBottom: '20px'}}>
                                                <div className="timeline-dot" style={{position: 'absolute', left: '-22px', top: '4px', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--surface-color)', border: '2px solid var(--primary-color)'}}></div>
                                                <div className="timeline-content-box" style={{background: 'var(--surface-color)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)'}}>
                                                    <div className="timeline-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px'}}>
                                                        <span className="timeline-user" style={{display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500', color: 'var(--text-main)', fontSize: '0.85rem'}}>
                                                            <User size={12} className="text-slate-400" /> {act.userName}
                                                        </span>
                                                        <span className="timeline-time" style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>
                                                            {new Date(act.timestamp).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <div style={{fontWeight: '600', color: 'var(--text-main)', fontSize: '0.9rem', marginBottom: '2px'}}>{act.action}</div>
                                                    <div className="timeline-desc" style={{color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.4'}}>{act.description}</div>
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
        </SharedDrawer>
    );
};

export default PurchaseOrderDetailDrawer;
