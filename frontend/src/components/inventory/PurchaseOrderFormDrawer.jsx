import React, { useState, useEffect } from 'react';
import { X, Building2, Package, Plus, Trash2, AlertCircle, Save, Send } from 'lucide-react';
import { purchaseOrdersApi, productsApi } from '../../services/api';
import SharedDrawer from '../shared/SharedDrawer';
import './InventoryDrawers.css';

const PurchaseOrderFormDrawer = ({ onClose, onSuccess, suppliers, warehouses }) => {
    const [submitting, setSubmitting] = useState(false);
    const [products, setProducts] = useState([]);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    
    // Form State
    const [supplierId, setSupplierId] = useState('');
    const [warehouseId, setWarehouseId] = useState('');
    const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
    const [remarks, setRemarks] = useState('');
    const [items, setItems] = useState([{ productId: '', quantity: 1, unitPrice: 0, tax: 0, discount: 0 }]);

    // Validation State
    const [errors, setErrors] = useState({});

    // Live Totals
    const [totals, setTotals] = useState({ subtotal: 0, tax: 0, discount: 0, grandTotal: 0 });

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await productsApi.getAll({ pageSize: 1000 });
                setProducts(res.data.items || []);
            } catch (err) {
                console.error("Failed to fetch products:", err);
            }
        };
        fetchProducts();
    }, []);

    // Recalculate totals
    useEffect(() => {
        let sub = 0;
        let tax = 0;
        let disc = 0;
        
        items.forEach(i => {
            const lineSub = (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0);
            sub += lineSub;
            tax += Number(i.tax) || 0;
            disc += Number(i.discount) || 0;
        });

        setTotals({
            subtotal: sub,
            tax,
            discount: disc,
            grandTotal: Math.max(0, sub + tax - disc)
        });
    }, [items]);

    const markChanged = () => {
        if (!hasUnsavedChanges) setHasUnsavedChanges(true);
        if (Object.keys(errors).length > 0) setErrors({});
    };

    const handleClose = () => {
        if (hasUnsavedChanges) {
            if (window.confirm("Discard unsaved changes? Your entered purchase order information will be lost.")) {
                onClose();
            }
        } else {
            onClose();
        }
    };

    const addItem = () => {
        setItems([...items, { productId: '', quantity: 1, unitPrice: 0, tax: 0, discount: 0 }]);
        markChanged();
    };

    const removeItem = (index) => {
        if (items.length === 1) {
            setErrors({ ...errors, items: "At least one item is required." });
            return;
        }
        setItems(items.filter((_, idx) => idx !== index));
        markChanged();
    };

    const updateItem = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        
        // Auto-fill price if product is selected
        if (field === 'productId') {
            const product = products.find(p => p.productId.toString() === value.toString());
            if (product) {
                newItems[index].unitPrice = product.costPrice || 0;
                
                // Check duplicate
                const isDuplicate = items.some((item, idx) => idx !== index && item.productId.toString() === value.toString());
                if (isDuplicate) {
                    setErrors({ ...errors, [`item_${index}`]: "This product is already included. Edit the existing line." });
                    newItems[index].productId = '';
                } else {
                    const newErrors = { ...errors };
                    delete newErrors[`item_${index}`];
                    setErrors(newErrors);
                }
            }
        }
        
        setItems(newItems);
        markChanged();
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!supplierId) newErrors.supplierId = "Supplier is required.";
        if (!warehouseId) newErrors.warehouseId = "Receiving warehouse is required.";
        if (!expectedDeliveryDate) newErrors.expectedDeliveryDate = "Expected delivery date is required.";
        
        if (items.length === 0) {
            newErrors.items = "At least one item is required.";
        } else {
            items.forEach((item, idx) => {
                if (!item.productId) newErrors[`item_${idx}_product`] = "Product is required.";
                if (item.quantity <= 0) newErrors[`item_${idx}_qty`] = "Qty > 0 required.";
                if (item.unitPrice < 0) newErrors[`item_${idx}_price`] = "Price >= 0 required.";
            });
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSaveDraft = async () => {
        if (!validateForm()) return;
        
        setSubmitting(true);
        try {
            const payload = {
                supplierId: Number(supplierId),
                warehouseId: Number(warehouseId),
                expectedDeliveryDate: new Date(expectedDeliveryDate).toISOString(),
                remarks,
                items: items.map(i => ({
                    productId: Number(i.productId),
                    quantity: Number(i.quantity),
                    unitPrice: Number(i.unitPrice),
                    tax: Number(i.tax),
                    discount: Number(i.discount)
                }))
            };
            
            await purchaseOrdersApi.createDraft(payload);
            setHasUnsavedChanges(false);
            onSuccess();
        } catch (error) {
            console.error("Failed to save draft:", error);
            setErrors({ submit: error.response?.data?.Message || error.message });
        } finally {
            setSubmitting(false);
        }
    };

    // Helper for formatting currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    const footer = (
        <div className="drawer-footer-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
            <button className="btn-secondary" onClick={handleClose} disabled={submitting}>Cancel</button>
            <button 
                className="btn-primary" 
                onClick={handleSaveDraft} 
                disabled={submitting}
            >
                {submitting ? (
                    <div className="spinner-small"></div>
                ) : (
                    <><Save size={18} /><span>Save Draft</span></>
                )}
            </button>
        </div>
    );

    return (
        <SharedDrawer
            isOpen={true}
            onClose={handleClose}
            title="New Purchase Order"
            subtitle={<span className="status-badge neutral" style={{fontSize: '0.75rem', padding: '2px 8px', display: 'inline-block', marginTop: '4px'}}>Draft Mode</span>}
            icon={Package}
            width="1000px"
            footer={footer}
        >
            <div className="inventory-drawer-content">
                {errors.submit && (
                    <div className="form-error-alert"><AlertCircle size={16}/> {errors.submit}</div>
                )}
                    
                {/* SECTION 1: PO Details */}
                <div className="po-section" style={{background: 'var(--surface-color)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '24px'}}>
                        <h3 style={{color: 'var(--text-main)', fontSize: '1rem', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px'}}>
                            <Building2 size={16} className="text-slate-400" /> Vendor & Delivery
                        </h3>
                        
                        <div className="form-grid">
                            <div className="form-group" style={{marginBottom: 0}}>
                                <label style={{fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block'}}>
                                    Supplier <span className="text-red-500">*</span>
                                </label>
                                {suppliers.length === 0 ? (
                                    <div style={{padding: '8px 12px', background: 'var(--surface-highlight)', borderRadius: '6px', color: 'var(--text-muted)', fontSize: '0.9rem', border: '1px solid var(--border-color)'}}>
                                        No active suppliers available.
                                    </div>
                                ) : (
                                    <>
                                        <select 
                                            className={`form-control ${errors.supplierId ? 'error' : ''}`}
                                            value={supplierId} 
                                            onChange={e => { setSupplierId(e.target.value); markChanged(); }}
                                            style={{width: '100%', padding: '8px 12px', borderRadius: '6px', border: `1px solid ${errors.supplierId ? '#ef4444' : 'var(--border-color)'}`, background: 'var(--bg-main)', color: 'var(--text-main)'}}
                                        >
                                            <option value="">Select Supplier...</option>
                                            {suppliers.map(s => (
                                                <option key={s.supplierId} value={s.supplierId}>{s.supplierName} ({s.supplierCode})</option>
                                            ))}
                                        </select>
                                        {errors.supplierId && <span style={{color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block'}}>{errors.supplierId}</span>}
                                    </>
                                )}
                            </div>
                            
                            <div className="form-group" style={{marginBottom: 0}}>
                                <label style={{fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block'}}>
                                    Receiving Warehouse <span className="text-red-500">*</span>
                                </label>
                                {warehouses.length === 0 ? (
                                    <div style={{padding: '8px 12px', background: 'var(--surface-highlight)', borderRadius: '6px', color: 'var(--text-muted)', fontSize: '0.9rem', border: '1px solid var(--border-color)'}}>
                                        No active warehouses available.
                                    </div>
                                ) : (
                                    <>
                                        <select 
                                            className={`form-control ${errors.warehouseId ? 'error' : ''}`}
                                            value={warehouseId} 
                                            onChange={e => { setWarehouseId(e.target.value); markChanged(); }}
                                            style={{width: '100%', padding: '8px 12px', borderRadius: '6px', border: `1px solid ${errors.warehouseId ? '#ef4444' : 'var(--border-color)'}`, background: 'var(--bg-main)', color: 'var(--text-main)'}}
                                        >
                                            <option value="">Select Warehouse...</option>
                                            {warehouses.map(w => (
                                                <option key={w.warehouseId} value={w.warehouseId}>{w.warehouseCode} - {w.warehouseName}</option>
                                            ))}
                                        </select>
                                        {errors.warehouseId && <span style={{color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block'}}>{errors.warehouseId}</span>}
                                    </>
                                )}
                            </div>
                            
                            <div className="form-group" style={{marginBottom: 0}}>
                                <label style={{fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block'}}>
                                    Expected Delivery Date <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    type="date" 
                                    value={expectedDeliveryDate}
                                    onChange={e => { setExpectedDeliveryDate(e.target.value); markChanged(); }}
                                    min={new Date().toISOString().split('T')[0]}
                                    style={{width: '100%', padding: '8px 12px', borderRadius: '6px', border: `1px solid ${errors.expectedDeliveryDate ? '#ef4444' : 'var(--border-color)'}`, background: 'var(--bg-main)', color: 'var(--text-main)', colorScheme: 'var(--color-scheme)'}}
                                />
                                {errors.expectedDeliveryDate && <span style={{color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block'}}>{errors.expectedDeliveryDate}</span>}
                            </div>
                            
                            <div className="form-group full-width" style={{marginBottom: 0}}>
                                <label style={{fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block'}}>
                                    Remarks
                                </label>
                                <input 
                                    type="text" 
                                    value={remarks}
                                    onChange={e => { setRemarks(e.target.value); markChanged(); }}
                                    placeholder="Add any instructions for the supplier or warehouse team..."
                                    style={{width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)'}}
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: Line Items */}
                    <div className="po-section" style={{background: 'var(--surface-color)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '24px'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
                            <h3 style={{color: 'var(--text-main)', fontSize: '1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px'}}>
                                <Package size={16} className="text-slate-400" /> 
                                Line Items
                                <span style={{background: 'var(--surface-highlight)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-muted)'}}>
                                    {items.length} {items.length === 1 ? 'item' : 'items'}
                                </span>
                            </h3>
                            <button className="btn-secondary" onClick={addItem} style={{padding: '4px 12px', fontSize: '0.85rem'}}>
                                <Plus size={14} /> Add Item
                            </button>
                        </div>
                        
                        {errors.items && <div style={{color: '#ef4444', fontSize: '0.85rem', marginBottom: '12px'}}>{errors.items}</div>}
                        
                        <div className="enterprise-table-container" style={{overflowX: 'visible', margin: 0, border: 'none'}}>
                            <table className="enterprise-table compact" style={{width: '100%'}}>
                                <thead>
                                    <tr style={{background: 'var(--surface-highlight)', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)'}}>
                                        <th style={{padding: '8px 12px', width: '35%'}}>Product <span className="text-red-500">*</span></th>
                                        <th style={{padding: '8px 12px', width: '12%'}}>Qty <span className="text-red-500">*</span></th>
                                        <th style={{padding: '8px 12px', width: '15%'}}>Unit Price <span className="text-red-500">*</span></th>
                                        <th style={{padding: '8px 12px', width: '12%'}}>Tax</th>
                                        <th style={{padding: '8px 12px', width: '12%'}}>Disc.</th>
                                        <th style={{padding: '8px 12px', width: '15%', textAlign: 'right'}}>Line Total</th>
                                        <th style={{padding: '8px 4px', width: '40px'}}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, idx) => {
                                        const lineTotal = Math.max(0, (item.quantity * item.unitPrice) + item.tax - item.discount);
                                        const hasRowError = errors[`item_${idx}_product`] || errors[`item_${idx}_qty`] || errors[`item_${idx}_price`] || errors[`item_${idx}`];
                                        
                                        return (
                                            <tr key={idx} style={{borderBottom: '1px solid var(--border-color)', background: hasRowError ? 'rgba(239, 68, 68, 0.02)' : 'transparent'}}>
                                                <td style={{padding: '8px 12px'}}>
                                                    <select 
                                                        value={item.productId}
                                                        onChange={e => updateItem(idx, 'productId', e.target.value)}
                                                        style={{width: '100%', padding: '6px', borderRadius: '4px', border: `1px solid ${errors[`item_${idx}_product`] ? '#ef4444' : 'var(--border-color)'}`, background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.85rem'}}
                                                    >
                                                        <option value="">Search product...</option>
                                                        {products.map(p => (
                                                            <option key={p.productId} value={p.productId}>{p.productCode} - {p.productName}</option>
                                                        ))}
                                                    </select>
                                                    {errors[`item_${idx}_product`] && <span style={{color: '#ef4444', fontSize: '0.7rem', display: 'block', marginTop: '2px'}}>{errors[`item_${idx}_product`]}</span>}
                                                    {errors[`item_${idx}`] && <span style={{color: '#ef4444', fontSize: '0.7rem', display: 'block', marginTop: '2px'}}>{errors[`item_${idx}`]}</span>}
                                                </td>
                                                <td style={{padding: '8px 12px'}}>
                                                    <input 
                                                        type="number" min="1" 
                                                        value={item.quantity} 
                                                        onChange={e => updateItem(idx, 'quantity', Number(e.target.value))} 
                                                        style={{width: '100%', padding: '6px', borderRadius: '4px', border: `1px solid ${errors[`item_${idx}_qty`] ? '#ef4444' : 'var(--border-color)'}`, background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.85rem'}} 
                                                    />
                                                </td>
                                                <td style={{padding: '8px 12px'}}>
                                                    <input 
                                                        type="number" min="0" step="0.01" 
                                                        value={item.unitPrice} 
                                                        onChange={e => updateItem(idx, 'unitPrice', Number(e.target.value))} 
                                                        style={{width: '100%', padding: '6px', borderRadius: '4px', border: `1px solid ${errors[`item_${idx}_price`] ? '#ef4444' : 'var(--border-color)'}`, background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.85rem'}} 
                                                    />
                                                </td>
                                                <td style={{padding: '8px 12px'}}>
                                                    <input 
                                                        type="number" min="0" step="0.01" 
                                                        value={item.tax} 
                                                        onChange={e => updateItem(idx, 'tax', Number(e.target.value))} 
                                                        style={{width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.85rem'}} 
                                                    />
                                                </td>
                                                <td style={{padding: '8px 12px'}}>
                                                    <input 
                                                        type="number" min="0" step="0.01" 
                                                        value={item.discount} 
                                                        onChange={e => updateItem(idx, 'discount', Number(e.target.value))} 
                                                        style={{width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.85rem'}} 
                                                    />
                                                </td>
                                                <td style={{padding: '8px 12px', fontWeight: '500', color: 'var(--text-main)', textAlign: 'right', fontSize: '0.9rem'}}>
                                                    {formatCurrency(lineTotal)}
                                                </td>
                                                <td style={{padding: '8px 4px', textAlign: 'center'}}>
                                                    <button 
                                                        className="icon-btn text-red-500 hover:bg-red-50" 
                                                        onClick={() => removeItem(idx)}
                                                        style={{padding: '4px'}}
                                                        title="Remove item"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* SECTION 3: Order Summary */}
                    <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: '24px'}}>
                        <div className="po-summary" style={{width: '320px', background: 'var(--surface-color)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)'}}>
                            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '12px', color: 'var(--text-muted)', fontSize: '0.9rem'}}>
                                <span>Subtotal</span>
                                <span>{formatCurrency(totals.subtotal)}</span>
                            </div>
                            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '12px', color: 'var(--text-muted)', fontSize: '0.9rem'}}>
                                <span>Discount</span>
                                <span>-{formatCurrency(totals.discount)}</span>
                            </div>
                            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '16px', color: 'var(--text-muted)', fontSize: '0.9rem'}}>
                                <span>Tax</span>
                                <span>{formatCurrency(totals.tax)}</span>
                            </div>
                            <div style={{display: 'flex', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid var(--border-color)', color: 'var(--text-main)', fontWeight: 'bold', fontSize: '1.25rem'}}>
                                <span>Grand Total</span>
                                <span>{formatCurrency(totals.grandTotal)}</span>
                            </div>
                        </div>
                    </div>

                </div>
        </SharedDrawer>
    );
};

export default PurchaseOrderFormDrawer;
