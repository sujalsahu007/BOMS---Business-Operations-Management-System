import React, { useState, useEffect } from 'react';
import { Edit2 } from 'lucide-react';
import { loyaltyApi } from '../../services/loyaltyApi';
import SharedDrawer from '../shared/SharedDrawer';

const EditRewardDrawer = ({ reward, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
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

    useEffect(() => {
        if (reward) {
            setFormData({
                rewardName: reward.rewardName || '',
                description: reward.description || '',
                rewardType: reward.rewardType || 'Discount',
                pointsCost: reward.pointsCost || '',
                rewardValue: reward.rewardValue || '',
                startDate: reward.startDate ? reward.startDate.substring(0, 10) : '',
                endDate: reward.endDate ? reward.endDate.substring(0, 10) : ''
            });
        }
    }, [reward]);

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
                rewardName: formData.rewardName,
                description: formData.description,
                rewardType: formData.rewardType,
                pointsCost: parseInt(formData.pointsCost),
                rewardValue: formData.rewardValue ? parseFloat(formData.rewardValue) : null,
                startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
                endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
            };
            await loyaltyApi.updateReward(reward.rewardId, payload);
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update reward');
        } finally {
            setLoading(false);
        }
    };

    const footer = (
        <div className="drawer-footer p-4 border-t border-gray-800 flex justify-end gap-3 bg-slate-900">
            <button type="button" className="secondary-btn" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" form="editRewardForm" className="primary-btn" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
            </button>
        </div>
    );

    return (
        <SharedDrawer
            isOpen={true}
            onClose={onClose}
            title={
                <div className="flex items-center gap-2">
                    <Edit2 size={20} /> Edit Reward
                </div>
            }
            footer={footer}
            width="600px"
        >
            <div className="drawer-body">
                {error && <div className="bg-red-500 bg-opacity-10 text-red-500 p-3 rounded mb-4 text-sm">{error}</div>}
                
                <form id="editRewardForm" onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="form-group">
                            <label>Loyalty Program</label>
                            <input 
                                type="text" 
                                className="form-input bg-gray-800" 
                                value={reward?.loyaltyProgram?.programName || 'Unknown Program'} 
                                disabled 
                            />
                            <p className="text-xs text-muted mt-1">Program cannot be changed after creation.</p>
                        </div>

                        <div className="form-group">
                            <label>Reward Code</label>
                            <input 
                                type="text" 
                                className="form-input bg-gray-800" 
                                value={reward?.rewardCode} 
                                disabled 
                            />
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
                    </form>
            </div>
        </SharedDrawer>
    );
};

export default EditRewardDrawer;
