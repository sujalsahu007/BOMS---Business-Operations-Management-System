import React from 'react';
import { X, Award, Percent, Users, RefreshCcw } from 'lucide-react';
import SharedDrawer from '../shared/SharedDrawer';

const ProgramDetailDrawer = ({ program, onClose }) => {
    if (!program) return null;

    return (
        <SharedDrawer
            isOpen={true}
            onClose={onClose}
            title="Loyalty Program Details"
            width="600px"
        >
            <div className="drawer-body p-6">
                    
                    <div className="detail-section mb-8">
                        <h3 className="text-sm font-semibold text-muted mb-4 tracking-wider">PROGRAM INFORMATION</h3>
                        <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                            <div>
                                <label className="text-xs text-muted block mb-1">Program Name</label>
                                <div className="font-medium">{program.programName}</div>
                            </div>
                            <div>
                                <label className="text-xs text-muted block mb-1">Program Code</label>
                                <div>{program.programCode}</div>
                            </div>
                            <div>
                                <label className="text-xs text-muted block mb-1">Status</label>
                                <span className={`status-badge status-${program.status.toLowerCase().replace(' ', '-')}`}>
                                    {program.status}
                                </span>
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs text-muted block mb-1">Description</label>
                                <div>{program.description || '-'}</div>
                            </div>
                        </div>
                    </div>

                    <div className="detail-section mb-8">
                        <h3 className="text-sm font-semibold text-muted mb-4 tracking-wider">VALIDITY</h3>
                        <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                            <div>
                                <label className="text-xs text-muted block mb-1">Start Date</label>
                                <div>{new Date(program.startDate).toLocaleDateString()}</div>
                            </div>
                            <div>
                                <label className="text-xs text-muted block mb-1">End Date</label>
                                <div>{program.endDate ? new Date(program.endDate).toLocaleDateString() : 'No End Date'}</div>
                            </div>
                        </div>
                    </div>

                    <div className="detail-section mb-8">
                        <h3 className="text-sm font-semibold text-muted mb-4 tracking-wider">POINT CONFIGURATION</h3>
                        <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                            <div>
                                <label className="text-xs text-muted block mb-1">Points Name</label>
                                <div>{program.pointsName}</div>
                            </div>
                            <div>
                                <label className="text-xs text-muted block mb-1">Earning Rule</label>
                                <div>Spend ₹{program.earningAmount} → Earn {program.earningPoints} {program.pointsName}</div>
                            </div>
                            <div>
                                <label className="text-xs text-muted block mb-1">Minimum Redemption Points</label>
                                <div>{program.minimumRedemptionPoints} {program.pointsName}</div>
                            </div>
                        </div>
                    </div>

                    <div className="detail-section mb-8">
                        <h3 className="text-sm font-semibold text-muted mb-4 tracking-wider">ACCOUNTABILITY</h3>
                        <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                            <div>
                                <label className="text-xs text-muted block mb-1">Created By</label>
                                <div>{program.createdByName}</div>
                            </div>
                            <div>
                                <label className="text-xs text-muted block mb-1">Created At</label>
                                <div>{new Date(program.createdAt).toLocaleString()}</div>
                            </div>
                            <div>
                                <label className="text-xs text-muted block mb-1">Last Updated</label>
                                <div>{new Date(program.updatedAt).toLocaleString()}</div>
                            </div>
                        </div>
                    </div>

                    <div className="detail-section">
                        <h3 className="text-sm font-semibold text-muted mb-4 tracking-wider">PROGRAM STRUCTURE (COMING SOON)</h3>
                        <p className="text-sm text-muted mb-4">
                            This loyalty program acts as the core configuration. In upcoming updates, it will seamlessly connect with the following modules:
                        </p>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded border flex flex-col items-center justify-center text-center bg-gray-50 dark:bg-gray-800">
                                <Award size={24} className="text-muted mb-2" />
                                <div className="font-medium mb-1">Tiers & Benefits</div>
                                <div className="text-xs text-muted">Will manage progression</div>
                            </div>

                            <div className="p-4 rounded border flex flex-col items-center justify-center text-center bg-gray-50 dark:bg-gray-800">
                                <Percent size={24} className="text-muted mb-2" />
                                <div className="font-medium mb-1">Rewards & Promotions</div>
                                <div className="text-xs text-muted">Will handle redemption</div>
                            </div>

                            <div className="p-4 rounded border flex flex-col items-center justify-center text-center bg-gray-50 dark:bg-gray-800">
                                <Users size={24} className="text-muted mb-2" />
                                <div className="font-medium mb-1">Customers</div>
                                <div className="text-xs text-muted">Will track enrollment</div>
                            </div>

                            <div className="p-4 rounded border flex flex-col items-center justify-center text-center bg-gray-50 dark:bg-gray-800">
                                <RefreshCcw size={24} className="text-muted mb-2" />
                                <div className="font-medium mb-1">Transactions</div>
                                <div className="text-xs text-muted">Will log point activity</div>
                            </div>
                        </div>
                    </div>

            </div>
        </SharedDrawer>
    );
};

export default ProgramDetailDrawer;
