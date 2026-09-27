import React, { useState, useEffect } from 'react';
import { X, RefreshCw, FileSignature, CheckCircle, XCircle, AlertCircle, Trash2, Calendar, FileText, User, Eye, Download } from 'lucide-react';
import { contractApi } from '../../services/contractApi';
import SharedDrawer from '../shared/SharedDrawer';
import './ContractDrawers.css';

const ContractDetailDrawer = ({ contractId, isOpen, onClose, onUpdate }) => {
    const [contract, setContract] = useState(null);
    const [obligations, setObligations] = useState([]);
    const [approvals, setApprovals] = useState([]);
    const [signingRequest, setSigningRequest] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [activities, setActivities] = useState([]);
    const [uploadingDoc, setUploadingDoc] = useState(false);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [documentsError, setDocumentsError] = useState(null);

    useEffect(() => {
        if (isOpen && contractId) {
            fetchData();
        } else {
            setContract(null);
        }
    }, [isOpen, contractId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            setDocumentsError(null);
            
            const contractData = await contractApi.getContractById(contractId);
            setContract(contractData);

            const obs = await contractApi.getObligations(contractId);
            setObligations(obs);

            const apps = await contractApi.getContractApprovals(contractId);
            setApprovals(apps);
            
            if (contractData.originalContractId) {
                try {
                    const sig = await contractApi.getSigningRequest(contractId);
                    setSigningRequest(sig);
                } catch (e) {
                    setSigningRequest(null);
                }
            } else {
                setSigningRequest(null);
            }
            
            try {
                const docs = await contractApi.getDocuments(contractId);
                setDocuments(docs);
            } catch(e) { 
                setDocuments([]); 
                setDocumentsError("Failed to load documents.");
            }
            
            try {
                const acts = await contractApi.getActivitiesByReference(contractId.toString(), 'Contracts');
                setActivities(acts?.items || acts || []);
            } catch(e) { setActivities([]); }
            
        } catch (err) {
            console.error("Failed to fetch contract details", err);
            setError("Failed to load contract details.");
        } finally {
            setLoading(false);
        }
    };

    const handleUploadNewVersion = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            setUploadingDoc(true);
            await contractApi.uploadDocument(contractId, file);
            // Refresh documents & activities
            setDocumentsError(null);
            const docs = await contractApi.getDocuments(contractId);
            setDocuments(docs);
            const acts = await contractApi.getActivitiesByReference(contractId.toString(), 'Contracts');
            setActivities(acts?.items || acts || []);
        } catch (err) {
            alert("Failed to upload document version.");
        } finally {
            setUploadingDoc(false);
            e.target.value = null; // reset input
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

    const titleNode = contract ? (
        <div className="flex items-center gap-3">
            <span>Contract {contract.contractNumber}</span>
            <span className={`status-badge ${contract.status.replace(/\s+/g, '-').toLowerCase()}`}>
                {contract.status}
            </span>
        </div>
    ) : 'Loading...';

    const headerAction = (
        <button className="icon-btn" onClick={fetchData} title="Refresh" disabled={loading}>
            <RefreshCw size={18} className={loading ? "spin" : ""} />
        </button>
    );

    return (
        <SharedDrawer
            isOpen={isOpen}
            onClose={onClose}
            title={titleNode}
            subtitle={contract?.title || 'Loading...'}
            icon={FileSignature}
            width="1000px"
            headerAction={headerAction}
        >
            <div className="contract-drawer-content has-toolbar">
                    {/* Lifecycle Indicator */}
                    <div className="lifecycle-indicator">
                        {(() => {
                            if (!contract) return null;
                            const isRenewal = !!contract.originalContractId;
                            const currentStatus = contract.status;
                            let steps = ['Draft', 'Under Review', 'Pending Approval', 'Approved'];
                            
                            if (isRenewal) {
                                steps.push('Awaiting Signature', 'Active');
                            } else {
                                steps.push('Active', 'Expiring Soon', 'Expired');
                            }
                            
                            if (['Rejected', 'Terminated', 'Superseded', 'Declined'].includes(currentStatus)) {
                                if (currentStatus === 'Rejected') {
                                    steps = ['Draft', 'Under Review', 'Pending Approval', 'Rejected'];
                                } else if (currentStatus === 'Declined') {
                                    steps = ['Draft', 'Under Review', 'Pending Approval', 'Approved', 'Awaiting Signature', 'Declined'];
                                } else if (currentStatus === 'Terminated' || currentStatus === 'Superseded') {
                                    steps = ['Draft', 'Under Review', 'Pending Approval', 'Approved', 'Active', currentStatus];
                                }
                            }
                            
                            const currentIndex = steps.indexOf(currentStatus);

                            return steps.map((step, idx) => {
                                const isCurrent = step === currentStatus;
                                const isCompleted = currentIndex !== -1 && idx < currentIndex;
                                const isTerminal = ['Rejected', 'Terminated', 'Superseded', 'Declined'].includes(step);
                                
                                let stepClass = 'lifecycle-step';
                                if (isCompleted) stepClass += ' active';
                                if (isCurrent) stepClass += ' current';
                                if (isTerminal && isCurrent) stepClass += ' terminal-state';
                                
                                return (
                                    <div key={step} className={stepClass}>
                                        <div className="step-circle">
                                            {isCompleted ? '✓' : (isTerminal && isCurrent ? '✕' : idx + 1)}
                                        </div>
                                        <div className="step-label">{step}</div>
                                    </div>
                                );
                            });
                        })()}
                    </div>

                    {error && (
                        <div className="drawer-alert error mb-4">
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    {contract?.originalContractId && (
                        <div className="drawer-alert" style={{ background: "rgba(59, 130, 246, 0.1)", color: "var(--blue-500)", border: "1px solid rgba(59, 130, 246, 0.2)" }}>
                            <FileSignature size={18} />
                            <span><strong>Renewal Draft</strong> for Original Contract: {contract.originalContractNumber}</span>
                        </div>
                    )}

                    {contract?.hasActiveRenewal && (
                        <div className="drawer-alert" style={{ background: "rgba(245, 158, 11, 0.1)", color: "var(--amber-500)", border: "1px solid rgba(245, 158, 11, 0.2)" }}>
                            <RefreshCw size={18} />
                            <span>An active renewal draft exists for this contract.</span>
                        </div>
                    )}

                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="spinner"></div>
                        </div>
                    ) : !contract ? (
                        <div className="text-center py-8 text-muted">Contract not found.</div>
                    ) : (
                        <div className="contract-detail-layout">

                            <div className="detail-grid">
                                {/* Left Column: Info */}
                                <div className="detail-column">
                                    <div className="info-card">
                                        <h3><FileText size={16} /> Contract Information</h3>
                                        
                                        <div className="info-group">
                                            <label>Title</label>
                                            <div>{contract.title}</div>
                                        </div>
                                        <div className="info-group">
                                            <label>Description</label>
                                            <div>{contract.description || 'No description provided.'}</div>
                                        </div>
                                        <div className="info-group">
                                            <label>Type</label>
                                            <div className="font-medium text-primary-color">{contract.contractType}</div>
                                        </div>
                                        <div className="info-group">
                                            <label>Party</label>
                                            <div className="font-medium text-primary-color">{contract.partyName}</div>
                                        </div>
                                        <div className="info-row">
                                            <div className="info-group">
                                                <label>Start Date</label>
                                                <div>{new Date(contract.startDate).toLocaleDateString()}</div>
                                            </div>
                                            <div className="info-group">
                                                <label>End Date</label>
                                                <div>{new Date(contract.endDate).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                        <div className="info-group">
                                            <label>Contract Value</label>
                                            <div className="font-bold">{contract.currency === 'USD' ? '$' : contract.currency === 'EUR' ? '€' : contract.currency === 'GBP' ? '£' : '₹'} {contract.contractValue?.toLocaleString() || '0.00'}</div>
                                        </div>
                                        <div className="info-group">
                                            <label>Owner</label>
                                            <div className="flex items-center gap-2">
                                                <User size={14} className="text-muted" />
                                                {contract.ownerName}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Obligations Preview */}
                                    <div className="info-card mt-4">
                                        <h3><AlertCircle size={16} /> Obligations</h3>
                                        {obligations.length === 0 ? (
                                            <div className="text-muted text-sm py-4">No obligations defined for this contract.</div>
                                        ) : (
                                            <div className="obligations-list">
                                                {obligations.slice(0, 5).map(ob => (
                                                    <div key={ob.obligationId} className="obligation-item text-sm py-2 border-b last:border-0">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <span className="font-medium">{ob.title}</span>
                                                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                                                                ob.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                                                ob.status === 'Overdue' ? 'bg-red-100 text-red-800' :
                                                                'bg-blue-100 text-blue-800'
                                                            }`}>
                                                                {ob.status}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-muted">Due: {new Date(ob.dueDate).toLocaleDateString()}</div>
                                                    </div>
                                                ))}
                                                {obligations.length > 5 && (
                                                    <div className="text-center text-xs text-blue-600 mt-2 cursor-pointer hover:underline">
                                                        View all {obligations.length} obligations
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right Column: Details & Email Simulation */}
                                <div className="detail-column">
                                    {signingRequest && (
                                        <div className="info-card" style={{ borderLeft: '4px solid var(--blue-500)', background: 'var(--blue-50)' }}>
                                            <h3 style={{ color: 'var(--blue-700)' }}><FileSignature size={16} /> Email Simulation</h3>
                                            <div className="detail-list">
                                                <div className="detail-item">
                                                    <label>To</label>
                                                    <div>{signingRequest.recipientName} ({signingRequest.recipientEmail})</div>
                                                </div>
                                                <div className="detail-item">
                                                    <label>Subject</label>
                                                    <div>Contract Renewal Signature Request</div>
                                                </div>
                                                <div className="detail-item">
                                                    <label>Message</label>
                                                    <div>Please review and sign the renewal contract.</div>
                                                </div>
                                                <div className="detail-item">
                                                    <label>Signing Link</label>
                                                    <div>
                                                        <a 
                                                            href={`/signature/${signingRequest.secureToken}`} 
                                                            target="_blank" 
                                                            rel="noreferrer"
                                                            style={{ color: 'var(--blue-600)', textDecoration: 'underline', wordBreak: 'break-all' }}
                                                        >
                                                            Open Public Signing Page
                                                        </a>
                                                    </div>
                                                </div>
                                                <div className="detail-item">
                                                    <label>Status</label>
                                                    <div style={{ fontWeight: 600 }}>
                                                        {signingRequest.status}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="info-card">
                                        <h3><Calendar size={16} /> Approval History</h3>
                                        {approvals.length === 0 ? (
                                            <div className="text-muted text-sm py-4">No approval history yet.</div>
                                        ) : (
                                            <div className="timeline">
                                                {approvals.map((app, idx) => (
                                                    <div key={app.approvalId} className="timeline-item flex gap-3 mb-4">
                                                        <div className="timeline-icon mt-1">
                                                            {app.action === 'Approve' ? <CheckCircle size={16} className="text-green-500" /> :
                                                             app.action === 'Reject' ? <XCircle size={16} className="text-red-500" /> :
                                                             <CheckCircle size={16} className="text-blue-500" />}
                                                        </div>
                                                        <div className="timeline-content">
                                                            <div className="flex items-baseline gap-2">
                                                                <span className="font-medium text-sm">{app.approverUsername}</span>
                                                                <span className="text-xs font-semibold text-gray-500">{app.action}d</span>
                                                            </div>
                                                            <div className="text-xs text-muted mb-1">{new Date(app.date).toLocaleString()}</div>
                                                            {app.comment && (
                                                                <div className="text-sm bg-gray-50 p-2 rounded border mt-1 italic">"{app.comment}"</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Documents */}
                                    <div className="info-card mt-4">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                            <h3 style={{ margin: 0 }}><FileText size={16} /> Documents</h3>
                                            <div>
                                                <input 
                                                    type="file" 
                                                    id={`doc-upload-${contractId}`} 
                                                    style={{display: 'none'}} 
                                                    onChange={handleUploadNewVersion}
                                                    accept=".pdf,.doc,.docx"
                                                />
                                                <button 
                                                    className="btn-secondary" 
                                                    style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}
                                                    onClick={() => document.getElementById(`doc-upload-${contractId}`).click()}
                                                    disabled={uploadingDoc}
                                                >
                                                    {uploadingDoc ? 'Uploading...' : 'Upload New Version'}
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {documentsError ? (
                                            <div className="text-red-500 text-sm py-2"><AlertCircle size={14} className="inline mr-1" /> {documentsError}</div>
                                        ) : documents.length === 0 ? (
                                            <div className="text-muted text-sm py-2">No documents uploaded.</div>
                                        ) : (
                                            <div className="detail-list">
                                                {documents.map(doc => (
                                                    <div key={doc.documentId} className="detail-item" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div>
                                                            <div className="font-medium text-sm text-gray-800">
                                                                {doc.fileName}
                                                            </div>
                                                            <div className="text-xs text-muted mt-1">
                                                                Version {doc.version} • {doc.fileName.split('.').pop().toUpperCase()} • {(doc.fileSize / 1024).toFixed(1)} KB • Uploaded by {doc.uploadedByName} on {new Date(doc.uploadedAt).toLocaleString()}
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded" style={{ marginRight: '0.5rem' }}>v{doc.version}</span>
                                                            
                                                            {doc.fileType === 'application/pdf' && (
                                                                <button 
                                                                    className="icon-btn" 
                                                                    title="View Document"
                                                                    onClick={() => handleDocumentAction(doc, 'view')}
                                                                    style={{ padding: '4px', display: 'inline-flex' }}
                                                                >
                                                                    <Eye size={16} />
                                                                </button>
                                                            )}
                                                            
                                                            <button 
                                                                className="icon-btn" 
                                                                title="Download Document"
                                                                onClick={() => handleDocumentAction(doc, 'download')}
                                                                style={{ padding: '4px', display: 'inline-flex' }}
                                                            >
                                                                <Download size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Activity History */}
                                    <div className="info-card mt-4">
                                        <h3><RefreshCw size={16} /> Activity History</h3>
                                        {activities.length === 0 ? (
                                            <div className="text-muted text-sm py-4">No activity history yet.</div>
                                        ) : (
                                            <div className="timeline">
                                                {activities.map((act) => (
                                                    <div key={act.activityId} className="timeline-item flex gap-3 mb-4">
                                                        <div className="timeline-icon mt-1">
                                                            <div className="w-2 h-2 rounded-full bg-blue-500" style={{marginTop: '0.35rem'}}></div>
                                                        </div>
                                                        <div className="timeline-content">
                                                            <div className="flex items-baseline gap-2">
                                                                <span className="font-medium text-sm">{act.user?.username || 'System'}</span>
                                                                <span className="text-xs font-semibold text-gray-500">{act.action}</span>
                                                            </div>
                                                            <div className="text-xs text-muted mb-1">{new Date(act.timestamp).toLocaleString()}</div>
                                                            {act.description && (
                                                                <div className="text-sm bg-gray-50 p-2 rounded border mt-1">"{act.description}"</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                </div>
                            </div>
                        </div>
                    )}
            </div>
        </SharedDrawer>
    );
};

export default ContractDetailDrawer;
