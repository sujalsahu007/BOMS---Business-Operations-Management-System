import React, { useState, useEffect } from 'react';
import { Edit2 } from 'lucide-react';
import { loyaltyApi } from '../../services/loyaltyApi';
import SharedDrawer from '../shared/SharedDrawer';

const EditPromotionDrawer = ({ promotion, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        promotionName: '',
        description: '',
        promotionType: 'Bonus Points',
        bonusPoints: '',
        pointsMultiplier: '',
        startDate: '',
        endDate: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (promotion) {
            setFormData({
                promotionName: promotion.promotionName || '',
                description: promotion.description || '',
                promotionType: promotion.promotionType || 'Bonus Points',
                bonusPoints: promotion.bonusPoints || '',
                pointsMultiplier: promotion.pointsMultiplier || '',
                startDate: promotion.startDate ? promotion.startDate.substring(0, 10) : '',
                endDate: promotion.endDate ? promotion.endDate.substring(0, 10) : ''
            });
        }
    }, [promotion]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (formData.promotionType === 'Bonus Points' && (!formData.bonusPoints || formData.bonusPoints <= 0)) {
            setError('Bonus Points must be greater than 0.');
            setLoading(false);
            return;
        }
        if (formData.promotionType === 'Points Multiplier' && (!formData.pointsMultiplier || formData.pointsMultiplier <= 1)) {
            setError('Points Multiplier must be greater than 1.');
            setLoading(false);
            return;
        }
        if (!formData.startDate || !formData.endDate) {
            setError('Start Date and End Date are required for promotions.');
            setLoading(false);
            return;
        }

        try {
            const payload = {
                promotionName: formData.promotionName,
                description: formData.description,
                promotionType: formData.promotionType,
                bonusPoints: formData.promotionType === 'Bonus Points' ? parseInt(formData.bonusPoints) : null,
                pointsMultiplier: formData.promotionType === 'Points Multiplier' ? parseFloat(formData.pointsMultiplier) : null,
                startDate: new Date(formData.startDate).toISOString(),
                endDate: new Date(formData.endDate).toISOString(),
            };
            await loyaltyApi.updatePromotion(promotion.promotionId, payload);
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update promotion');
        } finally {
            setLoading(false);
        }
    };

    const footer = (
        <div className="drawer-footer p-4 border-t border-gray-800 flex justify-end gap-3 bg-slate-900">
            <button type="button" className="secondary-btn" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" form="editPromoForm" className="primary-btn" disabled={loading}>
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
                    <Edit2 size={20} /> Edit Promotion
                </div>
            }
            footer={footer}
            width="600px"
        >
            <div className="drawer-body">
                {error && <div className="bg-red-500 bg-opacity-10 text-red-500 p-3 rounded mb-4 text-sm">{error}</div>}
                
                <form id="editPromoForm" onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="form-group">
                            <label>Loyalty Program</label>
                            <input 
                                type="text" 
                                className="form-input bg-gray-800" 
                                value={promotion?.loyaltyProgram?.programName || 'Unknown Program'} 
                                disabled 
                            />
                        </div>

                        <div className="form-group">
                            <label>Promotion Code</label>
                            <input 
                                type="text" 
                                className="form-input bg-gray-800" 
                                value={promotion?.promotionCode} 
                                disabled 
                            />
                        </div>

                        <div className="form-group">
                            <label>Promotion Name *</label>
                            <input 
                                type="text" 
                                className="form-input" 
                                name="promotionName" 
                                value={formData.promotionName} 
                                onChange={handleChange} 
                                required 
                                maxLength={200}
                            />
                        </div>

                        <div className="form-group">
                            <label>Promotion Type *</label>
                            <select className="form-input" name="promotionType" value={formData.promotionType} onChange={handleChange} required>
                                <option value="Bonus Points">Bonus Points</option>
                                <option value="Points Multiplier">Points Multiplier</option>
                            </select>
                        </div>

                        {formData.promotionType === 'Bonus Points' && (
                            <div className="form-group">
                                <label>Bonus Points Amount *</label>
                                <input 
                                    type="number" 
                                    className="form-input" 
                                    name="bonusPoints" 
                                    value={formData.bonusPoints} 
                                    onChange={handleChange} 
                                    required
                                    min={1}
                                />
                            </div>
                        )}

                        {formData.promotionType === 'Points Multiplier' && (
                            <div className="form-group">
                                <label>Points Multiplier *</label>
                                <input 
                                    type="number" 
                                    className="form-input" 
                                    name="pointsMultiplier" 
                                    value={formData.pointsMultiplier} 
                                    onChange={handleChange} 
                                    required
                                    min={1.1}
                                    step="0.1"
                                />
                            </div>
                        )}

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
                                <label>Start Date *</label>
                                <input 
                                    type="date" 
                                    className="form-input" 
                                    name="startDate" 
                                    value={formData.startDate} 
                                    onChange={handleChange} 
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>End Date *</label>
                                <input 
                                    type="date" 
                                    className="form-input" 
                                    name="endDate" 
                                    value={formData.endDate} 
                                    onChange={handleChange} 
                                    required
                                />
                            </div>
                        </div>
                    </form>
            </div>
        </SharedDrawer>
    );
};

export default EditPromotionDrawer;
