import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import SharedDrawer from '../shared/SharedDrawer';
import { Package, Save } from 'lucide-react';

const ProductFormDrawer = ({ isOpen, onClose, product, onSuccess }) => {
  const [formData, setFormData] = useState({
    productName: '',
    sku: '',
    categoryId: '',
    brand: '',
    description: '',
    unitOfMeasure: '',
    costPrice: 0,
    sellingPrice: 0,
    reorderLevel: 0,
    status: 'Active',
    imageUrl: ''
  });

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Inline Category State
  const [showInlineCategory, setShowInlineCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [savingCat, setSavingCat] = useState(false);
  const [catError, setCatError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      if (product) {
        setFormData({
          productName: product.productName,
          sku: product.sku,
          categoryId: product.categoryId,
          brand: product.brand || '',
          description: product.description || '',
          unitOfMeasure: product.unitOfMeasure || '',
          costPrice: product.costPrice || 0,
          sellingPrice: product.sellingPrice || 0,
          reorderLevel: product.reorderLevel || 0,
          status: product.status,
          imageUrl: product.imageUrl || ''
        });
      } else {
        setFormData({
          productName: '',
          sku: '',
          categoryId: '',
          brand: '',
          description: '',
          unitOfMeasure: '',
          costPrice: 0,
          sellingPrice: 0,
          reorderLevel: 0,
          status: 'Active',
          imageUrl: ''
        });
      }
      setError(null);
    }
  }, [isOpen, product]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories?activeOnly=true');
      setCategories(res.data);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('Price') || name === 'reorderLevel' ? Number(value) : value
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formDataObj = new FormData();
    formDataObj.append('file', file);

    setUploadingImage(true);
    setError(null);

    try {
      // Create a specific api instance without Content-Type so the browser sets the boundary automatically
      const res = await api.post('/upload/product-image', formDataObj, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setFormData(prev => ({ ...prev, imageUrl: res.data.url }));
    } catch (err) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (product) {
        await api.put(`/products/${product.productId}`, formData);
      } else {
        await api.post('/products', formData);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'An error occurred while saving the product');
    } finally {
      setLoading(false);
    }
  };

  const handleInlineAddCategory = async () => {
    if (!newCatName.trim()) return;
    setSavingCat(true);
    setCatError('');
    try {
      const res = await api.post('/categories', {
        categoryName: newCatName,
        description: newCatDesc,
        status: 'Active'
      });
      const newCat = res.data;
      setCategories(prev => [...prev, newCat].sort((a, b) => a.categoryName.localeCompare(b.categoryName)));
      setFormData(prev => ({ ...prev, categoryId: newCat.categoryId }));
      setShowInlineCategory(false);
      setNewCatName('');
      setNewCatDesc('');
    } catch (err) {
      setCatError(err.message || 'Failed to add category');
    } finally {
      setSavingCat(false);
    }
  };

  if (!isOpen) return null;

  const footer = (
    <div className="drawer-footer-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
      <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
        Cancel
      </button>
      <button 
        type="submit" 
        form="productForm" 
        className="btn-primary" 
        disabled={loading}
      >
        {loading ? (
            <div className="spinner-small"></div>
        ) : (
            <>
                <Save size={18} />
                <span>{product ? 'Save Changes' : 'Create Product'}</span>
            </>
        )}
      </button>
    </div>
  );

  return (
    <SharedDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={product ? 'Edit Product' : 'Add New Product'}
      subtitle={product ? `Editing details for ${product.productName}` : 'Enter details to create a new product.'}
      icon={Package}
      footer={footer}
    >
      <div className="inventory-drawer-content">
        {error && <div className="error-message">{error}</div>}
          
          <form id="productForm" onSubmit={handleSubmit}>
            <div className="form-grid">
                <div className="form-group full-width">
                <label>Product Name *</label>
                <input
                    type="text"
                    name="productName"
                    value={formData.productName}
                    onChange={handleChange}
                    required
                    maxLength="255"
                />
                </div>

                <div className="form-group full-width">
                <label>Product Image</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {formData.imageUrl && (
                    <img 
                        src={`http://localhost:5280${formData.imageUrl}`} 
                        alt="Preview" 
                        style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                    />
                    )}
                    <div style={{ flex: 1 }}>
                    <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        style={{ display: 'block', width: '100%', padding: '0.5rem', background: 'var(--surface-light)', borderRadius: '4px' }}
                    />
                    {uploadingImage && <small style={{ color: 'var(--primary-color)' }}>Uploading image...</small>}
                    </div>
                </div>
                </div>

                <div className="form-group">
                <label>SKU (Unique) *</label>
                <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    required
                    maxLength="100"
                    disabled={!!product} // Cannot change SKU after creation
                />
                </div>
              <div className="form-group">
                <label>Category *</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleChange}
                    required
                    style={{ flex: 1 }}
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => (
                      <option key={c.categoryId} value={c.categoryId}>
                        {c.categoryName} ({c.categoryCode})
                      </option>
                    ))}
                  </select>
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    onClick={() => setShowInlineCategory(!showInlineCategory)}
                    style={{ padding: '0.5rem 1rem', whiteSpace: 'nowrap' }}
                  >
                    + New
                  </button>
                </div>
                {showInlineCategory && (
                  <div style={{ marginTop: '0.5rem', padding: '1rem', background: 'var(--surface-light)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.85rem' }}>Add New Category</div>
                    {catError && <div className="error-message" style={{ padding: '0.5rem', marginBottom: '0.5rem' }}>{catError}</div>}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <input 
                        type="text" 
                        placeholder="Category Name *" 
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        style={{ flex: 1 }}
                      />
                      <input 
                        type="text" 
                        placeholder="Description (Optional)" 
                        value={newCatDesc}
                        onChange={(e) => setNewCatDesc(e.target.value)}
                        style={{ flex: 1 }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        type="button" 
                        className="btn-primary" 
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                        onClick={handleInlineAddCategory}
                        disabled={savingCat || !newCatName.trim()}
                      >
                        {savingCat ? 'Saving...' : 'Save Category'}
                      </button>
                      <button 
                        type="button" 
                        className="btn-secondary" 
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                        onClick={() => setShowInlineCategory(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Brand</label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  maxLength="100"
                />
              </div>
              <div className="form-group">
                <label>Unit of Measure</label>
                <input
                  type="text"
                  name="unitOfMeasure"
                  value={formData.unitOfMeasure}
                  onChange={handleChange}
                  placeholder="e.g. Kg, Box, Pcs"
                  maxLength="50"
                />
              </div>
              <div className="form-group">
                <label>Cost Price</label>
                <input
                  type="number"
                  name="costPrice"
                  value={formData.costPrice}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label>Selling Price</label>
                <input
                  type="number"
                  name="sellingPrice"
                  value={formData.sellingPrice}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label>Reorder Level</label>
                <input
                  type="number"
                  name="reorderLevel"
                  value={formData.reorderLevel}
                  onChange={handleChange}
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Status *</label>
                <select name="status" value={formData.status} onChange={handleChange} required>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Discontinued">Discontinued</option>
                </select>
              </div>

              <div className="form-group full-width">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  maxLength="2000"
                />
              </div>
            </div>
          </form>
        </div>
    </SharedDrawer>
  );
};

export default ProductFormDrawer;