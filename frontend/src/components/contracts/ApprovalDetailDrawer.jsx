import React, { useState, useEffect } from 'react';
import SharedDrawer from '../shared/SharedDrawer';
import { contractApi } from '../../services/contractApi';
import { Calendar, Building2, IndianRupee, Tag, Info, User, CheckCircle, XCircle, FileSignature, FileText, Download, Eye, AlertCircle, RefreshCw, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import '../shared/ActivityTimeline.css';
import './ContractDrawers.css';

const ApprovalDetailDrawer = ({ isOpen, onClose, contractId, onUpdate }) => {
    const [contract, setContract] = useState(null);
    const [approvals, setApprovals] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [obligations, setObligations] = useState([]);
    
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');
    const [comment, setComment] = useState('');

    const { currentUser } = useAuth();
    const isAuthorized = currentUser?.permissions?.includes('Contracts.Approve');
    const isOwner = contract?.ownerId === currentUser?.userId;
    const canApprove = isAuthorized && !isOwner;

    useEffect(() => {
        if (isOpen && contractId) {
            fetchData();
            setComment('');
            setError('');
        }
    }, [isOpen, contractId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const contractData = await contractApi.getContractById(contractId);
            const approvalsData = await contractApi.getContractApprovals(contractId);
            
            setContract(contractData);
            setApprovals(approvalsData || []);

            try {
                const docs = await contractApi.getDocuments(contractId);
                setDocuments(docs);
            } catch (e) {
                setDocuments([]);
            }

            try {
                const obs = await contractApi.getObligations(contractId);
                setObligations(obs);
            } catch (e) {
                setObligations([]);
            }

        } catch (err) {
            console.error("Failed to load approval details", err);
            setError("Failed to load request details.");
        } finally {
            setLoading(false);
        }
    };

    const handleDocumentAction = async (doc, action) => {
        try {
            const blob = await contractApi.downloadDocument(contractId, doc.documentId);
            const url = window.URL.createObjectURL(blob);
            
            if (action === 'view' && doc.fileType === 'application/pdf') {
                window.open(url, '_blank');
            } else {
                const a = document.createElement('a');
                a.href = url;
                a.download = doc.fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
            
            setTimeout(() => window.URL.revokeObjectURL(url), 100);
        } catch (err) {
            console.error("Failed to process document:", err);
            alert("Failed to access document.");
        }
    };

    const handleApprove = async () => {
        try {
            setActionLoading(true);
            setError('');
            await contractApi.approveContract(contractId, { comment });
            onUpdate();
            onClose();
        } catch (err) {
            console.error("Failed to approve", err);
            setError(err.response?.data?.message || "Approval could not be completed. No changes were made.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!comment.trim()) {
            setError("Rejection reason is required.");
            return;
        }

        try {
            setActionLoading(true);
            setError('');
            await contractApi.rejectContract(contractId, { comment });
            onUpdate();
            onClose();
        } catch (err) {
            console.error("Failed to reject", err);
            setError(err.response?.data?.message || "Rejection could not be completed. No changes were made.");
        } finally {
            setActionLoading(false);
        }
    };

    if (loading || !contract) {
        return (
            <SharedDrawer isOpen={isOpen} onClose={onClose} title="Loading Approval..." size="medium">
                <div className="flex justify-center p-12">
                    <div className="spinner"></div>
                </div>
            </SharedDrawer>
        );
    }

    const drawerFooter = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
            {error && (
                <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--red-500)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '0.85rem', fontWeight: 500 }}>
                    {error}
                </div>
            )}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Approval / Rejection Comment</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>Comment is optional for approval and required for rejection.</span>
                </label>
                <textarea 
                    className="form-input" 
                    rows="3" 
                    placeholder="Enter your comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    style={{ resize: 'none' }}
                />
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" className="secondary-btn" onClick={onClose} disabled={actionLoading}>
                    Cancel
                </button>
                {canApprove ? (
                    <>
                        <button 
                            type="button" 
                            className="danger-btn" 
                            onClick={handleReject} 
                            disabled={actionLoading}
                        >
                            {actionLoading ? "Processing..." : "Reject"}
                        </button>
                        <button 
                            type="button" 
                            className="success-btn" 
                            onClick={handleApprove} 
                            disabled={actionLoading}
                        >
                            {actionLoading ? "Processing..." : "Approve"}
                        </button>
                    </>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '0 0.5rem' }}>
                        <ShieldAlert size={16} /> 
                        {isOwner ? "Contract owners cannot self-approve." : "You are not an authorized approver."}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <SharedDrawer
            isOpen={isOpen}
            onClose={onClose}
            title={`Approval Request: ${contract.contractNumber}`}
            width="900px"
            footer={drawerFooter}
            headerAction={
                <button className="icon-btn" onClick={fetchData} title="Refresh" disabled={loading}>
                    <RefreshCw size={18} className={loading ? "spin" : ""} />
                </button>
            }
        >
            <div className="contract-drawer-content has-toolbar">
                <div className="contract-detail-layout" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '1rem' }}>
                    
                    {/* A. CONTRACT DETAILS */}
                    <div className="info-card">
                        <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FileText size={16} /> Contract Details
                        </h3>
                        <div className="detail-grid" style={{ gridTemplateColumns: '1fr 1fr', display: 'grid', gap: '1rem' }}>
                            <div className="info-group">
                                <label>Contract Title</label>
                                <div>{contract.title}</div>
                            </div>
                            <div className="info-group">
                                <label>Contract Type</label>
                                <div className="font-medium text-primary-color">{contract.contractType}</div>
                            </div>
                            <div className="info-group">
                                <label>Party</label>
                                <div className="font-medium text-primary-color">{contract.partyName}</div>
                            </div>
                            <div className="info-group">
                                <label>Owner / Submitted By</label>
                                <div className="flex items-center gap-2">
                                    <User size={14} className="text-muted" />
                                    {contract.ownerName}
                                </div>
                            </div>
                            <div className="info-group">
                                <label>Contract Value</label>
                                <div className="font-bold">
                                    {contract.currency === 'USD' ? '$' : contract.currency === 'EUR' ? '€' : contract.currency === 'GBP' ? '£' : '₹'} {contract.contractValue?.toLocaleString() || '0.00'}
                                </div>
                            </div>
                            <div className="info-group">
                                <label>Description</label>
                                <div style={{ fontSize: '0.85rem' }}>{contract.description || 'No description provided.'}</div>
                            </div>
                            <div className="info-row" style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="info-group">
                                    <label>Start Date</label>
                                    <div>{new Date(contract.startDate).toLocaleDateString()}</div>
                                </div>
                                <div className="info-group">
                                    <label>End Date</label>
                                    <div>{new Date(contract.endDate).toLocaleDateString()}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* B. CONTRACT DOCUMENTS */}
                    <div className="info-card">
                        <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FileSignature size={16} /> Contract Documents
                        </h3>
                        {documents.length === 0 ? (
                            <div className="text-muted text-sm py-4">No documents attached to this contract.</div>
                        ) : (
                            <div className="detail-list">
                                {documents.map(doc => (
                                    <div key={doc.documentId} className="detail-item" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div className="font-medium text-sm text-gray-800 dark:text-gray-200">
                                                {doc.fileName}
                                            </div>
                                            <div className="text-xs text-muted mt-1">
                                                Version {doc.version} • {doc.fileName.split('.').pop().toUpperCase()} • {(doc.fileSize / 1024).toFixed(1)} KB • Uploaded by {doc.uploadedByName} on {new Date(doc.uploadedAt).toLocaleString()}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs px-2 py-1 rounded" style={{ marginRight: '0.5rem' }}>v{doc.version}</span>
                                            
                                            {doc.fileType === 'application/pdf' && (
                                                <button 
                                                    className="secondary-btn" 
                                                    title="View Document"
                                                    onClick={() => handleDocumentAction(doc, 'view')}
                                                    style={{ padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
                                                >
                                                    <Eye size={14} /> View
                                                </button>
                                            )}
                                            
                                            <button 
                                                className="secondary-btn" 
                                                title="Download Document"
                                                onClick={() => handleDocumentAction(doc, 'download')}
                                                style={{ padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
                                            >
                                                <Download size={14} /> Download
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* C. OBLIGATIONS */}
                    <div className="info-card">
                        <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <AlertCircle size={16} /> Obligations
                        </h3>
                        {obligations.length === 0 ? (
                            <div className="text-muted text-sm py-4">No obligations defined for this contract.</div>
                        ) : (
                            <div className="obligations-list">
                                {obligations.map(ob => (
                                    <div key={ob.obligationId} className="obligation-item text-sm py-3 border-b last:border-0 border-gray-100 dark:border-gray-800">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-medium text-gray-800 dark:text-gray-200">{ob.title}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                                ob.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                                ob.status === 'Overdue' ? 'bg-red-100 text-red-800' :
                                                'bg-blue-100 text-blue-800'
                                            }`}>
                                                {ob.status}
                                            </span>
                                        </div>
                                        <div className="text-xs text-muted mb-2">{ob.description || 'No description.'}</div>
                                        <div className="flex items-center gap-4 text-xs text-muted">
                                            <div className="flex items-center gap-1">
                                                <User size={12} /> {ob.responsibleParty}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Calendar size={12} /> Due: {new Date(ob.dueDate).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* D. APPROVAL LIFECYCLE */}
                    <div className="info-card">
                        <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CheckCircle size={16} /> Approval Lifecycle
                        </h3>
                        
                        {approvals.length === 0 ? (
                            <div style={{ padding: '1.5rem', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.1)', borderRadius: '8px' }}>
                                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--blue-600)', marginBottom: '0.5rem' }}>Step 1 of 1</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, marginBottom: '1rem' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--blue-500)' }}></div>
                                    Awaiting Approval
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.5rem', fontSize: '0.85rem' }}>
                                    <div className="text-muted">Assigned To:</div>
                                    <div className="font-medium">Authorized Approvers</div>
                                    <div className="text-muted">Status:</div>
                                    <div className="font-medium text-blue-600">Pending</div>
                                </div>
                            </div>
                        ) : (
                            <div className="activity-timeline mt-2">
                                {approvals.map((app, index) => (
                                    <div className="timeline-item" key={app.approvalId}>
                                        <div className="timeline-icon" style={{ 
                                            background: app.action === 'Approve' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                            color: app.action === 'Approve' ? 'var(--green-500)' : 'var(--red-500)'
                                        }}>
                                            {app.action === 'Approve' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                                        </div>
                                        <div className="timeline-content">
                                            <div className="timeline-header" style={{ marginBottom: '0.5rem' }}>
                                                <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Step 1 of 1</div>
                                                <span className="timeline-title" style={{ fontSize: '1rem', fontWeight: 600 }}>
                                                    {app.action === 'Approve' ? 'Approved' : 'Rejected'}
                                                </span>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '0.25rem', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                                                <div className="text-muted">Decision By:</div>
                                                <div className="font-medium">{app.approverName || app.approverUsername}</div>
                                                <div className="text-muted">Decision Date:</div>
                                                <div>{new Date(app.date).toLocaleString()}</div>
                                            </div>
                                            <div className="timeline-body" style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                {app.comment ? (
                                                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)', fontStyle: 'italic' }}>
                                                        "{app.comment}"
                                                    </p>
                                                ) : (
                                                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', opacity: 0.7 }}>
                                                        No comment provided.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </SharedDrawer>
    );
};

export default ApprovalDetailDrawer;
