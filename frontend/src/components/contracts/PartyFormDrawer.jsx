import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Building2, User, MapPin, Hash } from 'lucide-react';
import { contractApi } from '../../services/contractApi';
import SharedDrawer from '../shared/SharedDrawer';
import '../inventory/InventoryDrawers.css';

const PartyFormDrawer = ({ partyToEdit, isOpen, onClose, onSuccess }) => {
    const isEdit = !!partyToEdit;
    
    const [formData, setFormData] = useState({
        partyName: '',
        partyType: 'Customer',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        taxNumber: '',
        status: 'Active'
    });

    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            if (partyToEdit) {
                setFormData({
                    partyName: partyToEdit.partyName || '',
                    partyType: partyToEdit.partyType || 'Customer',
                    contactPerson: partyToEdit.contactPerson || '',
                    email: partyToEdit.email || '',
                    phone: partyToEdit.phone || '',
                    address: partyToEdit.address || '',
                    taxNumber: partyToEdit.taxNumber || '',
                    status: partyToEdit.status || 'Active'
                });
            } else {
                setFormData({
                    partyName: '',
                    partyType: 'Customer',
                    contactPerson: '',
                    email: '',
                    phone: '',
                    address: '',
                    taxNumber: '',
                    status: 'Active'
                });
            }
            setErrors({});
            setTouched({});
            setSubmitError(null);
        }
    }, [isOpen, partyToEdit]);

    // Validation
    useEffect(() => {
        const newErrors = {};
        
        if (touched.partyName && !formData.partyName.trim()) {
            newErrors.partyName = 'Party Name is required';
        }
        
        if (formData.email && touched.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                newErrors.email = 'Invalid email format';
            }
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
        if (!formData.partyName.trim()) return false;
        if (formData.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) return false;
        }
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

            if (isEdit) {
                await contractApi.updateParty(partyToEdit.partyId, formData);
            } else {
                await contractApi.createParty(formData);
            }
            
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error("Failed to save party:", err);
            setSubmitError(err.response?.data?.message || 'An error occurred while saving the party.');
        } finally {
            setLoading(false);
        }
    };

    const footer = (
        <div className="drawer-footer-actions" style={{display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem'}}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
                Cancel
            </button>
            <button 
                type="submit" 
                form="partyForm"
                className="btn-primary" 
                disabled={loading || !isFormValid()}
            >
            {loading ? (
                <span>Saving...</span>
            ) : (
                <>
                    <Save size={18} />
                    <span>{isEdit ? 'Save Changes' : 'Create Party'}</span>
                </>
            )}
            </button>
        </div>
    );

    return (
        <SharedDrawer
            isOpen={isOpen}
            onClose={onClose}
            title={isEdit ? 'Edit Contract Party' : 'Add Contract Party'}
            subtitle={isEdit ? 'Update details for this entity.' : 'Register a new vendor, customer, or partner.'}
            icon={Building2}
            width="800px"
            formId="partyForm"
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
                        
                        {/* Section: Basic Info */}
                        <div className="form-section">
                            <h3 className="form-section-title">
                                <Building2 size={16} />
                                Basic Information
                            </h3>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>Party Name <span className="required">*</span></label>
                                    <input 
                                        type="text"
                                        name="partyName"
                                        value={formData.partyName}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={errors.partyName ? 'error' : ''}
                                        placeholder="e.g. Acme Corp"
                                    />
                                    {errors.partyName && <span className="error-text">{errors.partyName}</span>}
                                </div>
                                
                                <div className="form-group">
                                    <label>Party Type</label>
                                    <select name="partyType" value={formData.partyType} onChange={handleChange}>
                                        <option value="Vendor">Vendor</option>
                                        <option value="Customer">Customer</option>
                                        <option value="Partner">Partner</option>
                                        <option value="Contractor">Contractor</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Status</label>
                                    <select name="status" value={formData.status} onChange={handleChange}>
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                        <option value="OnHold">On Hold</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Section: Contact Info */}
                        <div className="form-section">
                            <h3 className="form-section-title">
                                <User size={16} />
                                Contact Details
                            </h3>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>Contact Person</label>
                                    <input 
                                        type="text"
                                        name="contactPerson"
                                        value={formData.contactPerson}
                                        onChange={handleChange}
                                        placeholder="Primary contact person"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Email Address</label>
                                    <input 
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={errors.email ? 'error' : ''}
                                        placeholder="contact@company.com"
                                    />
                                    {errors.email && <span className="error-text">{errors.email}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input 
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="+1 (555) 000-0000"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section: Address */}
                        <div className="form-section">
                            <h3 className="form-section-title">
                                <MapPin size={16} />
                                Address
                            </h3>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>Full Address</label>
                                    <textarea 
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="Street address, City, State, Country"
                                        rows="3"
                                        className="w-full bg-[var(--surface-color)] border border-[var(--border-color)] rounded-md px-3 py-2 text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary-color)]"
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                        {/* Section: Additional */}
                        <div className="form-section">
                            <h3 className="form-section-title">
                                <Hash size={16} />
                                Identification
                            </h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Tax Number / VAT</label>
                                    <input 
                                        type="text"
                                        name="taxNumber"
                                        value={formData.taxNumber}
                                        onChange={handleChange}
                                        placeholder="e.g. US123456789"
                                    />
                                </div>
                            </div>
                        </div>
            </div>
        </SharedDrawer>
    );
};

export default PartyFormDrawer;
