import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { loyaltyApi } from '../../services/loyaltyApi';
import SharedDrawer from '../shared/SharedDrawer';

const CreateBenefitDrawer = ({ tierId, onClose, onSuccess }) => {
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        benefitName: '',
        description: '',
        benefitType: 'Discount',
        benefitValue: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.benefitValue && Number(formData.benefitValue) < 0) {
            alert('Benefit value cannot be negative.');
            return;
        }

        setSubmitting(true);
        try {
            await loyaltyApi.createBenefit(tierId, {
                ...formData,
                benefitValue: formData.benefitValue ? Number(formData.benefitValue) : null
            });
            onSuccess();
        } catch (error) {
            console.error('Failed to create benefit:', error);
            alert(`Error: ${error.response?.data?.message || 'Failed to create benefit'}`);
        } finally {
            setSubmitting(false);
        }
    };

    const footer = (
        <div className="drawer-footer">
            <button type="button" className="secondary-btn" onClick={onClose} disabled={submitting}>Cancel</button>
            <button type="submit" form="create-benefit-form" className="primary-btn" disabled={submitting}>
                {submitting ? 'Adding...' : (
                    <><Save size={18} /> Add Benefit</>
                )}
            </button>
        </div>
    );

    return (
        <SharedDrawer
            isOpen={true}
            onClose={onClose}
            title="Add Benefit"
            footer={footer}
            width="500px"
        >
            <form id="create-benefit-form" onSubmit={handleSubmit} className="drawer-body p-6">
                
                <div className="form-group mb-4">
                    <label className="form-label block text-sm font-medium mb-1">Benefit Name <span className="text-red-500">*</span></label>
                    <input 
                        type="text" 
                        name="benefitName" 
                        className="form-input w-full p-2 border rounded" 
                        value={formData.benefitName} 
                        onChange={handleChange} 
                        placeholder="e.g., Free Shipping, 10% Discount"
                        required 
                    />
                </div>

                <div className="form-group mb-4">
                    <label className="form-label block text-sm font-medium mb-1">Description</label>
                    <textarea 
                        name="description" 
                        className="form-input w-full p-2 border rounded" 
                        rows="3" 
                        value={formData.description} 
                        onChange={handleChange}
                        placeholder="Optional details..."
                    ></textarea>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="form-group">
                        <label className="form-label block text-sm font-medium mb-1">Type <span className="text-red-500">*</span></label>
                        <select 
                            name="benefitType" 
                            className="form-input w-full p-2 border rounded" 
                            value={formData.benefitType} 
                            onChange={handleChange} 
                            required
                        >
                            <option value="Discount">Discount</option>
                            <option value="Bonus Points">Bonus Points</option>
                            <option value="Cashback">Cashback</option>
                            <option value="Priority Service">Priority Service</option>
                            <option value="Free Shipping">Free Shipping</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    
                    <div className="form-group">
                        <label className="form-label block text-sm font-medium mb-1">Value</label>
                        <input 
                            type="number" 
                            name="benefitValue" 
                            className="form-input w-full p-2 border rounded" 
                            value={formData.benefitValue} 
                            onChange={handleChange} 
                            min="0"
                            step="0.01"
                            placeholder="e.g., 10, 500"
                        />
                        <p className="text-xs text-muted mt-1">Leave empty if not applicable.</p>
                    </div>
                </div>

            </form>
        </SharedDrawer>
    );
};

export default CreateBenefitDrawer;
