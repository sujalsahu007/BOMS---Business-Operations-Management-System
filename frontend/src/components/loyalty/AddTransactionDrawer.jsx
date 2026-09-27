import React, { useState, useEffect } from 'react';
import { X, Search, AlertTriangle, ArrowRight } from 'lucide-react';
import SharedDrawer from '../shared/SharedDrawer';
import { loyaltyApi } from '../../services/loyaltyApi';

const AddTransactionDrawer = ({ onClose, onSuccess }) => {
    const [memberships, setMemberships] = useState([]);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [loadingMemberships, setLoadingMemberships] = useState(false);

    const [selectedMembership, setSelectedMembership] = useState(null);
    const [formData, setFormData] = useState({
        transactionType: '',
        points: '',
        reference: '',
        description: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        const fetchMemberships = async () => {
            if (!debouncedSearch) {
                setMemberships([]);
                return;
            }
            setLoadingMemberships(true);
            try {
                // Fetch active memberships that match the search
                const res = await loyaltyApi.getMemberships({ 
                    page: 1, 
                    pageSize: 10, 
                    search: debouncedSearch,
                    statusFilter: 'Active'
                });
                setMemberships(res.data.items || []);
            } catch (err) {
                console.error("Failed to search memberships", err);
            } finally {
                setLoadingMemberships(false);
            }
        };
        fetchMemberships();
    }, [debouncedSearch]);

    const calculateProjectedBalance = () => {
        if (!selectedMembership || !formData.transactionType || !formData.points) return null;
        
        const points = parseFloat(formData.points) || 0;
        const currentBalance = parseFloat(selectedMembership.pointsBalance) || 0;

        if (formData.transactionType === 'Earned') {
            return currentBalance + points;
        } else if (formData.transactionType === 'Redeemed') {
            return currentBalance - points;
        } else if (formData.transactionType === 'Adjustment') {
            return currentBalance + points; // Can be positive or negative
        }
        return currentBalance;
    };

    const projectedBalance = calculateProjectedBalance();
    const isNegative = projectedBalance !== null && projectedBalance < 0;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!selectedMembership) {
            setError('Please select a customer membership.');
            return;
        }
        if (!formData.transactionType) {
            setError('Please select a transaction type.');
            return;
        }
        const parsedPoints = parseFloat(formData.points);
        if (isNaN(parsedPoints) || parsedPoints === 0) {
            setError('Points amount cannot be zero.');
            return;
        }
        if ((formData.transactionType === 'Earned' || formData.transactionType === 'Redeemed') && parsedPoints < 0) {
            setError('Points must be a positive number for Earned or Redeemed.');
            return;
        }
        if (isNegative) {
            setError('This transaction would result in a negative balance, which is not allowed.');
            return;
        }

        setSubmitting(true);
        try {
            await loyaltyApi.createTransaction({
                membershipId: selectedMembership.membershipId,
                transactionType: formData.transactionType,
                points: parseFloat(formData.points),
                reference: formData.reference,
                description: formData.description
            });
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create transaction.');
            setSubmitting(false);
        }
    };

    const footer = (
        <div className="drawer-footer">
            <button 
                type="button" 
                className="secondary-btn"
                onClick={onClose}
                disabled={submitting}
            >
                Cancel
            </button>
            <button 
                type="submit" 
                form="transaction-form"
                className="primary-btn"
                disabled={submitting || isNegative || !selectedMembership}
            >
                {submitting ? 'Recording...' : 'Record Transaction'}
            </button>
        </div>
    );

    return (
        <SharedDrawer
            isOpen={true}
            onClose={onClose}
            title="Record Loyalty Transaction"
            width="500px"
            footer={footer}
        >
            <div className="drawer-body p-6">
                
                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded mb-6 flex items-start gap-2 text-sm">
                        <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                        <div>{error}</div>
                    </div>
                )}

                <div className="mb-6 relative">
                    <label className="text-xs text-muted block mb-2 uppercase tracking-wider">Find Customer Membership</label>
                    
                    {!selectedMembership ? (
                        <>
                            <div className="search-box w-full mb-2">
                                <Search size={18} className="search-icon" />
                                <input
                                    type="text"
                                    className="w-full"
                                    placeholder="Search by customer name or code..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            
                            {loadingMemberships && <div className="text-sm text-muted">Searching...</div>}
                            
                            {!loadingMemberships && memberships.length > 0 && (
                                <div className="border border-gray-700 rounded-md overflow-hidden bg-gray-800">
                                    {memberships.map(m => (
                                        <div 
                                            key={m.membershipId}
                                            className="p-3 border-b border-gray-700 last:border-b-0 hover:bg-gray-700/50 cursor-pointer flex justify-between items-center"
                                            onClick={() => {
                                                setSelectedMembership(m);
                                                setSearch('');
                                                setMemberships([]);
                                            }}
                                        >
                                            <div>
                                                <div className="font-medium">{m.customerName}</div>
                                                <div className="text-xs text-muted">{m.customerCode} • {m.programName}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-bold text-blue-500">{m.pointsBalance?.toLocaleString()} pts</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="p-4 border border-blue-500/30 bg-blue-900/10 rounded-lg flex justify-between items-center">
                            <div>
                                <div className="font-medium text-white">{selectedMembership.customerName}</div>
                                <div className="text-sm text-muted">{selectedMembership.customerCode} • {selectedMembership.programName}</div>
                                <div className="text-xs text-gray-400 mt-1">Current Balance: <span className="font-bold text-white">{selectedMembership.pointsBalance?.toLocaleString()}</span></div>
                            </div>
                            <button 
                                className="icon-btn text-muted hover:text-red-400" 
                                onClick={() => setSelectedMembership(null)}
                                title="Remove Selection"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} id="transaction-form">
                    
                    <div className="form-section mb-6">
                        <div className="form-group">
                            <label>Transaction Type *</label>
                            <select 
                                className="form-control"
                                value={formData.transactionType}
                                onChange={(e) => setFormData({...formData, transactionType: e.target.value})}
                                required
                            >
                                <option value="">Select Type...</option>
                                <option value="Earned">Earned (Add Points)</option>
                                <option value="Redeemed">Redeemed (Subtract Points)</option>
                                <option value="Adjustment">Adjustment (Add or Subtract Points)</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Points Amount *</label>
                            <input 
                                type="number"
                                className="form-control"
                                value={formData.points}
                                onChange={(e) => setFormData({...formData, points: e.target.value})}
                                placeholder="e.g. 500 or -500"
                                step="0.01"
                                required
                            />
                        </div>
                    </div>

                    {selectedMembership && formData.transactionType && formData.points && (
                        <div className={`p-4 rounded-lg border ${isNegative ? 'bg-red-500/10 border-red-500/30' : 'bg-gray-800 border-gray-700'} mb-6`}>
                            <div className="text-xs text-muted mb-2 uppercase tracking-wider">Projected Balance</div>
                            <div className="flex items-center gap-4 text-lg">
                                <span className="text-gray-400 font-mono">{parseFloat(selectedMembership.pointsBalance || 0).toLocaleString()}</span>
                                <ArrowRight size={16} className="text-muted" />
                                <span className={`font-mono font-bold ${isNegative ? 'text-red-500' : 'text-white'}`}>
                                    {projectedBalance?.toLocaleString()}
                                </span>
                            </div>
                            {isNegative && (
                                <div className="text-xs text-red-500 mt-2">
                                    Error: Redemptions cannot exceed the current balance.
                                </div>
                            )}
                        </div>
                    )}

                    <div className="form-section">
                        <div className="form-group">
                            <label>Reference (Optional)</label>
                            <input 
                                type="text"
                                className="form-control"
                                value={formData.reference}
                                onChange={(e) => setFormData({...formData, reference: e.target.value})}
                                placeholder="e.g. Invoice #12345"
                                maxLength="100"
                            />
                        </div>

                        <div className="form-group">
                            <label>Description (Optional)</label>
                            <textarea 
                                className="form-control"
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                placeholder="Reason for this transaction..."
                                rows={3}
                                maxLength="500"
                            />
                        </div>
                    </div>

                </form>
            </div>
        </SharedDrawer>
    );
};

export default AddTransactionDrawer;
