import React, { useState, useEffect } from 'react';
import { X, SlidersHorizontal, AlertCircle, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { stockApi, warehousesApi, productsApi } from '../../services/api';
import SharedDrawer from '../shared/SharedDrawer';
import './InventoryDrawers.css';
import './StockOperationsTab.css';

const REASON_OPTIONS = ['Damaged', 'Lost', 'Found', 'Counting Correction', 'System Correction', 'Other'];

const StockAdjustmentCreateDrawer = ({ onClose, onSuccess }) => {
    const [step, setStep] = useState(1); // 1: Form, 2: Confirm

    const [warehouses, setWarehouses] = useState([]);
    const [products, setProducts] = useState([]);

    const [warehouseId, setWarehouseId] = useState('');
    const [productId, setProductId] = useState('');
    const [adjustmentType, setAdjustmentType] = useState('Increase');
    const [quantity, setQuantity] = useState('');
    const [reasonCategory, setReasonCategory] = useState('');
    const [customReason, setCustomReason] = useState('');

    const [currentStock, setCurrentStock] = useState(null);
    const [isCheckingStock, setIsCheckingStock] = useState(false);

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadData = async () => {
            try {
                const [whRes, prodRes] = await Promise.all([
                    warehousesApi.getAll(),
                    productsApi.getAll({ pageSize: 1000 })
                ]);
                const whData = whRes.data.items || (Array.isArray(whRes.data) ? whRes.data : []);
                setWarehouses(whData.filter(w => w.status === 'Active'));
                const prodData = prodRes.data.items || (Array.isArray(prodRes.data) ? prodRes.data : []);
                setProducts(prodData.filter(p => p.status === 'Active'));
            } catch (err) {
                setError('Failed to load data. Please try again.');
            }
        };
        loadData();
    }, []);

    useEffect(() => {
        if (!warehouseId || !productId) { setCurrentStock(null); return; }
        const check = async () => {
            setIsCheckingStock(true);
            setCurrentStock(null);
            try {
                const res = await stockApi.getOverview({ warehouseId, productId, pageSize: 1 });
                setCurrentStock(res.data.items?.[0]?.availableQuantity ?? 0);
            } catch (e) {
                setCurrentStock(0);
            } finally {
                setIsCheckingStock(false);
            }
        };
        check();
    }, [warehouseId, productId]);

    const getFinalReason = () => reasonCategory === 'Other' ? customReason : reasonCategory;

    const handleNext = (e) => {
        e.preventDefault();
        setError('');
        if (!reasonCategory) { setError('Please select a reason.'); return; }
        if (reasonCategory === 'Other' && !customReason.trim()) { setError('Please provide a custom reason.'); return; }
        const qty = Number(quantity);
        if (qty <= 0) { setError('Quantity must be greater than zero.'); return; }
        if (adjustmentType === 'Decrease' && currentStock !== null && qty > currentStock) {
            setError('Adjustment exceeds available stock. Cannot decrease below zero.');
            return;
        }
        setStep(2);
    };

    const handleConfirm = async () => {
        setError('');
        setSubmitting(true);
        try {
            await stockApi.createAdjustment({
                productId: Number(productId),
                warehouseId: Number(warehouseId),
                adjustmentType,
                quantity: Number(quantity),
                reason: getFinalReason()
            });
            onSuccess();
        } catch (err) {
            const msg = err.response?.status === 409
                ? 'Stock was updated by another user. Please refresh and try again.'
                : err.response?.data?.message || 'Adjustment could not be completed. No stock changes were made.';
            setError(msg);
            setSubmitting(false);
        }
    };

    const getProductName = () => products.find(p => p.productId.toString() === productId)?.productName || '';
    const getWarehouseName = () => warehouses.find(w => w.warehouseId.toString() === warehouseId)?.warehouseName || '';

    const qty = Number(quantity) || 0;
    const newStock = adjustmentType === 'Increase' ? (currentStock ?? 0) + qty : (currentStock ?? 0) - qty;
    const isNegativeResult = adjustmentType === 'Decrease' && qty > (currentStock ?? 0);
    const showPreview = qty > 0 && currentStock !== null;

    const footer = step === 1 ? (
        <div className="drawer-footer-actions" style={{display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem'}}>
            <button className="so-btn-secondary" onClick={onClose}>Cancel</button>
            <button
                className="so-btn-primary"
                form="adjustment-form"
                type="submit"
                disabled={isCheckingStock || isNegativeResult}
            >
                Review Adjustment
            </button>
        </div>
    ) : (
        <div className="drawer-footer-actions" style={{display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem'}}>
            <button className="so-btn-secondary" onClick={() => setStep(1)} disabled={submitting}>Back</button>
            <button className="so-btn-primary" onClick={handleConfirm} disabled={submitting}>
                {submitting ? 'Executing...' : `Confirm ${adjustmentType}`}
            </button>
        </div>
    );

    return (
        <SharedDrawer
            isOpen={true}
            onClose={onClose}
            title={step === 1 ? 'New Stock Adjustment' : 'Confirm Adjustment'}
            icon={SlidersHorizontal}
            width="800px"
            footer={footer}
        >
            <div className="inventory-drawer-content">
                    {error && (
                        <div className="so-alert warning">
                            <AlertCircle size={16} style={{ flexShrink: 0 }} />
                            <span>{error}</span>
                        </div>
                    )}

                    {step === 1 ? (
                        <form id="adjustment-form" onSubmit={handleNext}>
                            {/* Adjustment Details */}
                            <div className="drawer-section">
                                <p className="drawer-section-title">Adjustment Details</p>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Warehouse <span style={{color:'var(--error-color)'}}>*</span></label>
                                        <select value={warehouseId} onChange={e => setWarehouseId(e.target.value)} required>
                                            <option value="">Select warehouse...</option>
                                            {warehouses.map(w => (
                                                <option key={w.warehouseId} value={w.warehouseId}>{w.warehouseCode} — {w.warehouseName}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Product <span style={{color:'var(--error-color)'}}>*</span></label>
                                        <select value={productId} onChange={e => setProductId(e.target.value)} required>
                                            <option value="">Select product...</option>
                                            {products.map(p => (
                                                <option key={p.productId} value={p.productId}>{p.productCode} — {p.productName}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Current Stock Banner */}
                                {warehouseId && productId && (
                                    <div className="so-stock-banner">
                                        <span className="so-stock-banner-label">Current Available Stock</span>
                                        <span className={`so-stock-banner-value ${isCheckingStock ? 'loading' : ''}`}>
                                            {isCheckingStock ? 'Checking...' : currentStock !== null ? `${currentStock} units` : '—'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Adjustment */}
                            <div className="drawer-section">
                                <p className="drawer-section-title">Adjustment</p>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Type <span style={{color:'var(--error-color)'}}>*</span></label>
                                        <select value={adjustmentType} onChange={e => setAdjustmentType(e.target.value)} required>
                                            <option value="Increase">Increase Stock (+)</option>
                                            <option value="Decrease">Decrease Stock (−)</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Quantity <span style={{color:'var(--error-color)'}}>*</span></label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={quantity}
                                            onChange={e => setQuantity(e.target.value)}
                                            required
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                {/* Preview */}
                                {showPreview && (
                                    <div className={`so-preview-box ${isNegativeResult ? 'error' : ''}`}>
                                        <p className="so-preview-box-title">
                                            {isNegativeResult ? '⚠ Invalid Adjustment' : 'Result Preview'}
                                        </p>
                                        {isNegativeResult ? (
                                            <span className="so-preview-error-msg">
                                                Adjustment exceeds available stock ({currentStock} units). Cannot decrease below zero.
                                            </span>
                                        ) : (
                                            <div className="so-adj-preview">
                                                <span className="before">{currentStock}</span>
                                                <span className={`op ${adjustmentType === 'Increase' ? 'plus' : 'minus'}`}>
                                                    {adjustmentType === 'Increase' ? `+${qty}` : `−${qty}`}
                                                </span>
                                                <span className="equals">=</span>
                                                <span className="result">{newStock}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Reason */}
                            <div className="drawer-section">
                                <p className="drawer-section-title">Reason</p>
                                <div className="form-group">
                                    <label>Reason for Adjustment <span style={{color:'var(--error-color)'}}>*</span></label>
                                    <select value={reasonCategory} onChange={e => setReasonCategory(e.target.value)} required>
                                        <option value="">Select a reason...</option>
                                        {REASON_OPTIONS.map(r => (
                                            <option key={r} value={r}>{r}</option>
                                        ))}
                                    </select>
                                </div>
                                {reasonCategory === 'Other' && (
                                    <div className="form-group" style={{ marginTop: '0.75rem' }}>
                                        <label>Custom Reason <span style={{color:'var(--error-color)'}}>*</span></label>
                                        <input
                                            type="text"
                                            value={customReason}
                                            onChange={e => setCustomReason(e.target.value)}
                                            required
                                            placeholder="Describe the specific reason..."
                                        />
                                    </div>
                                )}
                            </div>
                        </form>
                    ) : (
                        <div className="so-confirmation">
                            <CheckCircle size={52} color="#059669" />
                            <h3>
                                {adjustmentType === 'Increase' ? 'Increase' : 'Decrease'} stock for<br />
                                <strong>{getProductName()}</strong>
                            </h3>
                            <div className="so-confirm-card">
                                <div className="so-confirm-row">
                                    <span className="so-confirm-label">Warehouse</span>
                                    <span className="so-confirm-value">{getWarehouseName()}</span>
                                </div>
                                <div className="so-confirm-row">
                                    <span className="so-confirm-label">Type</span>
                                    <span className="so-confirm-value">
                                        {adjustmentType === 'Increase'
                                            ? <span style={{color:'#059669', display:'flex', alignItems:'center', gap:4}}><TrendingUp size={14} /> Increase</span>
                                            : <span style={{color:'#dc2626', display:'flex', alignItems:'center', gap:4}}><TrendingDown size={14} /> Decrease</span>
                                        }
                                    </span>
                                </div>
                                <div className="so-confirm-row">
                                    <span className="so-confirm-label">Stock Impact</span>
                                    <span className="so-confirm-value" style={{ fontFamily: 'monospace' }}>
                                        {currentStock} → {newStock}
                                    </span>
                                </div>
                                <div className="so-confirm-row">
                                    <span className="so-confirm-label">Reason</span>
                                    <span className="so-confirm-value">{getFinalReason()}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
        </SharedDrawer>
    );
};

export default StockAdjustmentCreateDrawer;
