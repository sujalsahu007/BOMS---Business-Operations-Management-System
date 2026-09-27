import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { loyaltyApi } from '../../services/loyaltyApi';
import SharedDrawer from '../shared/SharedDrawer';

const EditTierDrawer = ({ tier, onClose, onSuccess }) => {
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        tierName: '',
        description: '',
        qualificationType: 'Spend',
        qualificationThreshold: '',
        displayOrder: '1'
    });

    useEffect(() => {
        if (tier) {
            setFormData({
                tierName: tier.tierName || '',
                description: tier.description || '',
                qualificationType: tier.qualificationType || 'Spend',
                qualificationThreshold: tier.qualificationThreshold || '',
                displayOrder: tier.displayOrder || '1'
            });
        }
    }, [tier]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (Number(formData.qualificationThreshold) <= 0) {
            alert('Qualification threshold must be greater than 0.');
            return;
        }

        setSubmitting(true);
        try {
            await loyaltyApi.updateTier(tier.tierId, {
                ...formData,
                qualificationThreshold: Number(formData.qualificationThreshold),
                displayOrder: Number(formData.displayOrder)
            });
            onSuccess();
        } catch (error) {
            console.error('Failed to update tier:', error);
            alert(`Error: ${error.response?.data?.message || 'Failed to update tier'}`);
        } finally {
            setSubmitting(false);
        }
    };

    const footer = (
        <div className="drawer-footer">
            <button type="button" className="secondary-btn" onClick={onClose} disabled={submitting}>Cancel</button>
            <button type="submit" form="edit-tier-form" className="primary-btn" disabled={submitting}>
                {submitting ? 'Saving...' : (
                    <><Save size={18} /> Save Changes</>
                )}
            </button>
        </div>
    );

    return (
        <SharedDrawer
            isOpen={true}
            onClose={onClose}
            title="Edit Loyalty Tier"
            footer={footer}
            width="600px"
        >
            <form id="edit-tier-form" onSubmit={handleSubmit} className="drawer-body p-6">
                
                <div className="form-section p-4 rounded mb-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <div className="flex justify-between mb-2">
                        <span className="text-muted">Program:</span>
                        <span className="font-semibold">{tier.programName}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted">Tier Code:</span>
                        <span className="font-semibold font-mono">{tier.tierCode}</span>
                    </div>
                </div>

                <div className="form-section mb-6">
                    <h3 className="text-sm font-semibold text-muted mb-4 tracking-wider uppercase border-b pb-2">Tier Identity</h3>
                    
                    <div className="form-group mb-4">
                        <label className="form-label block text-sm font-medium mb-1">Tier Name <span className="text-red-500">*</span></label>
                        <input 
                            type="text" 
                            name="tierName" 
                            className="form-input w-full p-2 border rounded" 
                            value={formData.tierName} 
                            onChange={handleChange} 
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
                        ></textarea>
                    </div>
                </div>

                <div className="form-section">
                    <h3 className="text-sm font-semibold text-muted mb-4 tracking-wider uppercase border-b pb-2">Qualification Rules</h3>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="form-group">
                            <label className="form-label block text-sm font-medium mb-1">Qualification Type <span className="text-red-500">*</span></label>
                            <select 
                                name="qualificationType" 
                                className="form-input w-full p-2 border rounded" 
                                value={formData.qualificationType} 
                                onChange={handleChange} 
                                required
                            >
                                <option value="Spend">Total Spend</option>
                                <option value="Points">Earned Points</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label block text-sm font-medium mb-1">Threshold Amount <span className="text-red-500">*</span></label>
                            <input 
                                type="number" 
                                name="qualificationThreshold" 
                                className="form-input w-full p-2 border rounded" 
                                value={formData.qualificationThreshold} 
                                onChange={handleChange} 
                                min="0.01"
                                step="0.01"
                                required 
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label block text-sm font-medium mb-1">Display Order <span className="text-red-500">*</span></label>
                        <input 
                            type="number" 
                            name="displayOrder" 
                            className="form-input w-full p-2 border rounded" 
                            value={formData.displayOrder} 
                            onChange={handleChange} 
                            min="1"
                            step="1"
                            required 
                        />
                        <p className="text-xs text-muted mt-1">Lower numbers appear first (e.g., 1 = Bronze, 2 = Silver).</p>
                    </div>
                </div>

            </form>
        </SharedDrawer>
    );
};

export default EditTierDrawer;
