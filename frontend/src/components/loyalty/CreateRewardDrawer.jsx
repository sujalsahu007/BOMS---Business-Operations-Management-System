import React, { useState } from 'react';
import { Gift } from 'lucide-react';
import { loyaltyApi } from '../../services/loyaltyApi';
import SharedDrawer from '../shared/SharedDrawer';

const CreateRewardDrawer = ({ programs, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        loyaltyProgramId: '',
        rewardName: '',
        description: '',
        rewardType: 'Discount',
        pointsCost: '',
        rewardValue: '',
        startDate: '',
        endDate: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (formData.pointsCost <= 0) {
            setError('Points Cost must be greater than 0.');
            setLoading(false);
            return;
        }
        if (formData.rewardValue < 0) {
            setError('Reward Value cannot be negative.');
            setLoading(false);
            return;
        }

        try {
            const payload = {
                ...formData,
                loyaltyProgramId: parseInt(formData.loyaltyProgramId),
                pointsCost: parseInt(formData.pointsCost),
                rewardValue: formData.rewardValue ? parseFloat(formData.rewardValue) : null,
                startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
                endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
            };
            await loyaltyApi.createReward(payload);
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create reward');
        } finally {
            setLoading(false);
        }
    };

    const footer = (
        <div className="drawer-footer p-4 border-t border-gray-800 flex justify-end gap-3 bg-slate-900">
            <button type="button" className="secondary-btn" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" form="createRewardForm" className="primary-btn" disabled={loading}>
                {loading ? 'Creating...' : 'Create Reward'}
            </button>
        </div>
    );

    return (
        <SharedDrawer
            isOpen={true}
            onClose={onClose}
            title={
                <div className="flex items-center gap-2">
                    <Gift size={20} /> Create Reward
                </div>
            }
            footer={footer}
            width="600px"
        >
            <div className="drawer-body">
                {error && <div className="bg-red-500 bg-opacity-10 text-red-500 p-3 rounded mb-4 text-sm">{error}</div>}
                
                <form id="createRewardForm" onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="form-group">
                            <label>Loyalty Program *</label>
                            <select 
                                className="form-input" 
                                name="loyaltyProgramId" 
                                value={formData.loyaltyProgramId} 
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select a Program</option>
                                {programs.map(p => (
                                    <option key={p.loyaltyProgramId} value={p.loyaltyProgramId}>{p.programName}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Reward Name *</label>
                            <input 
                                type="text" 
                                className="form-input" 
                                name="rewardName" 
                                value={formData.rewardName} 
                                onChange={handleChange} 
                                required 
                                maxLength={200}
                                placeholder="e.g. ₹100 Off Voucher"
                            />
                        </div>

                        <div className="form-group">
                            <label>Reward Type *</label>
                            <select className="form-input" name="rewardType" value={formData.rewardType} onChange={handleChange} required>
                                <option value="Discount">Discount</option>
                                <option value="Voucher">Voucher</option>
                                <option value="Cashback">Cashback</option>
                                <option value="Free Shipping">Free Shipping</option>
                                <option value="Product/Service">Product/Service</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="form-group">
                                <label>Points Cost *</label>
                                <input 
                                    type="number" 
                                    className="form-input" 
                                    name="pointsCost" 
                                    value={formData.pointsCost} 
                                    onChange={handleChange} 
                                    required
                                    min={1}
                                    placeholder="500"
                                />
                            </div>
                            <div className="form-group">
                                <label>Reward Value</label>
                                <input 
                                    type="number" 
                                    className="form-input" 
                                    name="rewardValue" 
                                    value={formData.rewardValue} 
                                    onChange={handleChange}
                                    min={0}
                                    step="0.01"
                                    placeholder="100.00"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Description</label>
                            <textarea 
                                className="form-input" 
                                name="description" 
                                value={formData.description} 
                                onChange={handleChange} 
                                rows={3}
                                maxLength={1000}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="form-group">
                                <label>Start Date</label>
                                <input 
                                    type="date" 
                                    className="form-input" 
                                    name="startDate" 
                                    value={formData.startDate} 
                                    onChange={handleChange} 
                                />
                            </div>
                            <div className="form-group">
                                <label>End Date</label>
                                <input 
                                    type="date" 
                                    className="form-input" 
                                    name="endDate" 
                                    value={formData.endDate} 
                                    onChange={handleChange} 
                                />
                            </div>
                        </div>

                        {/* Preview */}
                        {formData.pointsCost && formData.rewardName && (
                            <div className="mt-4 p-4 rounded-lg bg-gray-800 bg-opacity-50 border border-gray-700">
                                <label className="text-xs text-muted mb-2 block uppercase">Customer View Preview</label>
                                <div className="font-medium text-lg text-blue-400">
                                    {formData.pointsCost} Points <span className="text-muted text-sm mx-2">→</span> <span className="text-white">{formData.rewardName}</span>
                                </div>
                            </div>
                        )}
                    </form>
            </div>
        </SharedDrawer>
    );
};

export default CreateRewardDrawer;
