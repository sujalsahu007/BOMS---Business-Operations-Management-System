import { Gift, Calendar, Tag, CreditCard } from 'lucide-react';
import SharedDrawer from '../shared/SharedDrawer';

const RewardDetailDrawer = ({ reward, onClose }) => {
    if (!reward) return null;

    return (
        <SharedDrawer
            isOpen={true}
            onClose={onClose}
            title={
                <div className="flex items-center gap-2">
                    <Gift size={20} /> Reward Details
                </div>
            }
            width="600px"
        >
            <div className="drawer-body">
                <div className="form-section p-4 rounded mb-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                        <div>
                            <h3 className="text-2xl font-bold">{reward.rewardName}</h3>
                            <div className="text-muted">{reward.rewardCode}</div>
                        </div>
                        <span className={`status-badge status-${reward.status.toLowerCase().replace(' ', '-')}`}>
                            {reward.status}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="p-4 rounded-lg bg-gray-800 border border-gray-700">
                            <div className="text-sm text-muted mb-1 flex items-center gap-1"><Tag size={14} /> Points Cost</div>
                            <div className="text-xl font-bold text-blue-400">{reward.pointsCost} Points</div>
                        </div>
                        <div className="p-4 rounded-lg bg-gray-800 border border-gray-700">
                            <div className="text-sm text-muted mb-1 flex items-center gap-1"><CreditCard size={14} /> Value</div>
                            <div className="text-xl font-bold text-green-400">
                                {reward.rewardValue ? `₹${reward.rewardValue}` : '-'}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="detail-row">
                            <label className="text-sm text-muted block mb-1">Loyalty Program</label>
                            <div className="font-medium">{reward.loyaltyProgram?.programName || 'Unknown Program'}</div>
                        </div>

                        <div className="detail-row">
                            <label className="text-sm text-muted block mb-1">Reward Type</label>
                            <div className="font-medium">{reward.rewardType}</div>
                        </div>

                        <div className="detail-row">
                            <label className="text-sm text-muted block mb-1">Description</label>
                            <div className="text-gray-300 bg-gray-800 p-3 rounded text-sm">
                                {reward.description || <span className="text-muted italic">No description provided</span>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="detail-row">
                                <label className="text-sm text-muted block mb-1 flex items-center gap-1"><Calendar size={14} /> Start Date</label>
                                <div className="font-medium">{reward.startDate ? new Date(reward.startDate).toLocaleDateString() : 'Immediate'}</div>
                            </div>
                            <div className="detail-row">
                                <label className="text-sm text-muted block mb-1 flex items-center gap-1"><Calendar size={14} /> End Date</label>
                                <div className="font-medium">{reward.endDate ? new Date(reward.endDate).toLocaleDateString() : 'No Expiry'}</div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-4 border-t border-gray-800 text-xs text-muted">
                        <div className="flex justify-between mb-1">
                            <span>Created By:</span>
                            <span>{reward.user?.firstName} {reward.user?.lastName}</span>
                        </div>
                        <div className="flex justify-between mb-1">
                            <span>Created At:</span>
                            <span>{new Date(reward.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Last Updated:</span>
                            <span>{new Date(reward.updatedAt).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
        </SharedDrawer>
    );
};

export default RewardDetailDrawer;
