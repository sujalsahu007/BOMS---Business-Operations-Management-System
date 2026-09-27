import React, { useState, useEffect } from 'react';
import { api, productsApi } from '../../services/api';
import ProductFormDrawer from './ProductFormDrawer';
import ProductDetailDrawer from './ProductDetailDrawer';
import { Plus, Search, Archive, Edit, RefreshCw } from 'lucide-react';
import './ProductsTab.css';

const ProductsTab = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination & Filtering
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState('');

  // UI State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [page, pageSize, categoryId, status]);

  // Debounced search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setPage(1);
      fetchProducts();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = { page, pageSize };
      if (search) params.search = search;
      if (categoryId) params.categoryId = categoryId;
      if (status) params.status = status;

      const res = await productsApi.getAll(params);
      
      setProducts(res.data.items);
      setTotalCount(res.data.totalCount);
    } catch (err) {
      setError(err.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setIsFormOpen(true);
  };

  const handleEditProduct = (e, product) => {
    e.stopPropagation();
    setSelectedProduct(product);
    setIsFormOpen(true);
  };

  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setIsDetailOpen(true);
  };

  const handleFormSuccess = () => {
    fetchProducts();
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="contracts-module-wrapper" style={{ height: '100%' }}>
      <div className="tab-container">
        <div className="tab-header">
          <div className="search-filter-group">
            <div className="search-bar">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search products, SKUs, brands..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <select className="filter-select" value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}>
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>
              ))}
            </select>
            
            <select className="filter-select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Discontinued">Discontinued</option>
            </select>

            <button className="icon-btn" onClick={fetchProducts} title="Refresh">
              <RefreshCw size={18} className={loading ? "spin" : ""} />
            </button>
          </div>

          <div className="action-group">
            <button className="primary-btn" onClick={handleAddProduct}>
              <Plus size={18} />
              <span>Add Product</span>
            </button>
          </div>
        </div>

      {error && <div className="error-message">{error}</div>}

      <div className="table-container">
        <table className="enterprise-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Image</th>
              <th>Product Name</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Cost Price</th>
              <th>Selling Price</th>
              <th>Status</th>
              <th className="actions-cell">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" className="text-center">Loading products...</td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center empty-state-row">
                  <Archive size={48} className="empty-icon" />
                  <p>No products found matching your criteria.</p>
                </td>
              </tr>
            ) : (
              products.map(product => (
                <tr key={product.productId} onClick={() => handleViewProduct(product)} className="clickable-row">
                  <td className="code-cell">{product.productCode}</td>
                  <td>
                    {product.imageUrl ? (
                      <img 
                        src={`http://localhost:5280${product.imageUrl}`} 
                        alt={product.productName}
                        style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                      />
                    ) : (
                      <div style={{ width: '40px', height: '40px', background: 'var(--surface-light)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Archive size={20} className="text-muted" />
                      </div>
                    )}
                  </td>
                  <td className="name-cell">
                    <div className="product-name">{product.productName}</div>
                    <div className="product-brand">{product.brand}</div>
                  </td>
                  <td>{product.sku}</td>
                  <td>{product.categoryName}</td>
                  <td className="price-cell">${product.costPrice.toFixed(2)}</td>
                  <td className="price-cell">${product.sellingPrice.toFixed(2)}</td>
                  <td>
                    <span className={`status-badge ${product.status.toLowerCase()}`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button 
                      className="icon-btn" 
                      title="Edit Product"
                      onClick={(e) => handleEditProduct(e, product)}
                    >
                      <Edit size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && products.length > 0 && (
        <div className="pagination">
          <span className="page-info">
            Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount}
          </span>
          <div className="page-controls">
            <button 
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </button>
            <span className="current-page">Page {page} of {totalPages || 1}</span>
            <button 
              disabled={page >= totalPages} 
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Drawers */}
      <ProductFormDrawer
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        product={selectedProduct}
        onSuccess={handleFormSuccess}
      />
      <ProductDetailDrawer
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        productId={selectedProduct?.productId}
      />
      </div>
    </div>
  );
};

export default ProductsTab;