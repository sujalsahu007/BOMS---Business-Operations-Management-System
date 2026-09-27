import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Warehouse } from 'lucide-react';
import { warehousesApi, usersApi } from '../../services/api';
import SharedDrawer from '../shared/SharedDrawer';
import './InventoryDrawers.css'; // Shared CSS for all inventory drawers

const WarehouseFormDrawer = ({ warehouse, onClose, onSave }) => {
    const isEdit = !!warehouse;
    
    const [formData, setFormData] = useState({
        warehouseName: '',
        location: '',
        address: '',
        managerUserId: '',
        capacity: 0,
        status: 'Active'
    });
    
    const [managers, setManagers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (warehouse) {
            setFormData({
                warehouseName: warehouse.warehouseName,
                location: warehouse.location || '',
                address: warehouse.address || '',
                managerUserId: warehouse.managerUserId || '',
                capacity: warehouse.capacity || 0,
                status: warehouse.status
            });
        }
        fetchManagers();
    }, [warehouse]);

    const fetchManagers = async () => {
        try {
            // Fetch users. In a real scenario, we might filter by a specific 'Manager' role.
            const response = await usersApi.getAll({ status: 'Active' });
            setManagers(response.data.items || []);
        } catch (err) {
            console.error("Failed to fetch managers", err);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        try {
            const payload = {
                ...formData,
                managerUserId: formData.managerUserId ? parseInt(formData.managerUserId) : null,
                capacity: parseInt(formData.capacity) || 0
            };

            if (isEdit) {
                await warehousesApi.update(warehouse.warehouseId, payload);
            } else {
                await warehousesApi.create(payload);
            }
            onSave();
        } catch (err) {
            setError(err.message || 'Failed to save warehouse');
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
                form="warehouse-form" 
                className="btn-primary" 
                disabled={loading}
            >
                {loading ? (
                    <div className="spinner-small"></div>
                ) : (
                    <>
                        <Save size={18} />
                        <span>{isEdit ? 'Save Changes' : 'Create Warehouse'}</span>
                    </>
                )}
            </button>
        </div>
    );

    return (
        <SharedDrawer
            isOpen={true}
            onClose={onClose}
            title={isEdit ? 'Edit Warehouse' : 'Add New Warehouse'}
            subtitle={isEdit ? 'Update warehouse details and capacity.' : 'Create a new warehouse location.'}
            icon={Warehouse}
            footer={footer}
        >
            <div className="inventory-drawer-content">
                {error && (
                    <div className="form-error-alert"><AlertCircle size={16}/> {error}</div>
                )}
                
                <form id="warehouse-form" onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-group full-width">
                            <label>Warehouse Name *</label>
                            <input 
                                type="text" 
                                name="warehouseName" 
                                value={formData.warehouseName} 
                                onChange={handleChange} 
                                required 
                                placeholder="e.g. Main Distribution Center"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Location</label>
                            <input 
                                type="text" 
                                name="location" 
                                value={formData.location} 
                                onChange={handleChange} 
                                placeholder="e.g. New York, NY"
                            />
                        </div>

                        <div className="form-group full-width">
                            <label>Address</label>
                            <textarea 
                                name="address" 
                                value={formData.address} 
                                onChange={handleChange} 
                                rows="3"
                                placeholder="Full address"
                            />
                        </div>

                        <div className="form-group">
                            <label>Capacity (Units)</label>
                            <input 
                                type="number" 
                                name="capacity" 
                                value={formData.capacity} 
                                onChange={handleChange}
                                min="0"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Status *</label>
                            <select name="status" value={formData.status} onChange={handleChange} required>
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Warehouse Manager</label>
                            <select name="managerUserId" value={formData.managerUserId} onChange={handleChange}>
                                <option value="">-- Unassigned --</option>
                                {managers.map(m => (
                                    <option key={m.userId} value={m.userId}>
                                        {m.firstName} {m.lastName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </form>
            </div>
        </SharedDrawer>
    );
};

export default WarehouseFormDrawer;
