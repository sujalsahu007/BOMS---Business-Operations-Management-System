import React, { useState, useEffect } from 'react';
import SharedDrawer from '../shared/SharedDrawer';
import { contractApi } from '../../services/contractApi';
import { usersApi } from '../../services/api';

const ObligationFormDrawer = ({ isOpen, onClose, obligation, onUpdate }) => {
    const isEdit = !!obligation;

    const [formData, setFormData] = useState({
        contractId: '',
        title: '',
        description: '',
        dueDate: '',
        ownerId: '',
        priority: 'Medium',
        status: 'Pending'
    });

    const [contracts, setContracts] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchDependencies();
            if (isEdit) {
                setFormData({
                    contractId: obligation.contractId,
                    title: obligation.title,
                    description: obligation.description || '',
                    dueDate: obligation.dueDate.split('T')[0],
                    ownerId: obligation.ownerId,
                    priority: obligation.priority,
                    status: obligation.status
                });
            } else {
                setFormData({
                    contractId: '',
                    title: '',
                    description: '',
                    dueDate: '',
                    ownerId: '',
                    priority: 'Medium',
                    status: 'Pending'
                });
            }
            setError('');
        }
    }, [isOpen, isEdit, obligation]);

    const fetchDependencies = async () => {
        try {
            setLoading(true);
            let contractsData = [];
            let usersData = [];

            try {
                const cRes = await contractApi.getContracts({ page: 1, pageSize: 100 });
                contractsData = cRes.items || [];
            } catch (err) {
                console.error("Failed to load contracts:", err);
            }

            try {
                const uRes = await usersApi.getAll({ page: 1, pageSize: 100 });
                usersData = uRes.data?.items || uRes.data || [];
            } catch (err) {
                console.error("Failed to load users:", err);
            }

            setContracts(contractsData);
            setUsers(usersData);
            
            if (contractsData.length === 0 && usersData.length === 0) {
                setError("Failed to load contracts or users.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.contractId) {
            setError("Contract is required");
            return;
        }

        if (!isEdit) {
            const selectedDate = new Date(formData.dueDate);
            selectedDate.setHours(0,0,0,0);
            const today = new Date();
            today.setHours(0,0,0,0);
            if (selectedDate < today) {
                setError("Due date cannot be in the past for new obligations.");
                return;
            }
        }

        try {
            setSubmitLoading(true);
            const payload = {
                title: formData.title,
                description: formData.description,
                dueDate: formData.dueDate,
                ownerId: parseInt(formData.ownerId, 10),
                priority: formData.priority,
                status: formData.status
            };

            if (isEdit) {
                await contractApi.updateObligation(obligation.obligationId, payload);
            } else {
                await contractApi.createObligation(formData.contractId, payload);
            }

            onUpdate();
            onClose();
        } catch (err) {
            console.error("Failed to save obligation", err);
            setError(err.response?.data?.message || "Failed to save obligation.");
        } finally {
            setSubmitLoading(false);
        }
    };

    const drawerFooter = (
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', width: '100%' }}>
            <button type="button" className="secondary-btn" onClick={onClose} disabled={submitLoading}>
                Cancel
            </button>
            <button type="button" className="primary-btn" onClick={handleSubmit} disabled={submitLoading || loading}>
                {submitLoading ? "Saving..." : "Save Obligation"}
            </button>
        </div>
    );

    const selectedContract = contracts.find(c => c.contractId.toString() === formData.contractId.toString());

    return (
        <SharedDrawer
            isOpen={isOpen}
            onClose={onClose}
            title={isEdit ? "Edit Obligation" : "Add Obligation"}
            size="medium"
            footer={drawerFooter}
        >
            {error && (
                <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--red-500)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: '1.5rem', fontSize: '0.85rem', fontWeight: 500 }}>
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="spinner"></div>
                </div>
            ) : (
                <form className="form-section" onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label className="form-label">Contract *</label>
                            <select 
                                className="form-input" 
                                name="contractId" 
                                value={formData.contractId} 
                                onChange={handleChange} 
                                required
                                disabled={isEdit}
                                style={{ opacity: isEdit ? 0.7 : 1 }}
                            >
                                <option value="">Select a Contract...</option>
                                {contracts.map(c => (
                                    <option key={c.contractId} value={c.contractId}>
                                        {c.contractNumber} — {c.contractType || 'Contract'} — {c.partyName || c.party?.partyName || 'Unknown'}
                                    </option>
                                ))}
                            </select>
                            {isEdit && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Contract cannot be changed after creation.</div>}
                        </div>
                        
                        {selectedContract && (
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <div style={{ background: 'var(--surface-color)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
                                    <div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '2px' }}>Contract Context</div>
                                        <div style={{ fontWeight: 500, color: 'var(--text-color)' }}>{selectedContract.contractNumber}</div>
                                        <div style={{ color: 'var(--text-muted)' }}>{selectedContract.title}</div>
                                    </div>
                                    <div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '2px' }}>Party</div>
                                        <div style={{ fontWeight: 500, color: 'var(--text-color)' }}>{selectedContract.partyName || selectedContract.party?.partyName || 'Unknown Party'}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label className="form-label">Obligation Title *</label>
                            <input 
                                type="text" 
                                className="form-input" 
                                name="title" 
                                value={formData.title} 
                                onChange={handleChange} 
                                required 
                                placeholder="e.g., Submit monthly compliance report"
                            />
                        </div>

                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label className="form-label">Description</label>
                            <textarea 
                                className="form-input" 
                                name="description" 
                                value={formData.description} 
                                onChange={handleChange} 
                                rows="3"
                                placeholder="Details about what needs to be delivered..."
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Due Date *</label>
                            <input 
                                type="date" 
                                className="form-input" 
                                name="dueDate" 
                                value={formData.dueDate} 
                                onChange={handleChange} 
                                required 
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Owner *</label>
                            <select 
                                className="form-input" 
                                name="ownerId" 
                                value={formData.ownerId} 
                                onChange={handleChange} 
                                required
                            >
                                <option value="">Select Owner...</option>
                                {users.map(u => (
                                    <option key={u.userId} value={u.userId}>
                                        {u.firstName} {u.lastName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Priority *</label>
                            <select 
                                className="form-input" 
                                name="priority" 
                                value={formData.priority} 
                                onChange={handleChange} 
                                required
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Critical">Critical</option>
                            </select>
                        </div>

                        {isEdit && (
                            <div className="form-group">
                                <label className="form-label">Status</label>
                                <select 
                                    className="form-input" 
                                    name="status" 
                                    value={formData.status} 
                                    onChange={handleChange} 
                                    disabled={formData.status === 'Completed' || formData.status === 'Cancelled'}
                                    style={{ opacity: (formData.status === 'Completed' || formData.status === 'Cancelled') ? 0.7 : 1 }}
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </div>
                        )}
                    </div>
                </form>
            )}
        </SharedDrawer>
    );
};

export default ObligationFormDrawer;
