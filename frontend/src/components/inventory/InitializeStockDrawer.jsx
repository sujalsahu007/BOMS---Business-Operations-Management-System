import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { warehousesApi, productsApi, stockApi } from '../../services/api';
import SharedDrawer from '../shared/SharedDrawer';
import './InventoryDrawers.css';

const InitializeStockDrawer = ({ onClose, onSave }) => {
    const [formData, setFormData] = useState({
        warehouseId: '',
        productId: '',
        initialQuantity: 0,
        reason: ''
    });
    
    const [warehouses, setWarehouses] = useState([]);
    const [products, setProducts] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                // Fetch active warehouses and products
                const [whRes, prodRes] = await Promise.all([
                    warehousesApi.getAll({ status: 'Active' }),
                    productsApi.getAll({ status: 'Active' })
                ]);
                setWarehouses(whRes.data.items || []);
                setProducts(prodRes.data.items || []);
            } catch (err) {
                setError("Failed to load warehouses or products.");
            } finally {
                setLoadingData(false);
            }
        };
        loadData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoadingSubmit(true);
        setError(null);
        
        try {
            const payload = {
                warehouseId: parseInt(formData.warehouseId),
                productId: parseInt(formData.productId),
                initialQuantity: parseInt(formData.initialQuantity),
                reason: formData.reason
            };

            await stockApi.initialize(payload);
            onSave();
        } catch (err) {
            setError(err.message || 'Failed to initialize stock');
        } finally {
            setLoadingSubmit(false);
        }
    };

    const footer = (
        <div className="drawer-footer-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loadingSubmit || loadingData}>
                Cancel
            </button>
            <button 
                type="submit" 
                form="init-stock-form" 
                className="btn-primary" 
                disabled={loadingSubmit || loadingData}
            >
                {loadingSubmit ? (
                    <div className="spinner-small"></div>
                ) : (
                    <>
                        <Save size={18} />
                        <span>Initialize Stock</span>
                    </>
                )}
            </button>
        </div>
    );

    return (
        <SharedDrawer
            isOpen={true}
            onClose={onClose}
            title="Initialize Stock"
            subtitle="Add opening balance or initial inventory."
            icon={Save}
            footer={footer}
        >
            <div className="inventory-drawer-content">
                {loadingData ? (
                    <div className="loading-state">Loading data...</div>
                ) : (
                    <form id="init-stock-form" onSubmit={handleSubmit}>
                        <div className="form-grid">
                            {error && (
                                <div className="alert alert-error">
                                    <AlertCircle size={16} />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="form-group">
                                <label>Warehouse *</label>
                                <select 
                                    name="warehouseId" 
                                    value={formData.warehouseId} 
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">-- Select Active Warehouse --</option>
                                    {warehouses.map(w => (
                                        <option key={w.warehouseId} value={w.warehouseId}>
                                            {w.warehouseCode} - {w.warehouseName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="form-group">
                                <label>Product *</label>
                                <select 
                                    name="productId" 
                                    value={formData.productId} 
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">-- Select Active Product --</option>
                                    {products.map(p => (
                                        <option key={p.productId} value={p.productId}>
                                            {p.productCode} - {p.productName} (SKU: {p.sku})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Initial Quantity *</label>
                                <input 
                                    type="number" 
                                    name="initialQuantity" 
                                    value={formData.initialQuantity} 
                                    onChange={handleChange}
                                    min="0"
                                    required
                                />
                                <small className="help-text">This will be added to the current stock level.</small>
                            </div>

                            <div className="form-group">
                                <label>Reason *</label>
                                <select 
                                    name="reason" 
                                    value={formData.reason} 
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">-- Select Reason --</option>
                                    <option value="Opening Balance">Opening Balance</option>
                                    <option value="Initial Inventory">Initial Inventory</option>
                                    <option value="Migration">Migration</option>
                                    <option value="System Setup">System Setup</option>
                                </select>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </SharedDrawer>
    );
};

export default InitializeStockDrawer;
