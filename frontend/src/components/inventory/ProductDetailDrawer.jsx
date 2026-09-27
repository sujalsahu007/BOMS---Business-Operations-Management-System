import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import SharedDrawer from '../shared/SharedDrawer';
import { Package } from 'lucide-react';

const ProductDetailDrawer = ({ isOpen, onClose, productId }) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && productId) {
      fetchProductDetails();
    }
  }, [isOpen, productId]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/products/${productId}`);
      setProduct(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SharedDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Product Details"
      subtitle={product ? product.productName : "Loading..."}
      icon={Package}
    >
      <div className="inventory-drawer-content">
        {loading && <div className="drawer-loading"><div className="spinner-small"></div> Loading details...</div>}
        {error && <div className="error-message">{error}</div>}
        
        {product && !loading && (
          <div className="detail-view">
              {product.imageUrl && (
                <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                  <img 
                    src={`https://boms-9707.onrender.com${product.imageUrl}`} 
                    alt={product.productName}
                    style={{ width: '100%', maxWidth: '300px', height: 'auto', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                  />
                </div>
              )}
              <div className="detail-header-section">
                <div className="detail-title-row">
                  <h3>{product.productName}</h3>
                  <span className={`status-badge ${product.status.toLowerCase()}`}>
                    {product.status}
                  </span>
                </div>
                <p className="detail-code">Code: {product.productCode} | SKU: {product.sku}</p>
              </div>

              <div className="detail-grid">
                <div className="detail-group">
                  <label>Category</label>
                  <p>{product.categoryName}</p>
                </div>
                <div className="detail-group">
                  <label>Brand</label>
                  <p>{product.brand || '-'}</p>
                </div>
                <div className="detail-group">
                  <label>Unit of Measure</label>
                  <p>{product.unitOfMeasure || '-'}</p>
                </div>
                <div className="detail-group">
                  <label>Reorder Level</label>
                  <p>{product.reorderLevel}</p>
                </div>
              </div>

              <div className="detail-grid" style={{ marginTop: '1rem' }}>
                <div className="detail-group">
                  <label>Cost Price</label>
                  <p className="price">${product.costPrice.toFixed(2)}</p>
                </div>
                <div className="detail-group">
                  <label>Selling Price</label>
                  <p className="price">${product.sellingPrice.toFixed(2)}</p>
                </div>
              </div>

              <div className="detail-group full-width" style={{ marginTop: '1rem' }}>
                <label>Description</label>
                <p className="description-text">{product.description || 'No description provided.'}</p>
              </div>

              <div className="activity-section">
                <h4>Recent Activity</h4>
                {product.recentActivities && product.recentActivities.length > 0 ? (
                  <div className="timeline">
                    {product.recentActivities.map(activity => (
                      <div key={`${activity.time}-${activity.action}`} className="timeline-item">
                        <div className="timeline-marker"></div>
                        <div className="timeline-content">
                          <div className="timeline-header">
                            <span className="action-type">{activity.action}</span>
                            <span className="time">{new Date(activity.time).toLocaleString()}</span>
                          </div>
                          <p>{activity.user} performed this action.</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="empty-text">No recent activity.</p>
                )}
              </div>
            </div>
          )}
      </div>
    </SharedDrawer>
  );
};

export default ProductDetailDrawer;