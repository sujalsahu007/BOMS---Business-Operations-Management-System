import React, { useState, useEffect } from 'react';
import { Plus, MoreVertical, Play, Square, Edit2, Gift } from 'lucide-react';
import { loyaltyApi } from '../../services/loyaltyApi';
import SharedDrawer from '../shared/SharedDrawer';
import CreateBenefitDrawer from './CreateBenefitDrawer';
import EditBenefitDrawer from './EditBenefitDrawer';
import TableActionMenu from '../shared/TableActionMenu';

const TierDetailDrawer = ({ tier, onClose, onBenefitChanged }) => {
    const [benefits, setBenefits] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [isCreateBenefitOpen, setIsCreateBenefitOpen] = useState(false);
    const [editingBenefit, setEditingBenefit] = useState(null);

    const fetchBenefits = async () => {
        setLoading(true);
        try {
            const { data } = await loyaltyApi.getBenefitsByTier(tier.tierId);
            setBenefits(data || []);
        } catch (error) {
            console.error('Failed to fetch benefits:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tier?.tierId) {
            fetchBenefits();
        }
    }, [tier]);

    const handleAction = async (action, benefit) => {
        try {
            if (action === 'activate') {
                await loyaltyApi.activateBenefit(benefit.benefitId);
                fetchBenefits();
                if (onBenefitChanged) onBenefitChanged();
            } else if (action === 'deactivate') {
                await loyaltyApi.deactivateBenefit(benefit.benefitId);
                fetchBenefits();
                if (onBenefitChanged) onBenefitChanged();
            } else if (action === 'edit') {
                setEditingBenefit(benefit);
            }
        } catch (error) {
            console.error(`Failed to ${action} benefit:`, error);
            alert(`Error: ${error.response?.data?.message || 'Action failed'}`);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const getBenefitValueDisplay = (benefit) => {
        if (benefit.benefitValue === null || benefit.benefitValue === undefined) return '-';
        if (benefit.benefitType === 'Discount') return `${benefit.benefitValue}%`;
        if (benefit.benefitType === 'Cashback') return `₹${benefit.benefitValue}`;
        if (benefit.benefitType === 'Bonus Points') return `${benefit.benefitValue}x`;
        return benefit.benefitValue;
    };

    return (
        <>
            <SharedDrawer
                isOpen={true}
                onClose={onClose}
                title="Tier Details & Benefits"
                width="700px"
            >
                <div className="drawer-body p-6 bg-gray-50">
                    
                    {/* Tier Summary Card */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    {tier.tierName}
                                    <span className={`status-badge status-${tier.status.toLowerCase()} text-xs`}>
                                        {tier.status}
                                    </span>
                                </h2>
                                <p className="text-muted text-sm mt-1">{tier.description || 'No description provided.'}</p>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-muted uppercase tracking-wider font-semibold">Tier Code</div>
                                <div className="font-mono font-medium">{tier.tierCode}</div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                            <div className="detail-row">
                                <label className="text-sm text-muted block mb-1">Program</label>
                                <div className="font-medium">{tier.programName}</div>
                            </div>
                            <div className="detail-row">
                                <label className="text-sm text-muted block mb-1">Qualification ({tier.qualificationType})</label>
                                <div className="font-medium">
                                    {tier.qualificationType === 'Spend' ? '₹' : ''}
                                    {tier.qualificationThreshold?.toLocaleString() || '0'}
                                    {tier.qualificationType === 'Points' ? ' pts' : ''}
                                </div>
                            </div>
                            <div className="detail-row">
                                <label className="text-sm text-muted block mb-1">Display Order</label>
                                <div><span className="font-medium badge badge-neutral">{tier.displayOrder}</span></div>
                            </div>
                            <div className="detail-row">
                                <label className="text-sm text-muted block mb-1">Created</label>
                                <div className="text-sm font-medium">{formatDate(tier.createdAt)}</div>
                            </div>
                            <div className="detail-row">
                                <label className="text-sm text-muted block mb-1">Last Updated</label>
                                <div className="text-sm font-medium">{formatDate(tier.updatedAt)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Benefits Section */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold flex items-center gap-2">
                                <Gift size={18} className="text-primary" /> Benefits
                                <span className="badge badge-info text-xs">{benefits.length}</span>
                            </h3>
                            <button className="primary-btn text-sm py-1.5 px-3" onClick={() => setIsCreateBenefitOpen(true)}>
                                <Plus size={16} /> Add Benefit
                            </button>
                        </div>

                        <div className="p-0">
                            {loading ? (
                                <div className="p-8 text-center text-muted">Loading benefits...</div>
                            ) : benefits.length === 0 ? (
                                <div className="p-12 text-center">
                                    <Gift size={32} className="mx-auto text-muted mb-3 opacity-30" />
                                    <p className="text-muted text-sm">No benefits assigned to this tier yet.</p>
                                </div>
                            ) : (
                                <div className="table-container">
                                    <table className="enterprise-table">
                                        <thead>
                                            <tr>
                                                <th>Benefit Name</th>
                                                <th>Type</th>
                                                <th>Value</th>
                                                <th>Status</th>
                                                <th className="text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {benefits.map(benefit => (
                                                <tr key={benefit.benefitId}>
                                                    <td>
                                                        <div className="font-medium">{benefit.benefitName}</div>
                                                        {benefit.description && <div className="text-xs text-muted truncate max-w-[150px]">{benefit.description}</div>}
                                                    </td>
                                                    <td>{benefit.benefitType}</td>
                                                    <td className="font-medium">{getBenefitValueDisplay(benefit)}</td>
                                                    <td>
                                                        <span className={`status-badge status-${benefit.status.toLowerCase()}`}>
                                                            {benefit.status}
                                                        </span>
                                                    </td>
                                                    <td className="text-right">
                                                        <TableActionMenu>
                                                            <button className="dropdown-item w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center" onClick={() => handleAction('edit', benefit)}>
                                                                <Edit2 size={14} className="mr-2" /> Edit
                                                            </button>
                                                            <div className="border-t my-1 border-gray-200 dark:border-gray-700"></div>
                                                            {benefit.status !== 'Active' ? (
                                                                <button className="dropdown-item w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center text-success" onClick={() => handleAction('activate', benefit)}>
                                                                    <Play size={14} className="mr-2" /> Activate
                                                                </button>
                                                            ) : (
                                                                <button className="dropdown-item w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center text-warning" onClick={() => handleAction('deactivate', benefit)}>
                                                                    <Square size={14} className="mr-2" /> Deactivate
                                                                </button>
                                                            )}
                                                        </TableActionMenu>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </SharedDrawer>

            {isCreateBenefitOpen && (
                <CreateBenefitDrawer 
                    tierId={tier.tierId}
                    onClose={() => setIsCreateBenefitOpen(false)}
                    onSuccess={() => {
                        setIsCreateBenefitOpen(false);
                        fetchBenefits();
                        if (onBenefitChanged) onBenefitChanged();
                    }}
                />
            )}

            {editingBenefit && (
                <EditBenefitDrawer 
                    benefit={editingBenefit}
                    onClose={() => setEditingBenefit(null)}
                    onSuccess={() => {
                        setEditingBenefit(null);
                        fetchBenefits();
                    }}
                />
            )}
        </>
    );
};

export default TierDetailDrawer;
