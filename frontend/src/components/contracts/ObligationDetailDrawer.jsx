import React, { useState } from 'react';
import SharedDrawer from '../shared/SharedDrawer';
import { contractApi } from '../../services/contractApi';
import { Calendar, Building2, Tag, Info, User, AlertCircle, FileText, CheckCircle, XCircle } from 'lucide-react';

const ObligationDetailDrawer = ({ isOpen, onClose, obligation, onUpdate }) => {
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');

    if (!obligation) return null;

    const effectiveStatus = obligation.effectiveStatus || obligation.status;
    const isOverdue = effectiveStatus === 'Overdue';
    const isCompleted = effectiveStatus === 'Completed';
    const daysDiff = Math.ceil((new Date(obligation.dueDate) - new Date()) / (1000 * 60 * 60 * 24));

    return (
        <SharedDrawer
            isOpen={isOpen}
            onClose={onClose}
            title={`Obligation: ${obligation.title}`}
            size="medium"
        >
            <div className="form-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 className="section-title" style={{ margin: 0 }}>Status Progress</h3>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <span className={`status-badge ${obligation.priority.toLowerCase()}`}>
                            {obligation.priority} Priority
                        </span>
                        <span className={`status-badge ${effectiveStatus.toLowerCase().replace(' ', '-')}`}>
                            {effectiveStatus}
                        </span>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '2rem', padding: '1.5rem', background: 'var(--surface-color)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    {isCompleted ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--green-500)', fontWeight: 600 }}>
                            PENDING <span>→</span> IN PROGRESS <span>→</span> COMPLETED
                        </div>
                    ) : isOverdue ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontWeight: 600 }}>
                            <span style={{ color: 'var(--text-muted)' }}>PENDING / IN PROGRESS</span> 
                            <span>→</span> 
                            <span style={{ color: 'var(--red-500)' }}>OVERDUE</span>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontWeight: 600 }}>
                            <span style={{ color: obligation.status === 'Pending' ? 'var(--blue-500)' : 'var(--text-color)' }}>PENDING</span> 
                            <span>→</span> 
                            <span style={{ color: obligation.status === 'In Progress' ? 'var(--blue-500)' : 'var(--text-color)' }}>IN PROGRESS</span> 
                            <span style={{ color: 'var(--text-muted)' }}>→</span> 
                            <span style={{ color: 'var(--text-muted)' }}>COMPLETED</span>
                        </div>
                    )}
                </div>

                <h3 className="section-title" style={{ marginBottom: '1rem' }}>Obligation Details</h3>
                <div className="form-grid" style={{ marginBottom: '2rem' }}>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label className="form-label">Description</label>
                        <div style={{ padding: '0.75rem', background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '8px', minHeight: '80px', color: obligation.description ? 'var(--text-color)' : 'var(--text-muted)' }}>
                            {obligation.description || 'No description provided.'}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Due Date</label>
                        <div className="readonly-value" style={{ 
                            color: isOverdue ? 'var(--red-500)' : 'inherit',
                            fontWeight: isOverdue ? '600' : 'normal'
                        }}>
                            <Calendar size={16} />
                            {new Date(obligation.dueDate).toLocaleDateString()}
                            {isOverdue && (
                                <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', padding: '2px 6px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '4px' }}>
                                    {Math.abs(daysDiff)} days overdue
                                </span>
                            )}
                        </div>
                    </div>
                    
                    <div className="form-group">
                        <label className="form-label">Priority</label>
                        <div className="readonly-value">
                            <Tag size={16} />
                            {obligation.priority}
                        </div>
                    </div>
                </div>

                <h3 className="section-title" style={{ marginBottom: '1rem' }}>Contract Context</h3>
                <div className="form-grid" style={{ marginBottom: '2rem' }}>
                    <div className="form-group">
                        <label className="form-label">Contract Number</label>
                        <div className="readonly-value">
                            <FileText size={16} />
                            {obligation.contractNumber}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Party</label>
                        <div className="readonly-value">
                            <Building2 size={16} />
                            {obligation.partyName || 'Unknown Party'}
                        </div>
                    </div>
                </div>

                <h3 className="section-title" style={{ marginBottom: '1rem' }}>Accountability</h3>
                <div className="form-grid">
                    <div className="form-group">
                        <label className="form-label">Owner</label>
                        <div className="readonly-value">
                            <User size={16} />
                            {obligation.ownerName}
                        </div>
                    </div>
                    
                    <div className="form-group">
                        <label className="form-label">Created At</label>
                        <div className="readonly-value">
                            {new Date(obligation.createdAt).toLocaleDateString()}
                        </div>
                    </div>
                </div>
            </div>
        </SharedDrawer>
    );
};

export default ObligationDetailDrawer;
