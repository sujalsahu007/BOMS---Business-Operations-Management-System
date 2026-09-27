import React, { useState } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { loyaltyApi } from '../../services/loyaltyApi';
import SharedDrawer from '../shared/SharedDrawer';

const CreateProgramDrawer = ({ onClose, onSuccess }) => {
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        programName: '',
        description: '',
        startDate: '',
        endDate: '',
        pointsName: 'Points',
        earningAmount: 100,
        earningPoints: 10,
        minimumRedemptionPoints: 500
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
        
        if (formData.endDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
            alert('End Date must be greater than Start Date.');
            return;
        }

        setSubmitting(true);
        try {
            await loyaltyApi.createProgram({
                ...formData,
                earningAmount: parseFloat(formData.earningAmount),
                earningPoints: parseInt(formData.earningPoints, 10),
                minimumRedemptionPoints: parseInt(formData.minimumRedemptionPoints, 10)
            });
            alert('Loyalty program created successfully.');
            onSuccess();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Failed to create program.');
        } finally {
            setSubmitting(false);
        }
    };

    const footer = (
        <div className="drawer-footer">
            <button type="button" className="secondary-btn" onClick={onClose} disabled={submitting}>Cancel</button>
            <button type="submit" form="create-loyalty-form" className="primary-btn" disabled={submitting}>
                {submitting ? 'Creating...' : (
                    <><Save size={18} /> Create Program</>
                )}
            </button>
        </div>
    );

    return (
        <SharedDrawer
            isOpen={true}
            onClose={onClose}
            title="Create Loyalty Program"
            footer={footer}
            width="600px"
        >
            <form id="create-loyalty-form" onSubmit={handleSubmit} className="drawer-body">
                    <div className="form-section">
                        <h3>BASIC INFORMATION</h3>
                        
                        <div className="form-group">
                            <label>Program Name *</label>
                            <input 
                                type="text" 
                                className="form-control" 
                                name="programName"
                                value={formData.programName}
                                onChange={handleChange}
                                required
                                maxLength={200}
                            />
                        </div>

                        <div className="form-group">
                            <label>Description</label>
                            <textarea 
                                className="form-control" 
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={3}
                                maxLength={1000}
                            />
                        </div>
                    </div>

                    <div className="form-section mt-6">
                        <h3>PROGRAM VALIDITY</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="form-group">
                                <label>Start Date *</label>
                                <input 
                                    type="date" 
                                    className="form-control" 
                                    name="startDate"
                                    value={formData.startDate}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>End Date</label>
                                <input 
                                    type="date" 
                                    className="form-control" 
                                    name="endDate"
                                    value={formData.endDate}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-section mt-6">
                        <h3>POINT CONFIGURATION</h3>
                        <div className="form-group">
                            <label>Points Name *</label>
                            <input 
                                type="text" 
                                className="form-control" 
                                name="pointsName"
                                value={formData.pointsName}
                                onChange={handleChange}
                                required
                                maxLength={50}
                            />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="form-group">
                                <label>Earning Amount (₹) *</label>
                                <input 
                                    type="number" 
                                    className="form-control" 
                                    name="earningAmount"
                                    value={formData.earningAmount}
                                    onChange={handleChange}
                                    required
                                    min="0.01"
                                    step="0.01"
                                />
                            </div>
                            <div className="form-group">
                                <label>Earning Points *</label>
                                <input 
                                    type="number" 
                                    className="form-control" 
                                    name="earningPoints"
                                    value={formData.earningPoints}
                                    onChange={handleChange}
                                    required
                                    min="1"
                                />
                            </div>
                        </div>

                        <div className="helper-box flex-align gap-2 text-muted mt-2 mb-4 p-3 rounded" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                            <AlertCircle size={16} className="text-blue-500" />
                            <span>Example: Spend ₹{formData.earningAmount || 0} → Earn {formData.earningPoints || 0} {formData.pointsName || 'Points'}</span>
                        </div>

                        <div className="form-group mt-2">
                            <label>Minimum Redemption Points *</label>
                            <input 
                                type="number" 
                                className="form-control" 
                                name="minimumRedemptionPoints"
                                value={formData.minimumRedemptionPoints}
                                onChange={handleChange}
                                required
                                min="0"
                            />
                        </div>
                    </div>

                    <div className="form-section mt-6 p-4 rounded" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                        <div className="flex justify-between mb-2">
                            <span className="text-muted">Program Code:</span>
                            <span className="font-medium">Generated automatically</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted">Initial Status:</span>
                            <span className="status-badge status-draft">Draft</span>
                        </div>
                    </div>

            </form>
        </SharedDrawer>
    );
};

export default CreateProgramDrawer;
