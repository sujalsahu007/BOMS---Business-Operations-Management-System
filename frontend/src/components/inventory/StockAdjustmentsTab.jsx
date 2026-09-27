import React, { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw, ChevronLeft, ChevronRight, SlidersHorizontal, Search, TrendingUp, TrendingDown } from 'lucide-react';
import { stockApi } from '../../services/api';
import StockAdjustmentCreateDrawer from './StockAdjustmentCreateDrawer';
import './SuppliersTab.css';
import './StockOperationsTab.css';

const StockAdjustmentsTab = () => {
    const [adjustments, setAdjustments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);
    const pageSize = 20;
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('');

    const loadAdjustments = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await stockApi.getAdjustments({ page, pageSize });
            setAdjustments(res.data.items || []);
            setTotalCount(res.data.totalCount || 0);
        } catch (err) {
            setError('Unable to load stock adjustments.');
            console.error('Failed to load adjustments', err);
        } finally {
            setLoading(false);
        }
    }, [page, pageSize]);

    useEffect(() => { loadAdjustments(); }, [loadAdjustments]);

    const filtered = adjustments.filter(a => {
        const matchSearch = !searchTerm ||
            a.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.adjustmentNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.warehouseName?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchType = !typeFilter || a.adjustmentType === typeFilter;
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
                                placeholder="Search by product, ID or warehouse..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        
                        <select className="filter-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                            <option value="">All Types</option>
                            <option value="Increase">Increase</option>
                            <option value="Decrease">Decrease</option>
                        </select>

                        { (searchTerm || typeFilter) && (
                            <button className="secondary-btn" style={{ padding: '6px 12px', fontSize: '0.875rem' }} onClick={() => { setSearchTerm(''); setTypeFilter(''); }}>
                                Clear
                            </button>
                        )}
                        <button className="icon-btn" onClick={loadAdjustments} title="Refresh" disabled={loading}>
                            <RefreshCw size={18} className={loading ? 'spin' : ''} />
                        </button>
                    </div>

                    <div className="action-group">
                        <button className="primary-btn" onClick={() => setIsCreateOpen(true)}>
                            <Plus size={18} />
                            <span>New Adjustment</span>
                        </button>
                    </div>
                </div>

            {/* Content */}
            <div className="module-content">
                {error ? (
                    <div className="so-error-state">
                        <p>{error}</p>
                        <button className="so-btn-secondary" onClick={loadAdjustments}>Retry</button>
                    </div>
                ) : loading ? (
                    <div className="enterprise-table-container">
                        <table className="enterprise-table">
                            <thead>
                                <tr>
                                    <th>Adjustment ID</th>
                                    <th>Date</th>
                                    <th>Product</th>
                                    <th>Warehouse</th>
                                    <th>Type</th>
                                    <th>Quantity</th>
                                    <th>Reason</th>
                                    <th>Created By</th>
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
                            <SlidersHorizontal size={40} />
                        </div>
                        <h3>No stock adjustments yet.</h3>
                        <p>Use adjustments to correct physical or system stock discrepancies.</p>
                        <button className="so-btn-primary" style={{marginTop: '1rem'}} onClick={() => setIsCreateOpen(true)}>
                            Create First Adjustment
                        </button>
                    </div>
                ) : (
                    <div className="enterprise-table-container">
                        <table className="enterprise-table">
                            <thead>
                                <tr>
                                    <th>Adjustment ID</th>
                                    <th>Date</th>
                                    <th>Product</th>
                                    <th>Warehouse</th>
                                    <th>Type</th>
                                    <th>Quantity</th>
                                    <th>Reason</th>
                                    <th>Created By</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(a => (
                                    <tr key={a.adjustmentId}>
                                        <td><span className="code-font">{a.adjustmentNumber}</span></td>
                                        <td><span className="td-primary">{new Date(a.createdAt).toLocaleDateString()}</span></td>
                                        <td><span className="td-primary">{a.productName}</span></td>
                                        <td><span className="td-secondary">{a.warehouseName}</span></td>
                                        <td>
                                            <span className={`so-type-badge ${a.adjustmentType === 'Increase' ? 'increase' : 'decrease'}`}>
                                                {a.adjustmentType === 'Increase'
                                                    ? <><TrendingUp size={12} /> Increase</>
                                                    : <><TrendingDown size={12} /> Decrease</>
                                                }
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`so-qty-badge ${a.adjustmentType === 'Increase' ? 'positive' : 'negative'}`}>
                                                {a.adjustmentType === 'Increase' ? '+' : '-'}{a.quantity}
                                            </span>
                                        </td>
                                        <td><span className="td-secondary so-reason-cell">{a.reason}</span></td>
                                        <td><span className="td-secondary">{a.creatorName}</span></td>
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
                <StockAdjustmentCreateDrawer
                    onClose={() => setIsCreateOpen(false)}
                    onSuccess={() => { setIsCreateOpen(false); loadAdjustments(); }}
                />
            )}
            </div>
        </div>
    );
};

export default StockAdjustmentsTab;
