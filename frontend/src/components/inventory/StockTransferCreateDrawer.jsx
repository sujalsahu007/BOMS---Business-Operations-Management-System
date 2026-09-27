import React, { useState, useEffect } from 'react';
import { X, ArrowRightLeft, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { stockApi, warehousesApi, productsApi } from '../../services/api';
import SharedDrawer from '../shared/SharedDrawer';
import './InventoryDrawers.css';
import './StockOperationsTab.css';

const StockTransferCreateDrawer = ({ onClose, onSuccess }) => {
    const [step, setStep] = useState(1); // 1: Form, 2: Confirm

    const [warehouses, setWarehouses] = useState([]);
    const [products, setProducts] = useState([]);

    const [sourceWarehouseId, setSourceWarehouseId] = useState('');
    const [destinationWarehouseId, setDestinationWarehouseId] = useState('');
    const [productId, setProductId] = useState('');
    const [quantity, setQuantity] = useState('');
    const [remarks, setRemarks] = useState('');

    const [sourceStock, setSourceStock] = useState(null);
    const [destStock, setDestStock] = useState(null);
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
        if (!productId) { setSourceStock(null); setDestStock(null); return; }
        const check = async () => {
            setIsCheckingStock(true);
            try {
                const calls = [];
                if (sourceWarehouseId) calls.push(stockApi.getOverview({ warehouseId: sourceWarehouseId, productId, pageSize: 1 }));
                else calls.push(Promise.resolve(null));
                if (destinationWarehouseId) calls.push(stockApi.getOverview({ warehouseId: destinationWarehouseId, productId, pageSize: 1 }));
                else calls.push(Promise.resolve(null));

                const [srcRes, dstRes] = await Promise.all(calls);
                setSourceStock(srcRes ? (srcRes.data.items?.[0]?.availableQuantity ?? 0) : null);
                setDestStock(dstRes ? (dstRes.data.items?.[0]?.availableQuantity ?? 0) : null);
            } catch (e) {
                console.error('Stock check failed', e);
            } finally {
                setIsCheckingStock(false);
            }
        };
        check();
    }, [sourceWarehouseId, destinationWarehouseId, productId]);

    const handleNext = (e) => {
        e.preventDefault();
        setError('');
        if (sourceWarehouseId === destinationWarehouseId) { setError('Source and destination warehouses must be different.'); return; }
        const qty = Number(quantity);
        if (qty <= 0) { setError('Transfer quantity must be greater than zero.'); return; }
        if (sourceStock !== null && qty > sourceStock) { setError(`Only ${sourceStock} units available in source warehouse.`); return; }
        setStep(2);
    };

    const handleConfirm = async () => {
        setError('');
        setSubmitting(true);
        try {
            await stockApi.createTransfer({
                productId: Number(productId),
                sourceWarehouseId: Number(sourceWarehouseId),
                destinationWarehouseId: Number(destinationWarehouseId),
                quantity: Number(quantity),
                remarks
            });
            onSuccess();
        } catch (err) {
            const msg = err.response?.status === 409
                ? 'Stock was updated by another user. Please refresh and try again.'
                : err.response?.data?.message || 'Transfer could not be completed. No stock changes were made.';
            setError(msg);
            setSubmitting(false);
        }
    };

    const getProductName = () => products.find(p => p.productId.toString() === productId)?.productName || '';
    const getSrcName = () => warehouses.find(w => w.warehouseId.toString() === sourceWarehouseId)?.warehouseName || '';
    const getDstName = () => warehouses.find(w => w.warehouseId.toString() === destinationWarehouseId)?.warehouseName || '';

    const qty = Number(quantity) || 0;
    const showPreview = productId && sourceWarehouseId && destinationWarehouseId &&
        qty > 0 && sourceStock !== null && qty <= sourceStock;

    const footer = step === 1 ? (
        <div className="drawer-footer-actions" style={{display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem'}}>
            <button className="so-btn-secondary" onClick={onClose}>Cancel</button>
            <button
                className="so-btn-primary"
                form="transfer-form"
                type="submit"
                disabled={isCheckingStock || (sourceStock !== null && qty > sourceStock)}
            >
                Review Transfer
            </button>
        </div>
    ) : (
        <div className="drawer-footer-actions" style={{display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem'}}>
            <button className="so-btn-secondary" onClick={() => setStep(1)} disabled={submitting}>Back</button>
            <button className="so-btn-primary" onClick={handleConfirm} disabled={submitting}>
                {submitting ? 'Transferring...' : 'Confirm Transfer'}
            </button>
        </div>
    );

    return (
        <SharedDrawer
            isOpen={true}
            onClose={onClose}
            title={step === 1 ? 'New Stock Transfer' : 'Confirm Transfer'}
            icon={ArrowRightLeft}
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
                        <form id="transfer-form" onSubmit={handleNext}>
                            {/* Transfer Details */}
                            <div className="drawer-section">
                                <p className="drawer-section-title">Transfer Details</p>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Source Warehouse <span style={{color:'var(--error-color)'}}>*</span></label>
                                        <select value={sourceWarehouseId} onChange={e => setSourceWarehouseId(e.target.value)} required>
                                            <option value="">Select source...</option>
                                            {warehouses.map(w => (
                                                <option key={w.warehouseId} value={w.warehouseId}>{w.warehouseCode} — {w.warehouseName}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Destination Warehouse <span style={{color:'var(--error-color)'}}>*</span></label>
                                        <select value={destinationWarehouseId} onChange={e => setDestinationWarehouseId(e.target.value)} required>
                                            <option value="">Select destination...</option>
                                            {warehouses.map(w => (
                                                <option key={w.warehouseId} value={w.warehouseId}>{w.warehouseCode} — {w.warehouseName}</option>
                                            ))}
                                        </select>
                                    </div>
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

                            {/* Stock Availability */}
                            {productId && sourceWarehouseId && (
                                <div className="drawer-section">
                                    <p className="drawer-section-title">Stock Availability</p>
                                    <div className="so-stock-banner">
                                        <span className="so-stock-banner-label">Available in {getSrcName()}</span>
                                        <span className={`so-stock-banner-value ${isCheckingStock ? 'loading' : ''}`}>
                                            {isCheckingStock ? 'Checking...' : sourceStock !== null ? `${sourceStock} units` : '—'}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Quantity & Remarks */}
                            <div className="drawer-section">
                                <p className="drawer-section-title">Transfer Quantity</p>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Quantity <span style={{color:'var(--error-color)'}}>*</span></label>
                                        <input
                                            type="number"
                                            min="1"
                                            max={sourceStock ?? undefined}
                                            value={quantity}
                                            onChange={e => setQuantity(e.target.value)}
                                            required
                                            placeholder="0"
                                        />
                                        {sourceStock !== null && qty > sourceStock && (
                                            <span className="so-field-error">
                                                <AlertCircle size={12} /> Exceeds available stock ({sourceStock} units)
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Reason / Remarks <span style={{color:'var(--error-color)'}}>*</span></label>
                                    <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows="2" required placeholder="Why is this stock being transferred?" />
                                </div>

                                {showPreview && (
                                    <div className="so-preview-box">
                                        <p className="so-preview-box-title">Transfer Preview</p>
                                        <div className="so-transfer-flow">
                                            <div className="so-warehouse-block">
                                                <div className="so-warehouse-block-label">Source</div>
                                                <div className="so-warehouse-block-name">{getSrcName()}</div>
                                                <div className="so-stock-change">
                                                    <span className="before">{sourceStock}</span>
                                                    <span className="arrow">→</span>
                                                    <span className="after">{sourceStock - qty}</span>
                                                </div>
                                            </div>
                                            <div className="so-flow-arrow">
                                                <ArrowRight size={18} />
                                                <span style={{ fontSize: '0.75rem', marginTop: '2px', color: 'var(--primary-color)', fontWeight: 700 }}>{qty} units</span>
                                            </div>
                                            <div className="so-warehouse-block">
                                                <div className="so-warehouse-block-label">Destination</div>
                                                <div className="so-warehouse-block-name">{getDstName()}</div>
                                                <div className="so-stock-change">
                                                    <span className="before">{destStock ?? 0}</span>
                                                    <span className="arrow">→</span>
                                                    <span className="after">{(destStock ?? 0) + qty}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </form>
                    ) : (
                        <div className="so-confirmation">
                            <CheckCircle size={52} color="#059669" />
                            <h3>Transfer {qty} units of<br /><strong>{getProductName()}</strong></h3>
                            <div className="so-confirm-card">
                                <div className="so-confirm-row">
                                    <span className="so-confirm-label">From</span>
                                    <span className="so-confirm-value">{getSrcName()}</span>
                                </div>
                                <div className="so-confirm-row">
                                    <span className="so-confirm-label">To</span>
                                    <span className="so-confirm-value">{getDstName()}</span>
                                </div>
                                <div className="so-confirm-row">
                                    <span className="so-confirm-label">Source Stock</span>
                                    <span className="so-confirm-value" style={{ fontFamily: 'monospace' }}>{sourceStock} → {sourceStock - qty}</span>
                                </div>
                                <div className="so-confirm-row">
                                    <span className="so-confirm-label">Dest. Stock</span>
                                    <span className="so-confirm-value" style={{ fontFamily: 'monospace' }}>{destStock ?? 0} → {(destStock ?? 0) + qty}</span>
                                </div>
                                <div className="so-confirm-row">
                                    <span className="so-confirm-label">Remarks</span>
                                    <span className="so-confirm-value">{remarks}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
        </SharedDrawer>
    );
};

export default StockTransferCreateDrawer;
