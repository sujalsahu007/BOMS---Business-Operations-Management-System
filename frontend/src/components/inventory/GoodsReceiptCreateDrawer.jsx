import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { X, CheckCircle, Package, ArrowRight, AlertTriangle } from 'lucide-react';
import SharedDrawer from '../shared/SharedDrawer';
import './InventoryDrawers.css';

export default function GoodsReceiptCreateDrawer({ onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1: Select PO, 2: Review & Quantities
  
  // Step 1 State
  const [eligiblePOs, setEligiblePOs] = useState([]);
  const [loadingPOs, setLoadingPOs] = useState(true);
  const [poSearch, setPoSearch] = useState('');
  const [selectedPO, setSelectedPO] = useState(null);

  // Step 2 State
  const [receiveQuantities, setReceiveQuantities] = useState({});
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEligiblePOs();
  }, [poSearch]);

  const fetchEligiblePOs = async () => {
    try {
      setLoadingPOs(true);
      let url = '/goodsreceipts/eligible-pos?page=1&pageSize=50';
      if (poSearch) url += `&search=${encodeURIComponent(poSearch)}`;
      const res = await api.get(url);
      setEligiblePOs(res.data.items);
    } catch (err) {
      setError('Failed to fetch eligible purchase orders.');
    } finally {
      setLoadingPOs(false);
    }
  };

  const handlePOSubmit = (po) => {
    setSelectedPO(po);
    const initialQuantities = {};
    po.items.forEach(item => {
      // Default to 0 so they have to manually enter it
      initialQuantities[item.purchaseOrderItemId] = 0; 
    });
    setReceiveQuantities(initialQuantities);
    setStep(2);
    setError(null);
  };

  const handleQuantityChange = (itemId, value, remaining) => {
    let parsed = parseInt(value, 10);
    if (isNaN(parsed)) parsed = 0;
    // Don't let it exceed remaining
    if (parsed > remaining) parsed = remaining;
    if (parsed < 0) parsed = 0;
    setReceiveQuantities(prev => ({ ...prev, [itemId]: parsed }));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      const itemsToReceive = Object.keys(receiveQuantities)
        .map(key => ({
          purchaseOrderItemId: parseInt(key, 10),
          receivedNowQuantity: receiveQuantities[key]
        }))
        .filter(i => i.receivedNowQuantity > 0);

      if (itemsToReceive.length === 0) {
        setError('You must receive at least one item with a quantity greater than 0.');
        setSubmitting(false);
        return;
      }

      await api.post('/goodsreceipts', {
        purchaseOrderId: selectedPO.purchaseOrderId,
        remarks: remarks,
        items: itemsToReceive
      });

      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create Goods Receipt.');
      setSubmitting(false);
    }
  };

  const footer = step === 2 && selectedPO ? (
    <div className="drawer-footer-actions" style={{display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem'}}>
        <button 
          className="btn-secondary" 
          onClick={() => setStep(1)}
          disabled={submitting}
        >
          Back
        </button>
        <button 
          className="btn-primary" 
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? 'Creating Receipt...' : (
            <><CheckCircle size={18} /><span>Create Receipt</span></>
          )}
        </button>
    </div>
  ) : null;

  return (
    <SharedDrawer
        isOpen={true}
        onClose={onClose}
        title="Create Goods Receipt"
        icon={Package}
        width="1000px"
        footer={footer}
    >
        <div className="inventory-drawer-content">
          {error && (
            <div className="form-error mb-md">
              <AlertTriangle className="icon-sm" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 && (
            <div className="step-content">
              <h3>Step 1: Select Purchase Order</h3>
              <p className="text-muted mb-md">Only approved or ordered purchase orders with remaining quantities can be received.</p>
              
              <div className="form-group">
                <input 
                  type="text" 
                  placeholder="Search PO Number or Supplier..."
                  value={poSearch}
                  onChange={(e) => setPoSearch(e.target.value)}
                />
              </div>

              {loadingPOs ? (
                <div className="loading-skeleton">Loading POs...</div>
              ) : eligiblePOs.length === 0 ? (
                <div className="empty-state">
                  <Package className="empty-icon" />
                  <h4>No POs Available</h4>
                  <p>No purchase orders are currently available for receiving.</p>
                </div>
              ) : (
                <table className="data-table mt-sm">
                  <thead>
                    <tr>
                      <th>PO Number</th>
                      <th>Supplier</th>
                      <th>Warehouse</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eligiblePOs.map(po => (
                      <tr key={po.purchaseOrderId}>
                        <td className="fw-500">{po.poNumber}</td>
                        <td>{po.supplierName}</td>
                        <td>{po.warehouseCode}</td>
                        <td><span className="status-badge status-active">{po.status}</span></td>
                        <td>
                          <button className="btn-secondary" onClick={() => handlePOSubmit(po)}>
                            Select <ArrowRight className="icon-sm ml-xs" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {step === 2 && selectedPO && (
            <div className="step-content">
              <h3>Step 2: Enter Received Quantities</h3>
              
              <div className="info-grid mt-md mb-lg p-md" style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <div className="info-item">
                  <span className="info-label">PO Number</span>
                  <span className="info-value">{selectedPO.poNumber}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Supplier</span>
                  <span className="info-value">{selectedPO.supplierName}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Destination Warehouse</span>
                  <span className="info-value">{selectedPO.warehouseName} ({selectedPO.warehouseCode})</span>
                </div>
              </div>

              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th className="text-right">Ordered</th>
                    <th className="text-right">Previously Received</th>
                    <th className="text-right">Remaining</th>
                    <th className="text-right" style={{ width: '160px' }}>Receive Now</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPO.items.map(item => {
                    if (item.remainingQuantity <= 0) return null;
                    const recvVal = receiveQuantities[item.purchaseOrderItemId] || 0;
                    const afterRecv = item.remainingQuantity - recvVal;
                    const isError = recvVal > item.remainingQuantity;

                    return (
                      <tr key={item.purchaseOrderItemId}>
                        <td>{item.productName}</td>
                        <td>{item.sku}</td>
                        <td className="text-right">{item.orderedQuantity}</td>
                        <td className="text-right text-muted">{item.previouslyReceivedQuantity}</td>
                        <td className="text-right fw-500">{item.remainingQuantity}</td>
                        <td className="text-right">
                          <div className="receive-input-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <input 
                              type="number"
                              min="0"
                              max={item.remainingQuantity}
                              value={receiveQuantities[item.purchaseOrderItemId] === 0 ? '' : receiveQuantities[item.purchaseOrderItemId]}
                              onChange={(e) => handleQuantityChange(item.purchaseOrderItemId, e.target.value, item.remainingQuantity)}
                              className={isError ? 'error' : ''}
                              style={{ 
                                width: '120px', 
                                textAlign: 'right', 
                                padding: '6px 12px', 
                                borderRadius: '8px', 
                                border: isError ? '1px solid var(--error-color)' : '1px solid var(--border-color)',
                                background: 'var(--bg-color)',
                                color: 'var(--text-main)',
                                fontSize: '0.9rem'
                              }}
                            />
                          </div>
                          {recvVal > 0 && !isError && (
                            <div className="calculation-preview">
                              After: {afterRecv}
                            </div>
                          )}
                          {isError && (
                            <div className="inline-error">
                              <AlertTriangle className="icon-xs" size={12} />
                              Only {item.remainingQuantity} left
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Stock Impact Preview */}
              {Object.values(receiveQuantities).some(v => v > 0) && (
                <div className="stock-impact-preview">
                  <h4><Package className="icon-sm" /> Inventory Impact Preview</h4>
                  <p className="text-muted text-sm mb-md">This is a preview. Stock will only be updated after confirmation.</p>
                  
                  {selectedPO.items.map(item => {
                    const rQty = receiveQuantities[item.purchaseOrderItemId] || 0;
                    if (rQty <= 0) return null;
                    return (
                      <div className="impact-row" key={item.purchaseOrderItemId}>
                        <span><strong>{item.productName}</strong> ({item.sku})</span>
                        <span>
                          <span className="text-success fw-600">+{rQty} units</span> into {selectedPO.warehouseName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="form-group mt-xl mb-xl">
                <label>Remarks</label>
                <textarea 
                  placeholder="Add any delivery notes or remarks..."
                  rows="3"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
    </SharedDrawer>
  );
}
