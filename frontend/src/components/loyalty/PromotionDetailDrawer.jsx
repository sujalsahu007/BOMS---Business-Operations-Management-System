import React from 'react';
import { Tag, Calendar, Zap } from 'lucide-react';
import SharedDrawer from '../shared/SharedDrawer';

const PromotionDetailDrawer = ({ promotion, onClose }) => {
    if (!promotion) return null;

    return (
        <SharedDrawer
            isOpen={true}
            onClose={onClose}
            title={
                <div className="flex items-center gap-2">
                    <Tag size={20} /> Promotion Details
                </div>
            }
            width="600px"
        >
            <div className="drawer-body">
                <div className="form-section p-4 rounded mb-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                        <div>
                            <h3 className="text-2xl font-bold">{promotion.promotionName}</h3>
                            <div className="text-muted">{promotion.promotionCode}</div>
                        </div>
                        <span className={`status-badge status-${promotion.status.toLowerCase().replace(' ', '-')}`}>
                            {promotion.status}
                        </span>
                    </div>

                    <div className="p-4 rounded-lg bg-gray-800 border border-gray-700 mb-6 flex items-center gap-4">
                        <div className="p-3 bg-blue-500 bg-opacity-20 text-blue-400 rounded-full">
                            <Zap size={24} />
                        </div>
                        <div>
                            <div className="text-sm text-muted mb-1">Benefit</div>
                            <div className="text-2xl font-bold text-white">
                                {promotion.promotionType === 'Bonus Points' 
                                    ? `+${promotion.bonusPoints} Points` 
                                    : `${promotion.pointsMultiplier}x Multiplier`
                                }
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="detail-row">
                            <label className="text-sm text-muted block mb-1">Loyalty Program</label>
                            <div className="font-medium">{promotion.loyaltyProgram?.programName || 'Unknown Program'}</div>
                        </div>

                        <div className="detail-row">
                            <label className="text-sm text-muted block mb-1">Promotion Type</label>
                            <div className="font-medium">{promotion.promotionType}</div>
                        </div>

                        <div className="detail-row">
                            <label className="text-sm text-muted block mb-1">Description</label>
                            <div className="text-gray-300 bg-gray-800 p-3 rounded text-sm">
                                {promotion.description || <span className="text-muted italic">No description provided</span>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="detail-row">
                                <label className="text-sm text-muted block mb-1 flex items-center gap-1"><Calendar size={14} /> Start Date</label>
                                <div className="font-medium">{new Date(promotion.startDate).toLocaleDateString()}</div>
                            </div>
                            <div className="detail-row">
                                <label className="text-sm text-muted block mb-1 flex items-center gap-1"><Calendar size={14} /> End Date</label>
                                <div className="font-medium">{new Date(promotion.endDate).toLocaleDateString()}</div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-4 border-t border-gray-800 text-xs text-muted">
                        <div className="flex justify-between mb-1">
                            <span>Created By:</span>
                            <span>{promotion.user?.firstName} {promotion.user?.lastName}</span>
                        </div>
                        <div className="flex justify-between mb-1">
                            <span>Created At:</span>
                            <span>{new Date(promotion.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Last Updated:</span>
                            <span>{new Date(promotion.updatedAt).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
        </SharedDrawer>
    );
};

export default PromotionDetailDrawer;
