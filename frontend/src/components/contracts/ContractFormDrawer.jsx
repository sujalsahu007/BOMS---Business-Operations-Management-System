import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, FileSignature, Building2, Calendar, IndianRupee } from 'lucide-react';
import { contractApi } from '../../services/contractApi';
import { api } from '../../services/api';
import SharedDrawer from '../shared/SharedDrawer';
import './ContractDrawers.css';

const ContractFormDrawer = ({ contractToEdit, isOpen, onClose, onSuccess }) => {
    const isEdit = !!contractToEdit;
    
    const [formData, setFormData] = useState({
        partyId: '',
        title: '',
        contractType: '',
        description: '',
        startDate: '',
        endDate: '',
        contractValue: '',
        currency: 'INR',
        ownerId: ''
    });

    const [parties, setParties] = useState([]);
    const [users, setUsers] = useState([]);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [files, setFiles] = useState([]);

    useEffect(() => {
        if (isOpen) {
            const fetchPartiesAndUsers = async () => {
                // Fetch Parties
                try {
                    const partyRes = await contractApi.getParties({ pageSize: 100 });
                    setParties(partyRes.items?.filter(p => p.status === 'Active') || []);
                } catch (err) {
                    console.error("Failed to load parties", err);
                    setParties([]);
                }

                // Fetch Users
                try {
                    const userRes = await api.get('/users/lookup').then(res => res.data);
                    setUsers(userRes || []);
                } catch (err) {
                    console.error("Failed to load users", err);
                    setUsers([]);
                }
            };
            fetchPartiesAndUsers();

            if (contractToEdit) {
                setFormData({
                    partyId: contractToEdit.partyId || '',
                    title: contractToEdit.title || '',
                    contractType: contractToEdit.contractType || '',
                    description: contractToEdit.description || '',
                    startDate: contractToEdit.startDate ? contractToEdit.startDate.split('T')[0] : '',
                    endDate: contractToEdit.endDate ? contractToEdit.endDate.split('T')[0] : '',
                    contractValue: contractToEdit.contractValue || '',
                    currency: contractToEdit.currency || 'INR',
                    ownerId: contractToEdit.ownerId || ''
                });
            } else {
                setFormData({
                    partyId: '',
                    title: '',
                    contractType: '',
                    description: '',
                    startDate: '',
                    endDate: '',
                    contractValue: '',
                    currency: 'INR',
                    ownerId: ''
                });
            }
            setErrors({});
            setTouched({});
            setSubmitError(null);
            setFiles([]);
        }
    }, [isOpen, contractToEdit]);

    // Validation
    useEffect(() => {
        const newErrors = {};
        
        if (touched.title && !formData.title.trim()) {
            newErrors.title = 'Title is required';
        }
        if (touched.contractType && !formData.contractType) {
            newErrors.contractType = 'Contract Type is required';
        }
        if (touched.partyId && !formData.partyId) {
            newErrors.partyId = 'Party is required';
        }
        if (touched.ownerId && !formData.ownerId) {
            newErrors.ownerId = 'Owner is required';
        }
        if (touched.startDate && !formData.startDate) {
            newErrors.startDate = 'Start Date is required';
        }
        if (touched.endDate && !formData.endDate) {
            newErrors.endDate = 'End Date is required';
        }
        
        if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
            newErrors.endDate = 'End Date must be after Start Date';
        }

        if (touched.contractValue && formData.contractValue && isNaN(formData.contractValue)) {
            newErrors.contractValue = 'Must be a valid number';
        } else if (touched.contractValue && formData.contractValue && Number(formData.contractValue) < 0) {
            newErrors.contractValue = 'Value cannot be negative';
        }
        if (touched.currency && !formData.currency) {
            newErrors.currency = 'Currency is required';
        }
        
        setErrors(newErrors);
    }, [formData, touched]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleBlur = (e) => {
        const { name } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
    };

    const isFormValid = () => {
        if (!formData.title.trim() || !formData.contractType || !formData.partyId || !formData.ownerId || !formData.startDate || !formData.endDate || !formData.currency) return false;
        if (new Date(formData.startDate) >= new Date(formData.endDate)) return false;
        if (formData.contractValue && (isNaN(formData.contractValue) || Number(formData.contractValue) < 0)) return false;
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const allTouched = Object.keys(formData).reduce((acc, key) => {
            acc[key] = true;
            return acc;
        }, {});
        setTouched(allTouched);

        if (!isFormValid()) return;

        try {
            setLoading(true);
            setSubmitError(null);

            const payload = {
                ...formData,
                partyId: parseInt(formData.partyId),
                ownerId: parseInt(formData.ownerId),
                contractValue: formData.contractValue ? parseFloat(formData.contractValue) : 0
            };

            let contractId;
            if (isEdit) {
                await contractApi.updateContract(contractToEdit.contractId, payload);
                contractId = contractToEdit.contractId;
            } else {
                const response = await contractApi.createContract(payload);
                contractId = response.contractId || response.id || response.data?.contractId;
            }
            
            // Upload files if any
            if (files.length > 0 && contractId) {
                for (const file of files) {
                    try {
                        await contractApi.uploadDocument(contractId, file);
                    } catch (fileErr) {
                        console.error("Failed to upload file", file.name, fileErr);
                    }
                }
            }
            
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error("Failed to save contract:", err);
            setSubmitError(err.response?.data?.message || 'An error occurred while saving the contract.');
        } finally {
            setLoading(false);
        }
    };

    const footer = (
        <div className="drawer-footer-actions" style={{display: 'flex', justifyContent: 'flex-end', gap: '1rem'}}>
            <button type="button" className="secondary-btn" onClick={onClose} disabled={loading}>
                Cancel
            </button>
            <button 
                type="submit" 
                form="contractForm"
                className="primary-btn" 
                disabled={loading || !isFormValid()}
            >
            {loading ? (
                <span>Saving...</span>
            ) : (
                <>
                    <Save size={18} />
                    <span>{isEdit ? 'Save Changes' : 'Create Draft'}</span>
                </>
            )}
            </button>
        </div>
    );

    return (
        <SharedDrawer
            isOpen={isOpen}
            onClose={onClose}
            title={isEdit ? 'Edit Draft Contract' : 'Create New Contract'}
            subtitle={isEdit ? 'Update the details of this draft contract.' : 'Initialize a new contract record in the system.'}
            icon={FileSignature}
            width="900px"
            formId="contractForm"
            onSubmit={handleSubmit}
            footer={footer}
        >
            <div className="contract-drawer-content">
                        {submitError && (
                            <div className="form-error mb-md">
                                <AlertCircle size={18} />
                                <span>{submitError}</span>
                            </div>
                        )}

                        <div className="form-section">
                            <h3 className="form-section-title">
                                <FileSignature size={16} />
                                Core Details
                            </h3>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>Contract Title <span className="required">*</span></label>
                                    <input 
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={errors.title ? 'error' : ''}
                                        placeholder="e.g. Annual Cloud Hosting Agreement"
                                    />
                                    {errors.title && <span className="error-text">{errors.title}</span>}
                                </div>
                                
                                <div className="form-group">
                                    <label>Contract Type <span className="required">*</span></label>
                                    <select 
                                        name="contractType" 
                                        value={formData.contractType} 
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={errors.contractType ? 'error' : ''}
                                    >
                                        <option value="">-- Select Type --</option>
                                        <option value="Non-Disclosure Agreement">NDA</option>
                                        <option value="Master Service Agreement">MSA</option>
                                        <option value="Vendor Agreement">Vendor Agreement</option>
                                        <option value="Employment Contract">Employment Contract</option>
                                        <option value="Lease Agreement">Lease Agreement</option>
                                        <option value="Other">Other</option>
                                    </select>
                                    {errors.contractType && <span className="error-text">{errors.contractType}</span>}
                                </div>

                                <div className="form-group">
                                    <label>Contract Party <span className="required">*</span></label>
                                    <select 
                                        name="partyId" 
                                        value={formData.partyId} 
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={errors.partyId ? 'error' : ''}
                                    >
                                        <option value="">-- Select Active Party --</option>
                                        {parties.map(p => (
                                            <option key={p.partyId} value={p.partyId}>
                                                {p.partyName} ({p.partyCode})
                                            </option>
                                        ))}
                                    </select>
                                    {errors.partyId && <span className="error-text">{errors.partyId}</span>}
                                </div>

                                <div className="form-group full-width">
                                    <label>Owner <span className="required">*</span></label>
                                    <select 
                                        name="ownerId" 
                                        value={formData.ownerId} 
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={errors.ownerId ? 'error' : ''}
                                    >
                                        <option value="">-- Select Owner --</option>
                                        {users.map(u => (
                                            <option key={u.userId} value={u.userId}>
                                                {u.firstName} {u.lastName}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.ownerId && <span className="error-text">{errors.ownerId}</span>}
                                </div>

                                <div className="form-group full-width">
                                    <label>Description</label>
                                    <textarea 
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        placeholder="Brief summary of the contract's purpose..."
                                        rows="3"
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                        <div className="form-section">
                            <h3 className="form-section-title">
                                <Calendar size={16} />
                                Terms & Value
                            </h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Start Date <span className="required">*</span></label>
                                    <input 
                                        type="date"
                                        name="startDate"
                                        value={formData.startDate}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        min={new Date().toISOString().split('T')[0]}
                                        className={errors.startDate ? 'error' : ''}
                                    />
                                    {errors.startDate && <span className="error-text">{errors.startDate}</span>}
                                </div>
                                <div className="form-group">
                                    <label>End Date <span className="required">*</span></label>
                                    <input 
                                        type="date"
                                        name="endDate"
                                        value={formData.endDate}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        min={formData.startDate || new Date().toISOString().split('T')[0]}
                                        className={errors.endDate ? 'error' : ''}
                                    />
                                    {errors.endDate && <span className="error-text">{errors.endDate}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Contract Value</label>
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', left: '10px', top: '10px', color: '#6b7280' }}>
                                            <IndianRupee size={16} />
                                        </div>
                                        <input 
                                            type="number"
                                            step="0.01"
                                            name="contractValue"
                                            value={formData.contractValue}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            className={errors.contractValue ? 'error' : ''}
                                            style={{ paddingLeft: '32px' }}
                                            placeholder="0.00"
                                        />
                                    </div>
                                    {errors.contractValue && <span className="error-text">{errors.contractValue}</span>}
                                </div>
                                
                                <div className="form-group">
                                    <label>Currency <span className="required">*</span></label>
                                    <select 
                                        name="currency" 
                                        value={formData.currency} 
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={errors.currency ? 'error' : ''}
                                    >
                                        <option value="INR">INR</option>
                                        <option value="USD">USD</option>
                                        <option value="EUR">EUR</option>
                                        <option value="GBP">GBP</option>
                                    </select>
                                    {errors.currency && <span className="error-text">{errors.currency}</span>}
                                </div>
                            </div>
                        </div>

                        <div className="form-section">
                            <h3 className="form-section-title">
                                <FileSignature size={16} />
                                Contract Documents
                            </h3>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>Upload Documents (PDF, Word)</label>
                                    <div style={{ border: '2px dashed rgba(255,255,255,0.2)', padding: '2rem', textAlign: 'center', borderRadius: '8px', cursor: 'pointer' }}
                                         onClick={() => document.getElementById('contract-file-upload').click()}
                                    >
                                        <input 
                                            id="contract-file-upload"
                                            type="file" 
                                            multiple 
                                            accept=".pdf,.doc,.docx"
                                            style={{ display: 'none' }}
                                            onChange={(e) => setFiles(Array.from(e.target.files))}
                                        />
                                        <p style={{ color: 'var(--text-muted)' }}>Click to select files or drag and drop</p>
                                    </div>
                                    {files.length > 0 && (
                                        <div style={{ marginTop: '1rem' }}>
                                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Selected Files:</label>
                                            <ul style={{ listStyle: 'none', padding: 0, margin: '0.5rem 0 0 0' }}>
                                                {files.map((f, i) => (
                                                    <li key={i} style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', marginBottom: '0.25rem', display: 'flex', justifyContent: 'space-between' }}>
                                                        <span>{f.name}</span>
                                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{(f.size / 1024).toFixed(1)} KB</span>
                                                    </li>
                                                ))}
                                            </ul>
                                            <button 
                                                type="button" 
                                                onClick={() => setFiles([])} 
                                                style={{ marginTop: '0.5rem', background: 'none', border: 'none', color: 'var(--red-500)', cursor: 'pointer', fontSize: '0.85rem' }}
                                            >
                                                Clear Selection
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

            </div>
        </SharedDrawer>
    );
};

export default ContractFormDrawer;
