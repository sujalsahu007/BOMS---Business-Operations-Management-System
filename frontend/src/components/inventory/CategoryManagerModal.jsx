import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { X, Plus, Edit2, Check, XCircle } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import './CategoryManagerModal.css';

const CategoryManagerModal = ({ isOpen, onClose }) => {
    const { addNotification } = useNotification();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // For inline creation/editing
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ categoryName: '', description: '', status: 'Active' });
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchCategories();
            setIsCreating(false);
            setEditingId(null);
        }
    }, [isOpen]);

    const fetchCategories = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get('/categories');
            setCategories(res.data);
        } catch (err) {
            setError('Failed to fetch categories');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!editForm.categoryName.trim()) {
            addNotification('warning', 'Category name is required.');
            return;
        }
        try {
            await api.post('/categories', { 
                categoryName: editForm.categoryName, 
                description: editForm.description 
            });
            addNotification('success', 'Category created successfully');
            setIsCreating(false);
            fetchCategories();
        } catch (err) {
            addNotification('error', err.response?.data?.message || 'Failed to create category');
        }
    };

    const handleUpdate = async (id) => {
        if (!editForm.categoryName.trim()) {
            addNotification('warning', 'Category name is required.');
            return;
        }
        try {
            await api.put(`/categories/${id}`, {
                categoryName: editForm.categoryName,
                description: editForm.description,
                status: editForm.status === 'Active' ? 0 : 1
            });
            addNotification('success', 'Category updated successfully');
            setEditingId(null);
            fetchCategories();
        } catch (err) {
            addNotification('error', err.response?.data?.message || 'Failed to update category');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content category-modal">
                <div className="modal-header">
                    <h2>Manage Categories</h2>
                    <button className="icon-btn" onClick={onClose}><X size={20} /></button>
                </div>
                
                <div className="modal-body">
                    <div className="category-list-header">
                        <button className="btn btn-primary" onClick={() => {
                            setIsCreating(true);
                            setEditingId(null);
                            setEditForm({ categoryName: '', description: '', status: 'Active' });
                        }}>
                            <Plus size={16} /> New Category
                        </button>
                    </div>

                    <div className="category-list">
                        {loading && !isCreating && <div className="loading-state">Loading categories...</div>}
                        
                        {!loading && categories.length === 0 && !isCreating && (
                            <div className="empty-state">No categories found.</div>
                        )}

                        {isCreating && (
                            <div className="category-edit-row">
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    placeholder="Category Name" 
                                    value={editForm.categoryName}
                                    onChange={(e) => setEditForm({...editForm, categoryName: e.target.value})}
                                    autoFocus
                                />
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    placeholder="Description" 
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                                />
                                <div className="category-actions">
                                    <button className="icon-btn text-success" onClick={handleCreate} title="Save">
                                        <Check size={18} />
                                    </button>
                                    <button className="icon-btn text-danger" onClick={() => setIsCreating(false)} title="Cancel">
                                        <XCircle size={18} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {categories.map(cat => (
                            <div key={cat.categoryId} className="category-row">
                                {editingId === cat.categoryId ? (
                                    <div className="category-edit-row">
                                        <input 
                                            type="text" 
                                            className="form-input" 
                                            value={editForm.categoryName}
                                            onChange={(e) => setEditForm({...editForm, categoryName: e.target.value})}
                                        />
                                        <input 
                                            type="text" 
                                            className="form-input" 
                                            value={editForm.description}
                                            onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                                        />
                                        <select 
                                            className="form-select"
                                            value={editForm.status}
                                            onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                                        >
                                            <option value="Active">Active</option>
                                            <option value="Inactive">Inactive</option>
                                        </select>
                                        <div className="category-actions">
                                            <button className="icon-btn text-success" onClick={() => handleUpdate(cat.categoryId)}>
                                                <Check size={18} />
                                            </button>
                                            <button className="icon-btn text-danger" onClick={() => setEditingId(null)}>
                                                <XCircle size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="category-view-row">
                                        <div className="cat-info">
                                            <span className="cat-code">{cat.categoryCode}</span>
                                            <span className="cat-name">{cat.categoryName}</span>
                                            <span className="cat-desc">{cat.description}</span>
                                        </div>
                                        <div className="cat-status">
                                            <span className={`status-badge ${cat.status.toLowerCase()}`}>
                                                {cat.status}
                                            </span>
                                        </div>
                                        <div className="cat-actions">
                                            <button className="icon-btn" onClick={() => {
                                                setEditingId(cat.categoryId);
                                                setIsCreating(false);
                                                setEditForm({ 
                                                    categoryName: cat.categoryName, 
                                                    description: cat.description || '', 
                                                    status: cat.status 
                                                });
                                            }}>
                                                <Edit2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CategoryManagerModal;
