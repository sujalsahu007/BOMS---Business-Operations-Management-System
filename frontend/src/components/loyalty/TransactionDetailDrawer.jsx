import React from 'react';
import { ArrowUpRight, ArrowDownRight, Clock, Settings, User, Hash, AlignLeft, Calendar } from 'lucide-react';
import SharedDrawer from '../shared/SharedDrawer';

const TransactionDetailDrawer = ({ transaction, onClose }) => {
    if (!transaction) return null;

    const getTypeColor = (type) => {
        switch (type) {
            case 'Earned': return 'text-green-500 bg-green-500/10 border-green-500/30';
            case 'Redeemed': return 'text-red-500 bg-red-500/10 border-red-500/30';
            case 'Adjustment': return 'text-blue-500 bg-blue-500/10 border-blue-500/30';
            default: return 'text-gray-500 bg-gray-500/10 border-gray-500/30';
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'Earned': return <ArrowUpRight size={18} />;
            case 'Redeemed': return <ArrowDownRight size={18} />;
            case 'Adjustment': return <Settings size={18} />;
            default: return <Settings size={18} />;
        }
    };

    const isPositive = transaction.transactionType === 'Earned' || (transaction.transactionType === 'Adjustment' && transaction.points > 0);
    const balanceBefore = transaction.balanceAfter - transaction.points;

    return (
        <SharedDrawer
            isOpen={true}
            onClose={onClose}
            title="Transaction Details"
            width="550px"
        >
            <div className="drawer-body p-6">
                
                {/* Header Card */}
                <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6 mb-6 text-center">
                    <div className={`inline-flex items-center justify-center p-4 rounded-full border mb-4 ${getTypeColor(transaction.transactionType)}`}>
                        {getTypeIcon(transaction.transactionType)}
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2 font-mono">
                        {transaction.transactionType === 'Earned' ? '+' : transaction.transactionType === 'Redeemed' ? '-' : transaction.points > 0 ? '+' : transaction.points < 0 ? '-' : ''}
                        {Math.abs(transaction.points).toLocaleString()}
                    </h2>
                    <div className={`text-sm font-semibold uppercase tracking-wider ${getTypeColor(transaction.transactionType).split(' ')[0]}`}>
                        {transaction.transactionType}
                    </div>
                </div>

                <div className="detail-section mb-8">
                    <h3 className="text-sm font-semibold text-muted mb-4 tracking-wider">CUSTOMER INFO</h3>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                        <div>
                            <label className="text-xs text-muted block mb-1">Customer Name</label>
                            <div className="font-medium text-white flex items-center gap-2">
                                <User size={14} className="text-gray-400" />
                                {transaction.customerName}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-muted block mb-1">Customer Code</label>
                            <div className="text-gray-300">{transaction.customerCode}</div>
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs text-muted block mb-1">Loyalty Program</label>
                            <div className="text-blue-400 font-medium">{transaction.programName}</div>
                        </div>
                    </div>
                </div>

                <div className="detail-section mb-8">
                    <h3 className="text-sm font-semibold text-muted mb-4 tracking-wider">BALANCE CHANGES</h3>
                    <div className="bg-gray-800 rounded-md border border-gray-700 p-4">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-sm text-gray-400">Balance Before</span>
                            <span className="font-mono text-gray-300">{balanceBefore.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-700/50">
                            <span className="text-sm text-gray-400">Transaction Points</span>
                            <span className={`font-mono font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                {transaction.transactionType === 'Earned' ? '+' : transaction.transactionType === 'Redeemed' ? '-' : transaction.points > 0 ? '+' : transaction.points < 0 ? '-' : ''}
                                {Math.abs(transaction.points).toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-white">Balance After</span>
                            <span className="font-mono text-lg font-bold text-white">{transaction.balanceAfter.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className="detail-section mb-8">
                    <h3 className="text-sm font-semibold text-muted mb-4 tracking-wider">ADDITIONAL DETAILS</h3>
                    <div className="grid grid-cols-1 gap-y-4">
                        <div>
                            <label className="text-xs text-muted block mb-1">Reference Number</label>
                            <div className="text-gray-300 flex items-center gap-2">
                                <Hash size={14} className="text-gray-500" />
                                {transaction.reference || <span className="text-gray-500 italic">None provided</span>}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-muted block mb-1">Description</label>
                            <div className="text-gray-300 flex items-start gap-2">
                                <AlignLeft size={14} className="text-gray-500 mt-1 flex-shrink-0" />
                                {transaction.description || <span className="text-gray-500 italic">No description</span>}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="detail-section">
                    <h3 className="text-sm font-semibold text-muted mb-4 tracking-wider">SYSTEM INFO</h3>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                        <div>
                            <label className="text-xs text-muted block mb-1">Transaction Date</label>
                            <div className="text-gray-300 flex items-center gap-2 text-sm">
                                <Calendar size={14} className="text-gray-500" />
                                {new Date(transaction.transactionDate).toLocaleString()}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-muted block mb-1">Created By</label>
                            <div className="text-gray-300 flex items-center gap-2 text-sm">
                                <User size={14} className="text-gray-500" />
                                {transaction.createdByName}
                            </div>
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs text-muted block mb-1">Transaction ID</label>
                            <div className="text-gray-500 font-mono text-xs">TRX-{transaction.transactionId.toString().padStart(6, '0')}</div>
                        </div>
                    </div>
                </div>

            </div>
        </SharedDrawer>
    );
};

export default TransactionDetailDrawer;
