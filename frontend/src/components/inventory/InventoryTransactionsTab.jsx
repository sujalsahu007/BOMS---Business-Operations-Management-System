import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, ChevronLeft, ChevronRight, History, Search, Lock } from 'lucide-react';
import { stockApi } from '../../services/api';
import InventoryTransactionDetailDrawer from './InventoryTransactionDetailDrawer';
import './SuppliersTab.css';
import './StockOperationsTab.css';

const TYPE_COLORS = {
    GoodsReceipt:        { label: 'Goods Receipt',    cls: 'txn-type-in' },
    TransferIn:          { label: 'Transfer In',       cls: 'txn-type-in' },
    AdjustmentIncrease:  { label: 'Adj. Increase',    cls: 'txn-type-in' },
    Initialization:      { label: 'Initialization',   cls: 'txn-type-in' },
    Return:              { label: 'Return',            cls: 'txn-type-in' },
    TransferOut:         { label: 'Transfer Out',      cls: 'txn-type-out' },
    AdjustmentDecrease:  { label: 'Adj. Decrease',    cls: 'txn-type-out' },
    StockOut:            { label: 'Stock Out',         cls: 'txn-type-out' },
};

const POSITIVE_TYPES = new Set(['GoodsReceipt','TransferIn','AdjustmentIncrease','Initialization','Return']);

const InventoryTransactionsTab = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);
    const pageSize = 20;
    const [selectedTxn, setSelectedTxn] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('');

    const loadTransactions = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await stockApi.getTransactions({ page, pageSize });
            setTransactions(res.data.items || []);
            setTotalCount(res.data.totalCount || 0);
        } catch (err) {
            setError('Unable to load inventory transactions.');
            console.error('Failed to load transactions', err);
        } finally {
            setLoading(false);
        }
    }, [page, pageSize]);

    useEffect(() => { loadTransactions(); }, [loadTransactions]);

    const filtered = transactions.filter(t => {
        const matchSearch = !searchTerm ||
            t.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.transactionCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.warehouseName?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchType = !typeFilter || t.transactionType === typeFilter;
        return matchSearch && matchType;
    });

    return (
        <div className="contracts-module-wrapper" style={{ height: '100%' }}>
            <div className="tab-container">
                <div className="tab-header">
                    <div className="search-filter-group">
                        <div className="search-bar">
                            <Search size={16} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search by product, code or warehouse..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <select className="filter-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                            <option value="">All Types</option>
                            {Object.entries(TYPE_COLORS).map(([key, val]) => (
                                <option key={key} value={key}>{val.label}</option>
                            ))}
                        </select>

                        {(searchTerm || typeFilter) && (
                            <button className="secondary-btn" style={{ padding: '6px 12px', fontSize: '0.875rem' }} onClick={() => { setSearchTerm(''); setTypeFilter(''); }}>
                                Clear
                            </button>
                        )}
                        <button className="icon-btn" onClick={loadTransactions} title="Refresh" disabled={loading}>
                            <RefreshCw size={18} className={loading ? 'spin' : ''} />
                        </button>
                    </div>

                    <div className="action-group">
                        <div className="so-immutable-notice" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'var(--bg-tertiary)', borderRadius: '6px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            <Lock size={14} />
                            <span>Immutable Records</span>
                        </div>
                    </div>
                </div>

            {/* Content */}
            <div className="module-content">
                {error ? (
                    <div className="so-error-state">
                        <p>{error}</p>
                        <button className="so-btn-secondary" onClick={loadTransactions}>Retry</button>
                    </div>
                ) : loading ? (
                    <div className="enterprise-table-container">
                        <table className="enterprise-table">
                            <thead>
                                <tr>
                                    <th>Code</th>
                                    <th>Date</th>
                                    <th>Product</th>
                                    <th>Warehouse</th>
                                    <th>Type</th>
                                    <th>Previous</th>
                                    <th>Change</th>
                                    <th>New</th>
                                    <th>Created By</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[1,2,3,4,5].map(i => (
                                    <tr key={i}>
                                        {[1,2,3,4,5,6,7,8,9].map(j => (
                                            <td key={j}><div className="skeleton h-4" style={{width: '80%'}}></div></td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="enterprise-empty-state">
                        <div className="empty-icon-wrapper">
                            <History size={40} />
                        </div>
                        <h3>No inventory transactions found.</h3>
                        <p>Transactions will appear here automatically when stock changes occur.</p>
                    </div>
                ) : (
                    <div className="enterprise-table-container">
                        <table className="enterprise-table txn-table">
                            <thead>
                                <tr>
                                    <th>Code</th>
                                    <th>Date</th>
                                    <th>Product</th>
                                    <th>Warehouse</th>
                                    <th>Type</th>
                                    <th>Previous</th>
                                    <th>Change</th>
                                    <th>New</th>
                                    <th>Created By</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(t => {
                                    const isPos = POSITIVE_TYPES.has(t.transactionType);
                                    const typeInfo = TYPE_COLORS[t.transactionType] || { label: t.transactionType, cls: '' };
                                    return (
                                        <tr
                                            key={t.transactionId}
                                            className="txn-row"
                                            onClick={() => setSelectedTxn(t)}
                                            title="Click to view details"
                                        >
                                            <td><span className="code-font">{t.transactionCode}</span></td>
                                            <td><span className="td-secondary">{new Date(t.createdAt).toLocaleString()}</span></td>
                                            <td><span className="td-primary">{t.productName}</span></td>
                                            <td><span className="td-secondary">{t.warehouseName}</span></td>
                                            <td>
                                                <span className={`so-txn-type-badge ${typeInfo.cls}`}>
                                                    {typeInfo.label}
                                                </span>
                                            </td>
                                            <td><span className="txn-qty prev">{t.previousQuantity ?? '—'}</span></td>
                                            <td>
                                                <span className={`txn-qty change ${isPos ? 'pos' : 'neg'}`}>
                                                    {isPos ? '+' : '-'}{t.quantity}
                                                </span>
                                            </td>
                                            <td><span className="txn-qty next">{t.newQuantity ?? '—'}</span></td>
                                            <td><span className="td-secondary">{t.creatorName}</span></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {!loading && totalCount > pageSize && (
                <div className="module-pagination">
                    <span className="pagination-info">
                        Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, totalCount)} of {totalCount}
                    </span>
                    <div className="pagination-controls">
                        <button className="so-btn-icon" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                            <ChevronLeft size={16} />
                        </button>
                        <span className="page-number">Page {page}</span>
                        <button className="so-btn-icon" disabled={page * pageSize >= totalCount} onClick={() => setPage(p => p + 1)}>
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {selectedTxn && (
                <InventoryTransactionDetailDrawer
                    transaction={selectedTxn}
                    onClose={() => setSelectedTxn(null)}
                />
            )}
            </div>
        </div>
    );
};

export default InventoryTransactionsTab;
