import React, { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw, ChevronLeft, ChevronRight, ArrowRightLeft, Search } from 'lucide-react';
import { stockApi } from '../../services/api';
import StockTransferCreateDrawer from './StockTransferCreateDrawer';
import './SuppliersTab.css';
import './StockOperationsTab.css';

const StockTransfersTab = () => {
    const [transfers, setTransfers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);
    const pageSize = 20;
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const loadTransfers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await stockApi.getTransfers({ page, pageSize });
            setTransfers(res.data.items || []);
            setTotalCount(res.data.totalCount || 0);
        } catch (err) {
            setError('Unable to load stock transfers.');
            console.error('Failed to load transfers', err);
        } finally {
            setLoading(false);
        }
    }, [page, pageSize]);

    useEffect(() => { loadTransfers(); }, [loadTransfers]);

    const filtered = transfers.filter(t =>
        !searchTerm ||
        t.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.transferNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.sourceWarehouseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.destinationWarehouseName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="contracts-module-wrapper" style={{ height: '100%' }}>
            <div className="tab-container">
                <div className="tab-header">
                    <div className="search-filter-group">
                        <div className="search-bar">
                            <Search size={16} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search by product, ID or warehouse..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>

                        { searchTerm && (
                            <button className="secondary-btn" style={{ padding: '6px 12px', fontSize: '0.875rem' }} onClick={() => setSearchTerm('')}>
                                Clear
                            </button>
                        )}
                        <button className="icon-btn" onClick={loadTransfers} title="Refresh" disabled={loading}>
                            <RefreshCw size={18} className={loading ? 'spin' : ''} />
                        </button>
                    </div>

                    <div className="action-group">
                        <button className="primary-btn" onClick={() => setIsCreateOpen(true)}>
                            <Plus size={18} />
                            <span>New Transfer</span>
                        </button>
                    </div>
                </div>

            {/* Content */}
            <div className="module-content">
                {error ? (
                    <div className="so-error-state">
                        <p>{error}</p>
                        <button className="so-btn-secondary" onClick={loadTransfers}>Retry</button>
                    </div>
                ) : loading ? (
                    <div className="enterprise-table-container">
                        <table className="enterprise-table">
                            <thead>
                                <tr>
                                    <th>Transfer ID</th>
                                    <th>Date</th>
                                    <th>Product</th>
                                    <th>Source Warehouse</th>
                                    <th>Destination Warehouse</th>
                                    <th>Quantity</th>
                                    <th>Created By</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[1, 2, 3, 4].map(i => (
                                    <tr key={i}>
                                        {[1,2,3,4,5,6,7,8].map(j => (
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
                            <ArrowRightLeft size={40} />
                        </div>
                        <h3>No stock transfers yet.</h3>
                        <p>Move inventory between active warehouses using a stock transfer.</p>
                        <button className="so-btn-primary" style={{marginTop: '1rem'}} onClick={() => setIsCreateOpen(true)}>
                            Create First Transfer
                        </button>
                    </div>
                ) : (
                    <div className="enterprise-table-container">
                        <table className="enterprise-table">
                            <thead>
                                <tr>
                                    <th>Transfer ID</th>
                                    <th>Date</th>
                                    <th>Product</th>
                                    <th>Source</th>
                                    <th>Destination</th>
                                    <th>Qty</th>
                                    <th>Created By</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(t => (
                                    <tr key={t.transferId}>
                                        <td><span className="code-font">{t.transferNumber}</span></td>
                                        <td><span className="td-primary">{new Date(t.createdAt).toLocaleDateString()}</span></td>
                                        <td><span className="td-primary">{t.productName}</span></td>
                                        <td><span className="td-secondary">{t.sourceWarehouseName}</span></td>
                                        <td><span className="td-secondary">{t.destinationWarehouseName}</span></td>
                                        <td><span className="so-qty-badge">{t.quantity}</span></td>
                                        <td><span className="td-secondary">{t.creatorName}</span></td>
                                        <td><span className="status-badge active">{t.status || 'Completed'}</span></td>
                                    </tr>
                                ))}
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

            {isCreateOpen && (
                <StockTransferCreateDrawer
                    onClose={() => setIsCreateOpen(false)}
                    onSuccess={() => { setIsCreateOpen(false); loadTransfers(); }}
                />
            )}
            </div>
        </div>
    );
};

export default StockTransfersTab;
