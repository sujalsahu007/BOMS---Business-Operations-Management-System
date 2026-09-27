import React from 'react';
import { X, Lock, ArrowDown } from 'lucide-react';
import SharedDrawer from '../shared/SharedDrawer';
import './InventoryDrawers.css';
import './StockOperationsTab.css';

const POSITIVE_TYPES = new Set(['GoodsReceipt','TransferIn','AdjustmentIncrease','Initialization','Return']);

const TYPE_LABELS = {
    GoodsReceipt:       'Goods Receipt',
    TransferIn:         'Transfer In',
    TransferOut:        'Transfer Out',
    AdjustmentIncrease: 'Adjustment Increase',
    AdjustmentDecrease: 'Adjustment Decrease',
    Initialization:     'Initialization',
    Return:             'Return',
    StockOut:           'Stock Out',
};

const InventoryTransactionDetailDrawer = ({ transaction, onClose }) => {
    if (!transaction) return null;

    const isPos = POSITIVE_TYPES.has(transaction.transactionType);
    const typeLabel = TYPE_LABELS[transaction.transactionType] || transaction.transactionType;

    const titleNode = (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ margin: 0 }}>{transaction.transactionCode}</h2>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Transaction Detail</p>
        </div>
    );

    return (
        <SharedDrawer
            isOpen={true}
            onClose={onClose}
            title={transaction.transactionCode}
            subtitle="Transaction Detail"
            icon={Lock}
            width="600px"
        >
            <div className="inventory-drawer-content">
                {/* Immutable notice */}
                    <div className="so-alert info" style={{ marginBottom: '1.5rem' }}>
                        <Lock size={14} style={{ flexShrink: 0 }} />
                        <span>Immutable transaction record. This entry cannot be modified or deleted.</span>
                    </div>

                    {/* Stock Movement Visualization */}
                    <div className="so-viz-container" style={{ marginBottom: '1.5rem' }}>
                        <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                            Stock Movement
                        </p>
                        <div className="so-viz-node">
                            <span className="so-viz-node-label">Previous Stock</span>
                            <span className="so-viz-node-value">{transaction.previousQuantity ?? '—'}</span>
                        </div>
                        <ArrowDown size={16} className="so-viz-arrow" />
                        <div className={`so-viz-movement ${isPos ? 'pos' : 'neg'}`}>
                            {isPos ? '+' : '−'}{transaction.quantity}
                        </div>
                        <ArrowDown size={16} className="so-viz-arrow" />
                        <div className="so-viz-node">
                            <span className="so-viz-node-label">New Stock</span>
                            <span className="so-viz-node-value">{transaction.newQuantity ?? '—'}</span>
                        </div>
                    </div>

                    {/* Details */}
                    <div className="drawer-section">
                        <p className="drawer-section-title">Transaction Details</p>
                        <div className="detail-grid">
                            <div className="detail-item">
                                <span className="detail-label">Product</span>
                                <span className="detail-value">{transaction.productName}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Warehouse</span>
                                <span className="detail-value">{transaction.warehouseName}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Transaction Type</span>
                                <span className="detail-value">
                                    <span className={`so-txn-type-badge ${isPos ? 'txn-type-in' : 'txn-type-out'}`}>
                                        {typeLabel}
                                    </span>
                                </span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Quantity Changed</span>
                                <span className="detail-value" style={{ fontFamily: 'monospace', color: isPos ? '#059669' : '#dc2626', fontWeight: 700 }}>
                                    {isPos ? '+' : '−'}{transaction.quantity}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="drawer-section">
                        <p className="drawer-section-title">Audit Information</p>
                        <div className="detail-grid">
                            <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                                <span className="detail-label">Reason / Reference</span>
                                <span className="detail-value">{transaction.reason || '—'}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Created By</span>
                                <span className="detail-value">{transaction.creatorName}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Timestamp</span>
                                <span className="detail-value">{new Date(transaction.createdAt).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
        </SharedDrawer>
    );
};

export default InventoryTransactionDetailDrawer;
