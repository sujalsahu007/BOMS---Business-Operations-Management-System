import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { signatureApi } from '../services/publicApi';
import { Building2, Calendar, IndianRupee, FileSignature, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import './PublicSigningPage.css';

const PublicSigningPage = () => {
    const { token } = useParams();
    const [contract, setContract] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [signerName, setSignerName] = useState('');
    const [signerEmail, setSignerEmail] = useState('');
    const [confirmAcceptance, setConfirmAcceptance] = useState(false);
    
    const [declineReason, setDeclineReason] = useState('');
    const [showDecline, setShowDecline] = useState(false);
    
    const [actionLoading, setActionLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);

    useEffect(() => {
        const fetchSignaturePage = async () => {
            try {
                setLoading(true);
                const data = await signatureApi.getSignaturePage(token);
                setContract(data);
                setSignerName(data.recipientName);
                setSignerEmail(data.recipientEmail);
                
                // Silently mark as viewed via POST (do not await, do not fail page on error)
                signatureApi.markViewed(token).catch(e => console.error("Failed to mark signature viewed", e));
            } catch (err) {
                setError(err.response?.data || "Unable to load signing page. The link may be invalid or expired.");
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchSignaturePage();
        }
    }, [token]);

    const handleSign = async (e) => {
        e.preventDefault();
        try {
            setActionLoading(true);
            setError(null);
            
            await signatureApi.signContract(token, {
                signerName,
                signerEmail,
                confirmAcceptance
            });

            setSuccessMessage("You have successfully signed the document. You may now close this window.");
            setContract(prev => ({ ...prev, status: 'Signed' }));
        } catch (err) {
            setError(err.response?.data || "Failed to sign the document.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDecline = async (e) => {
        e.preventDefault();
        try {
            setActionLoading(true);
            setError(null);
            
            await signatureApi.declineSignature(token, {
                reason: declineReason
            });

            setSuccessMessage("You have declined to sign the document. You may now close this window.");
            setContract(prev => ({ ...prev, status: 'Declined' }));
        } catch (err) {
            setError(err.response?.data || "Failed to decline the document.");
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="public-signing-wrapper">
                <div className="public-signing-container" style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    if (error && !contract) {
        return (
            <div className="public-signing-wrapper">
                <div className="public-signing-container">
                    <div className="error-box">
                        <AlertTriangle size={32} />
                        <h2>Link Invalid or Expired</h2>
                        <p>{typeof error === 'string' ? error : JSON.stringify(error)}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="public-signing-wrapper">
            <div className="public-signing-container">
                <div className="brand-header">
                    <div className="brand-logo">HOSHO BOMS</div>
                    <div className="brand-subtitle">Secure Electronic Signature</div>
                </div>

                {successMessage ? (
                    <div className="success-box">
                        <CheckCircle size={48} />
                        <h2>Action Completed</h2>
                        <p>{successMessage}</p>
                    </div>
                ) : (
                    <>
                        <div className="document-header">
                            <h2>Review & Sign</h2>
                            <p>Please review the details below before applying your electronic signature.</p>
                        </div>

                        {error && (
                            <div className="error-banner">
                                <AlertTriangle size={18} />
                                {typeof error === 'string' ? error : JSON.stringify(error)}
                            </div>
                        )}

                        <div className="document-details">
                            <div className="detail-row">
                                <span className="detail-label">Document ID</span>
                                <span className="detail-value">{contract.contractNumber}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Title</span>
                                <span className="detail-value">{contract.title}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Counterparty</span>
                                <span className="detail-value flex-align">
                                    <Building2 size={16} /> {contract.partyName}
                                </span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Term</span>
                                <span className="detail-value flex-align">
                                    <Calendar size={16} /> 
                                    {new Date(contract.startDate).toLocaleDateString()} to {new Date(contract.endDate).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Value</span>
                                <span className="detail-value flex-align">
                                    <IndianRupee size={16} /> {contract.contractValue.toLocaleString()} {contract.currency}
                                </span>
                            </div>
                            {contract.description && (
                                <div className="detail-row full-width">
                                    <span className="detail-label">Description</span>
                                    <span className="detail-value block">{contract.description}</span>
                                </div>
                            )}
                        </div>

                        {!showDecline ? (
                            <div className="signing-actions-panel">
                                <h3>Apply Electronic Signature</h3>
                                <form onSubmit={handleSign}>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Signer Name <span className="required">*</span></label>
                                            <input 
                                                type="text" 
                                                className="form-control" 
                                                required 
                                                value={signerName}
                                                onChange={e => setSignerName(e.target.value)}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Signer Email <span className="required">*</span></label>
                                            <input 
                                                type="email" 
                                                className="form-control" 
                                                required 
                                                value={signerEmail}
                                                onChange={e => setSignerEmail(e.target.value)}
                                                disabled
                                            />
                                            <span className="field-hint">Email must match intended recipient.</span>
                                        </div>
                                    </div>

                                    <label className="checkbox-label" style={{ marginTop: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={confirmAcceptance}
                                            onChange={e => setConfirmAcceptance(e.target.checked)}
                                            required
                                        />
                                        <span style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>
                                            I confirm that I have reviewed the terms of this renewal agreement and agree to be legally bound by them. My electronic signature has the same legal effect and can be enforced in the same way as a written signature.
                                        </span>
                                    </label>

                                    <div className="action-buttons">
                                        <button 
                                            type="button" 
                                            className="secondary-btn" 
                                            onClick={() => setShowDecline(true)}
                                            disabled={actionLoading}
                                        >
                                            <XCircle size={18} /> Decline
                                        </button>
                                        <button 
                                            type="submit" 
                                            className="primary-btn sign-btn" 
                                            disabled={!confirmAcceptance || actionLoading}
                                        >
                                            {actionLoading ? "Processing..." : (
                                                <><FileSignature size={18} /> Accept & Sign</>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        ) : (
                            <div className="signing-actions-panel decline-panel">
                                <h3>Decline to Sign</h3>
                                <form onSubmit={handleDecline}>
                                    <div className="form-group">
                                        <label>Reason for Declining <span className="required">*</span></label>
                                        <textarea 
                                            className="form-control" 
                                            rows="4" 
                                            required
                                            value={declineReason}
                                            onChange={e => setDeclineReason(e.target.value)}
                                            placeholder="Please provide a reason so the contract owner can address your concerns."
                                        />
                                    </div>
                                    <div className="action-buttons">
                                        <button 
                                            type="button" 
                                            className="secondary-btn" 
                                            onClick={() => setShowDecline(false)}
                                            disabled={actionLoading}
                                        >
                                            Back to Signing
                                        </button>
                                        <button 
                                            type="submit" 
                                            className="danger-btn" 
                                            disabled={!declineReason.trim() || actionLoading}
                                        >
                                            {actionLoading ? "Processing..." : "Confirm Decline"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </>
                )}
            </div>
            
            <div className="brand-footer">
                Secured by HOSHO BOMS Internal Workflow Engine
            </div>
        </div>
    );
};

export default PublicSigningPage;
