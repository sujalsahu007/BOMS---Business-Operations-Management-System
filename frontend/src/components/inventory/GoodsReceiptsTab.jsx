import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Package, Search, Plus, Eye, RefreshCw } from 'lucide-react';
import GoodsReceiptCreateDrawer from './GoodsReceiptCreateDrawer';
import GoodsReceiptDetailDrawer from './GoodsReceiptDetailDrawer';
import './GoodsReceiptsTab.css';

export default function GoodsReceiptsTab() {
  const [receipts, setReceipts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [selectedReceiptId, setSelectedReceiptId] = useState(null);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      setError(null);
      let url = `/goodsreceipts?page=${page}&pageSize=${pageSize}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (status) url += `&status=${status}`;

      const res = await api.get(url);
      setReceipts(res.data.items);
      setTotalCount(res.data.totalCount);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch goods receipts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchReceipts();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [search, status, page, pageSize]);

  return (
    <div className="contracts-module-wrapper" style={{ height: '100%' }}>
      <div className="tab-container">
        <div className="tab-header">
          <div className="search-filter-group">
            <div className="search-bar">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search receipts, POs, or suppliers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <select className="filter-select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="Completed">Completed</option>
            </select>

            {(search || status) && (
              <button 
                className="secondary-btn" 
                style={{ padding: '6px 12px', fontSize: '0.875rem' }} 
                onClick={() => { setSearch(''); setStatus(''); }}
              >
                Clear Filters
              </button>
            )}

            <button className="icon-btn" onClick={fetchReceipts} title="Refresh">
              <RefreshCw size={18} className={loading ? "spin" : ""} />
            </button>
          </div>

          <div className="action-group">
            <button className="primary-btn" onClick={() => setIsCreateDrawerOpen(true)}>
              <Plus size={18} />
              <span>Create Receipt</span>
            </button>
          </div>
        </div>

      {error && <div className="error-message">{error}</div>}

      <div className="table-container">
        {loading && receipts.length === 0 ? (
          <div className="loading-skeleton">Loading receipts...</div>
        ) : receipts.length === 0 ? (
          <div className="empty-state">
            <Package className="empty-icon" />
            <h3>No receipts found</h3>
            <p>No goods receipts have been created yet.</p>
            <button className="btn-secondary" onClick={() => setIsCreateDrawerOpen(true)}>
              Create First Receipt
            </button>
          </div>
        ) : (
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Receipt #</th>
                <th>PO Number</th>
                <th>Supplier</th>
                <th>Date Received</th>
                <th>Received By</th>
                <th>Status</th>
                <th className="actions-col"></th>
              </tr>
            </thead>
            <tbody>
              {receipts.map((gr) => (
                <tr key={gr.receiptId}>
                  <td className="fw-500">{gr.receiptNumber}</td>
                  <td>
                    <div className="po-supplier-group">
                      <span className="po-number">{gr.poNumber}</span>
                      <span className="supplier-name">{gr.supplierName}</span>
                    </div>
                  </td>
                  <td>{gr.warehouseCode}</td>
                  <td>{new Date(gr.receiptDate).toLocaleDateString()}</td>
                  <td>{gr.totalItems}</td>
                  <td>
                    <span className={`status-badge ${gr.status === 'Completed' ? 'status-active' : ''}`}>{gr.status}</span>
                  </td>
                  <td>
                    <button className="btn-icon" onClick={() => setSelectedReceiptId(gr.receiptId)} title="View Detail">
                      <Eye className="icon-sm" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalCount > 0 && (
        <div className="pagination">
          <button 
            disabled={page === 1} 
            onClick={() => setPage(p => p - 1)}
          >
            Previous
          </button>
          <span>Page {page}</span>
          <button 
            disabled={page * pageSize >= totalCount} 
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </button>
        </div>
      )}

      {isCreateDrawerOpen && (
        <GoodsReceiptCreateDrawer 
          onClose={() => setIsCreateDrawerOpen(false)}
          onSuccess={() => {
            setIsCreateDrawerOpen(false);
            fetchReceipts();
          }}
        />
      )}

      {selectedReceiptId && (
        <GoodsReceiptDetailDrawer
          isOpen={!!selectedReceiptId}
          onClose={() => setSelectedReceiptId(null)}
          receiptId={selectedReceiptId}
        />
      )}
      </div>
    </div>
  );
}
