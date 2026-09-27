import React, { useState, useEffect } from 'react';
import { X, Calendar, IndianRupee, Save, AlertTriangle, FileText } from 'lucide-react';
import { contractApi } from '../../services/contractApi';
import './ContractDrawers.css'; // Reusing styles

const RenewalFormDrawer = ({ isOpen, onClose, originalContract, onSuccess }) => {
    const [formData, setFormData] = useState({
        startDate: '',
        endDate: '',
        contractValue: 0,
        currency: 'USD',
        description: ''
    });
    const [documents, setDocuments] = useState([]);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen && originalContract) {
            // Suggest start date = 1 day after end date of original
            const suggestedStart = new Date(originalContract.endDate);
            suggestedStart.setDate(suggestedStart.getDate() + 1);

            // Suggest end date = 1 year after start date
            const suggestedEnd = new Date(suggestedStart);
            suggestedEnd.setFullYear(suggestedEnd.getFullYear() + 1);

            setFormData({
                startDate: suggestedStart.toISOString().split('T')[0],
                endDate: suggestedEnd.toISOString().split('T')[0],
                contractValue: originalContract.contractValue,
                currency: originalContract.currency,
                description: `Renewal for ${originalContract.title}`
            });
            setError(null);
        }
    }, [isOpen, originalContract]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Date Validation
        const origEnd = new Date(originalContract.endDate);
        origEnd.setHours(0,0,0,0);
        const newStart = new Date(formData.startDate);
        newStart.setHours(0,0,0,0);
        const newEnd = new Date(formData.endDate);
        newEnd.setHours(0,0,0,0);

        if (newStart <= origEnd) {
            setError("New Start Date must be after the Original End Date.");
            return;
        }
        if (newEnd <= newStart) {
            setError("New End Date must be after the New Start Date.");
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const draftContract = await contractApi.renewContract(originalContract.contractId, formData);
            
            // Upload documents to the NEW draft contract
            if (documents && documents.length > 0) {
                for (const doc of documents) {
                    const fd = new FormData();
                    fd.append('file', doc);
                    fd.append('version', '1.0');
                    try {
                        await contractApi.uploadDocument(draftContract.contractId, fd);
                    } catch (uploadErr) {
                        console.error(`Failed to upload ${doc.name}:`, uploadErr);
                    }
                }
            }

            onSuccess();
            onClose();
        } catch (err) {
            console.error("Failed to create renewal draft:", err);
            const errStr = `Message: ${err.message} | Status: ${err.response?.status} | Data: ${JSON.stringify(err.response?.data)}`;
            setError(errStr);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !originalContract) return null;

    return (
        <div className="drawer-overlay" onClick={onClose}>
            <div className="drawer-container wide" onClick={e => e.stopPropagation()}>
                <div className="drawer-header">
                    <div>
                        <h2>Start Renewal</h2>
                        <span className="drawer-subtitle">
                            Original Contract: {originalContract.contractNumber}
                        </span>
                    </div>
                    <button className="icon-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="drawer-body">
                    {error && (
                        <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "8px", color: "var(--red-500)", display: "flex", gap: "0.5rem" }}>
                            <AlertTriangle size={20} />
                            <span style={{ fontWeight: 500 }}>{typeof error === 'string' ? error : JSON.stringify(error)}</span>
                        </div>
                    )}

                    <form id="renewalForm" onSubmit={handleSubmit} className="drawer-form">
                        <div className="form-section">
                            <h3 className="form-section-title">Original Details</h3>
                            <div className="form-grid">
                                <div className="form-group span-2">
                                    <label>Party</label>
                                    <input type="text" value={originalContract.partyName} disabled className="form-control" />
                                    <span className="field-hint">Party cannot be changed during renewal.</span>
                                </div>
                                <div className="form-group">
                                    <label>Contract Type</label>
                                    <input type="text" value={originalContract.contractType} disabled className="form-control" />
                                </div>
                                <div className="form-group">
                                    <label>Original End Date</label>
                                    <div className="input-with-icon">
                                        <Calendar size={18} />
                                        <input type="date" value={new Date(originalContract.endDate).toISOString().split('T')[0]} disabled className="form-control" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="form-section">
                            <h3 className="form-section-title">Renewal Terms</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>New Start Date <span className="required">*</span></label>
                                    <div className="input-with-icon">
                                        <Calendar size={18} />
                                        <input 
                                            type="date" 
                                            required 
                                            value={formData.startDate}
                                            onChange={e => setFormData({...formData, startDate: e.target.value})}
                                            className="form-control" 
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>New End Date <span className="required">*</span></label>
                                    <div className="input-with-icon">
                                        <Calendar size={18} />
                                        <input 
                                            type="date" 
                                            required 
                                            value={formData.endDate}
                                            onChange={e => setFormData({...formData, endDate: e.target.value})}
                                            className="form-control" 
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Contract Value</label>
                                    <div className="input-with-icon">
                                        <IndianRupee size={18} />
                                        <input 
                                            type="number" 
                                            min="0"
                                            step="0.01"
                                            value={formData.contractValue}
                                            onChange={e => setFormData({...formData, contractValue: parseFloat(e.target.value) || 0})}
                                            className="form-control" 
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Currency</label>
                                    <select 
                                        className="form-control"
                                        value={formData.currency}
                                        onChange={e => setFormData({...formData, currency: e.target.value})}
                                    >
                                        <option value="USD">USD</option>
                                        <option value="EUR">EUR</option>
                                        <option value="INR">INR</option>
                                        <option value="GBP">GBP</option>
                                    </select>
                                </div>
                                <div className="form-group span-2">
                                    <label>Renewal Description</label>
                                    <div className="input-with-icon align-top">
                                        <FileText size={18} style={{ marginTop: '0.75rem' }} />
                                        <textarea 
                                            rows="3"
                                            value={formData.description}
                                            onChange={e => setFormData({...formData, description: e.target.value})}
                                            className="form-control" 
                                        />
                                    </div>
                                </div>
                                <div className="form-group span-2">
                                    <label>Renewal Documents</label>
                                    <input 
                                        type="file" 
                                        multiple
                                        accept=".pdf,.doc,.docx"
                                        onChange={e => setDocuments(Array.from(e.target.files))}
                                        className="form-control"
                                        style={{ padding: "8px" }}
                                    />
                                    <span className="field-hint">Documents uploaded here will belong to the NEW renewal contract.</span>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="drawer-footer">
                    <button className="secondary-btn" onClick={onClose} disabled={loading}>
                        Cancel
                    </button>
                    <button type="submit" form="renewalForm" className="primary-btn" disabled={loading}>
                        {loading ? "Creating Renewal..." : (
                            <><Save size={18} /> Create Renewal Draft</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RenewalFormDrawer;
