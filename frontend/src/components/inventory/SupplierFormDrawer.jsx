import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Building2, User, MapPin, Hash } from 'lucide-react';
import { suppliersApi } from '../../services/api';
import SharedDrawer from '../shared/SharedDrawer';
import './InventoryDrawers.css';

const SupplierFormDrawer = ({ supplier, onClose, onSave }) => {
    const isEdit = !!supplier;
    
    const [formData, setFormData] = useState({
        supplierName: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        country: '',
        taxNumber: '',
        status: 'Active'
    });

    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    useEffect(() => {
        if (supplier) {
            setFormData({
                supplierName: supplier.supplierName || '',
                contactPerson: supplier.contactPerson || '',
                email: supplier.email || '',
                phone: supplier.phone || '',
                address: supplier.address || '',
                city: supplier.city || '',
                state: supplier.state || '',
                country: supplier.country || '',
                taxNumber: supplier.taxNumber || '',
                status: supplier.status || 'Active'
            });
        }
    }, [supplier]);

    // Validation
    useEffect(() => {
        const newErrors = {};
        
        if (touched.supplierName && !formData.supplierName.trim()) {
            newErrors.supplierName = 'Supplier Name is required';
        }
        
        if (touched.email && formData.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                newErrors.email = 'Invalid email format';
            }
        }
        
        if (touched.phone && formData.phone) {
            const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/;
            if (!phoneRegex.test(formData.phone)) {
                newErrors.phone = 'Invalid phone format';
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
        if (!formData.supplierName.trim()) return false;
        
        if (formData.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) return false;
        }

        if (formData.phone) {
            const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/;
            if (!phoneRegex.test(formData.phone)) return false;
        }
        
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Touch all fields to show validation if submitting blindly
        const allTouched = Object.keys(formData).reduce((acc, key) => {
            acc[key] = true;
            return acc;
        }, {});
        setTouched(allTouched);

        if (!isFormValid()) return;

        setLoading(true);
        setSubmitError(null);
        
        try {
            if (isEdit) {
                await suppliersApi.update(supplier.supplierId, formData);
            } else {
                await suppliersApi.create(formData);
            }
            onSave();
        } catch (err) {
            setSubmitError(err.message || 'Failed to save supplier. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const footer = (
        <div className="drawer-footer-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
                Cancel
            </button>
            <button 
                type="submit" 
                form="supplier-form" 
                className="btn-primary" 
                disabled={loading || !isFormValid()}
                style={(!isFormValid()) ? {opacity: 0.5, cursor: 'not-allowed'} : {}}
            >
                {loading ? (
                    <div className="spinner-small"></div>
                ) : (
                    <>
                        <Save size={18} />
                        <span>{isEdit ? 'Save Changes' : 'Create Supplier'}</span>
                    </>
                )}
            </button>
        </div>
    );

    return (
        <SharedDrawer
            isOpen={true}
            onClose={onClose}
            title={isEdit ? 'Edit Supplier' : 'Add New Supplier'}
            subtitle={isEdit ? 'Update procurement partner details.' : 'Register a new procurement partner.'}
            icon={Building2}
            footer={footer}
        >
            <div className="inventory-drawer-content">
                {submitError && (
                    <div className="form-error-alert"><AlertCircle size={16}/> {submitError}</div>
                )}
                
                <form id="supplier-form" onSubmit={handleSubmit} className="form-layout" style={{display: 'flex', flexDirection: 'column', gap: '24px'}}>
                        
                        {/* Business Details Section */}
                        <div className="form-section-premium" style={{borderTop: 'none', paddingTop: 0}}>
                            <div className="section-header" style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-main)'}}>
                                <Building2 size={16} className="text-slate-400" />
                                <h4 style={{margin: 0}}>Business Details</h4>
                            </div>
                            <div className="form-grid" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
                                <div className="form-group" style={{gridColumn: '1 / -1'}}>
                                    <label>Supplier Name <span className="text-red-500">*</span></label>
                                    <input 
                                        type="text" 
                                        name="supplierName" 
                                        value={formData.supplierName} 
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        placeholder="e.g. Acme Corp"
                                        className={errors.supplierName ? 'border-red-500' : ''}
                                    />
                                    {errors.supplierName && <span className="text-red-500 text-xs mt-1">{errors.supplierName}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Status <span className="text-red-500">*</span></label>
                                    <select name="status" value={formData.status} onChange={handleChange}>
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Contact Details Section */}
                        <div className="form-section-premium" style={{borderTop: '1px dashed var(--border-color)', paddingTop: '24px'}}>
                            <div className="section-header" style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-main)'}}>
                                <User size={16} className="text-slate-400" />
                                <h4 style={{margin: 0}}>Contact Details</h4>
                            </div>
                            <div className="form-grid" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
                                <div className="form-group" style={{gridColumn: '1 / -1'}}>
                                    <label>Contact Person</label>
                                    <input 
                                        type="text" 
                                        name="contactPerson" 
                                        value={formData.contactPerson} 
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        placeholder="e.g. John Doe"
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
                                        placeholder="john@example.com"
                                        className={errors.email ? 'border-red-500' : ''}
                                    />
                                    {errors.email && <span className="text-red-500 text-xs mt-1">{errors.email}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input 
                                        type="text" 
                                        name="phone" 
                                        value={formData.phone} 
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        placeholder="+1 (555) 000-0000"
                                        className={errors.phone ? 'border-red-500' : ''}
                                    />
                                    {errors.phone && <span className="text-red-500 text-xs mt-1">{errors.phone}</span>}
                                </div>
                            </div>
                        </div>

                        {/* Address Section */}
                        <div className="form-section-premium" style={{borderTop: '1px dashed var(--border-color)', paddingTop: '24px'}}>
                            <div className="section-header" style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-main)'}}>
                                <MapPin size={16} className="text-slate-400" />
                                <h4 style={{margin: 0}}>Address Details</h4>
                            </div>
                            <div className="form-grid" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
                                <div className="form-group" style={{gridColumn: '1 / -1'}}>
                                    <label>Street Address</label>
                                    <input 
                                        type="text" 
                                        name="address" 
                                        value={formData.address} 
                                        onChange={handleChange}
                                        placeholder="123 Business Avenue, Suite 100"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>City</label>
                                    <input 
                                        type="text" 
                                        name="city" 
                                        value={formData.city} 
                                        onChange={handleChange}
                                        placeholder="e.g. New York"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>State / Province</label>
                                    <input 
                                        type="text" 
                                        name="state" 
                                        value={formData.state} 
                                        onChange={handleChange}
                                        placeholder="e.g. NY"
                                    />
                                </div>
                                <div className="form-group" style={{gridColumn: '1 / -1'}}>
                                    <label>Country</label>
                                    <input 
                                        type="text" 
                                        name="country" 
                                        value={formData.country} 
                                        onChange={handleChange}
                                        placeholder="e.g. United States"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Tax Information Section */}
                        <div className="form-section-premium" style={{borderTop: '1px dashed var(--border-color)', paddingTop: '24px'}}>
                            <div className="section-header" style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-main)'}}>
                                <Hash size={16} className="text-slate-400" />
                                <h4 style={{margin: 0}}>Tax Information</h4>
                            </div>
                            <div className="form-grid" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
                                <div className="form-group" style={{gridColumn: '1 / -1'}}>
                                    <label>Tax Number (VAT / EIN)</label>
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

                    </form>
            </div>
        </SharedDrawer>
    );
};

export default SupplierFormDrawer;
