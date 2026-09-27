import React, { useState, useEffect } from 'react';
import './CategoryManagementModal.css';
import { api } from '../../services/api';

const CategoryManagementModal = ({ isOpen, onClose }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      setIsSubmitting(true);
      await api.post('/categories', {
        categoryName: newCategoryName,
        description: newCategoryDescription,
        status: 'Active'
      });
      
      setNewCategoryName('');
      setNewCategoryDescription('');
      await fetchCategories();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (category) => {
    try {
      const newStatus = category.status === 'Active' ? 'Inactive' : 'Active';
      await api.put(`/categories/${category.categoryId}`, {
        categoryName: category.categoryName,
        description: category.description,
        status: newStatus
      });
      await fetchCategories();
    } catch (err) {
      setError(err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container category-modal">
        <div className="modal-header">
          <h2>Manage Categories</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        
        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}
          
          <form className="add-category-form" onSubmit={handleAddCategory}>
            <div className="form-row">
              <div className="form-group">
                <input 
                  type="text" 
                  placeholder="New Category Name" 
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group flex-grow">
                <input 
                  type="text" 
                  placeholder="Description (Optional)" 
                  value={newCategoryDescription}
                  onChange={(e) => setNewCategoryDescription(e.target.value)}
                />
              </div>
              <button type="submit" className="btn-primary" disabled={isSubmitting || !newCategoryName.trim()}>
                {isSubmitting ? 'Adding...' : 'Add'}
              </button>
            </div>
          </form>

          <div className="categories-list">
            {loading ? (
              <p>Loading categories...</p>
            ) : categories.length === 0 ? (
              <p className="empty-text">No categories found.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(c => (
                    <tr key={c.categoryId} className={c.status === 'Inactive' ? 'inactive-row' : ''}>
                      <td>{c.categoryCode}</td>
                      <td>{c.categoryName}</td>
                      <td>
                        <span className={`status-badge ${c.status.toLowerCase()}`}>
                          {c.status}
                        </span>
                      </td>
                      <td>
                        <button 
                          className={`btn-small ${c.status === 'Active' ? 'btn-danger' : 'btn-success'}`}
                          onClick={() => toggleStatus(c)}
                        >
                          {c.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryManagementModal;