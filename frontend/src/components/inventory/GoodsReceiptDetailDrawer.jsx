import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { X, Package, Calendar, User, FileText, CheckCircle } from 'lucide-react';
import ActivityTimeline from '../shared/ActivityTimeline';
import SharedDrawer from '../shared/SharedDrawer';
import './InventoryDrawers.css';

export default function GoodsReceiptDetailDrawer({ receiptId, onClose }) {
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/goodsreceipts/${receiptId}`);
        setReceipt(res.data);
      } catch (err) {
        setError('Failed to load goods receipt details.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [receiptId]);

  if (loading) {
    return (
      <SharedDrawer isOpen={true} onClose={onClose} title="Loading Receipt..." icon={Package} width="1000px">
        <div className="inventory-drawer-content loading">
          <div className="loading-spinner" />
          <p>Loading details...</p>
        </div>
      </SharedDrawer>
    );
  }

  if (error || !receipt) {
    return (
      <SharedDrawer isOpen={true} onClose={onClose} title="Error" icon={Package} width="1000px">
        <div className="inventory-drawer-content error">
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      </SharedDrawer>
    );
  }

  const totalOrdered = receipt.items.reduce((sum, item) => sum + item.orderedQuantity, 0);
  const totalReceived = receipt.items.reduce((sum, item) => sum + item.totalReceived, 0);
  const totalRemaining = receipt.items.reduce((sum, item) => sum + item.remainingQuantity, 0);
  const progressPercent = totalOrdered > 0 ? Math.round((totalReceived / totalOrdered) * 100) : 0;

  return (
    <SharedDrawer
        isOpen={true}
        onClose={onClose}
        title={`Goods Receipt: ${receipt.receiptNumber}`}
        subtitle={<span className="status-badge status-active">{receipt.status}</span>}
        icon={Package}
        width="1000px"
    >
        <div className="inventory-drawer-content has-sections">
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Purchase Order</span>
              <span className="info-value">{receipt.poNumber}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Supplier</span>
              <span className="info-value">{receipt.supplierName}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Warehouse</span>
              <span className="info-value">{receipt.warehouseName} ({receipt.warehouseCode})</span>
            </div>
            <div className="info-item">
              <span className="info-label">Receipt Date</span>
              <span className="info-value">{new Date(receipt.receiptDate).toLocaleString()}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Received By</span>
              <span className="info-value">{receipt.receivedByName}</span>
            </div>
            {receipt.remarks && (
              <div className="info-item full-width">
                <span className="info-label">Remarks</span>
                <span className="info-value">{receipt.remarks}</span>
              </div>
            )}
          </div>

          <div className="section-divider mt-lg">
            <Package className="icon-sm" />
            <h3>PO Receiving Progress</h3>
          </div>
          <div className="mb-md">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
              <span>Ordered: <strong>{totalOrdered}</strong></span>
              <span>Received: <strong>{totalReceived}</strong></span>
              <span>Remaining: <strong>{totalRemaining}</strong></span>
              <span className="text-success fw-600">{progressPercent}%</span>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

          <div className="section-divider mt-lg">
            <Package className="icon-sm" />
            <h3>Items Received</h3>
          </div>
          
          <table className="data-table mt-sm">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th className="text-right">Ordered</th>
                <th className="text-right">Previously Received</th>
                <th className="text-right">Received Now</th>
                <th className="text-right">Total Received</th>
                <th className="text-right">Remaining</th>
              </tr>
            </thead>
            <tbody>
              {receipt.items.map(item => (
                <tr key={item.receiptItemId}>
                  <td>{item.productName}</td>
                  <td>{item.sku}</td>
                  <td className="text-right">{item.orderedQuantity}</td>
                  <td className="text-right text-muted">{item.previouslyReceivedQuantity}</td>
                  <td className="text-right fw-600 text-success">+{item.receivedNowQuantity}</td>
                  <td className="text-right fw-500">{item.totalReceived}</td>
                  <td className="text-right">{item.remainingQuantity}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {receipt.inventoryTransactions && receipt.inventoryTransactions.length > 0 && (
            <>
              <div className="section-divider mt-md">
                <FileText className="icon-sm" />
                <h3>Inventory Transactions</h3>
              </div>
              <table className="data-table mt-sm">
                <thead>
                  <tr>
                    <th>Txn Code</th>
                    <th>Product</th>
                    <th>Type</th>
                    <th className="text-right">Stock Impact</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {receipt.inventoryTransactions.map(txn => (
                    <tr key={txn.transactionCode}>
                      <td>{txn.transactionCode}</td>
                      <td>{txn.productName}</td>
                      <td><span className="status-badge status-active">{txn.transactionType}</span></td>
                      <td className="text-right">
                        <span className="text-muted">{txn.previousQuantity}</span>
                        <span className="text-success fw-600 mx-xs"> +{txn.quantity} </span>
                        <span className="fw-500">→ {txn.newQuantity}</span>
                      </td>
                      <td>{new Date(txn.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          <div className="section-divider mt-md">
            <CheckCircle className="icon-sm" />
            <h3>Activity Timeline</h3>
          </div>
          <div className="mt-sm mb-lg">
            <ActivityTimeline activities={receipt.recentActivities} />
          </div>

          <div className="immutable-notice mt-xl">
            <CheckCircle className="icon-sm text-success" />
            <span>This goods receipt has been successfully processed and is immutable. Historical inventory records cannot be deleted.</span>
          </div>
        </div>
    </SharedDrawer>
  );
}
