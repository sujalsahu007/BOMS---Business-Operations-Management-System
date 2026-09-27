import React from 'react';
import { User, Award, Calendar, Clock, ArrowRight } from 'lucide-react';
import SharedDrawer from '../shared/SharedDrawer';

const MembershipDetailDrawer = ({ membership, onClose }) => {
    if (!membership) return null;

    return (
        <SharedDrawer
            isOpen={true}
            onClose={onClose}
            title={
                <div className="flex items-center gap-2">
                    <User size={20} /> Membership Details
                </div>
            }
            width="600px"
        >
            <div className="drawer-body p-6">
                
                <div className="detail-section mb-8">
                    <h3 className="text-sm font-semibold text-muted mb-4 tracking-wider">CUSTOMER INFORMATION</h3>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                        <div>
                            <label className="text-xs text-muted block mb-1">Customer Name</label>
                            <div className="font-medium text-lg">{membership.customerName}</div>
                        </div>
                        <div>
                            <label className="text-xs text-muted block mb-1">Customer Code</label>
                            <div>{membership.customerCode}</div>
                        </div>
                        <div>
                            <label className="text-xs text-muted block mb-1">Status</label>
                            <span className={`status-badge status-${membership.status?.toLowerCase() || 'inactive'}`}>
                                {membership.status}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="detail-section mb-8">
                    <h3 className="text-sm font-semibold text-muted mb-4 tracking-wider">MEMBERSHIP DETAILS</h3>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                        <div>
                            <label className="text-xs text-muted block mb-1">Loyalty Program</label>
                            <div className="flex items-center gap-2">
                                <Award size={16} className="text-blue-500" />
                                <span className="font-medium">{membership.programName}</span>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-muted block mb-1">Current Tier</label>
                            {membership.tierName ? (
                                <div className="font-medium text-blue-500">{membership.tierName}</div>
                            ) : (
                                <div className="text-muted italic">Unassigned</div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="detail-section mb-8">
                    <h3 className="text-sm font-semibold text-muted mb-4 tracking-wider">POINTS BALANCE</h3>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                        <div>
                            <label className="text-xs text-muted block mb-1">Current Points</label>
                            <div className="text-2xl font-bold text-blue-600">{membership.pointsBalance?.toLocaleString() || '0'}</div>
                        </div>
                        <div>
                            <label className="text-xs text-muted block mb-1">Lifetime Points</label>
                            <div className="text-xl font-medium">{membership.lifetimePoints?.toLocaleString() || '0'}</div>
                        </div>
                    </div>
                </div>

                <div className="detail-section mb-8">
                    <h3 className="text-sm font-semibold text-muted mb-4 tracking-wider">TIMESTAMPS</h3>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                        <div>
                            <label className="text-xs text-muted block mb-1">Enrolled At</label>
                            <div className="flex items-center gap-2">
                                <Calendar size={14} className="text-muted" />
                                {new Date(membership.enrolledAt).toLocaleString()}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-muted block mb-1">Last Updated</label>
                            <div className="flex items-center gap-2">
                                <Clock size={14} className="text-muted" />
                                {new Date(membership.updatedAt).toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="detail-section">
                    <h3 className="text-sm font-semibold text-muted mb-4 tracking-wider">RECENT ACTIVITY</h3>
                    <div className="p-8 rounded border border-gray-700/30 flex flex-col items-center justify-center text-center bg-gray-50/5 dark:bg-gray-800/20">
                        <Clock size={24} className="text-muted mb-2" />
                        <div className="font-medium mb-1">No activity recorded</div>
                        <div className="text-sm text-muted">Transactions will appear here once implemented.</div>
                    </div>
                </div>

            </div>
        </SharedDrawer>
    );
};

export default MembershipDetailDrawer;
