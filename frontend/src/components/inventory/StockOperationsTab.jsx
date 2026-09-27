import React, { useState } from 'react';
import { ArrowRightLeft, SlidersHorizontal, History } from 'lucide-react';
import StockTransfersTab from './StockTransfersTab';
import StockAdjustmentsTab from './StockAdjustmentsTab';
import InventoryTransactionsTab from './InventoryTransactionsTab';
import './StockOperationsTab.css';

const StockOperationsTab = () => {
    const [activeSubTab, setActiveSubTab] = useState('transfers');

    return (
        <div className="stock-operations-container">
            <div className="stock-ops-nav">
                <button 
                    className={`stock-ops-tab ${activeSubTab === 'transfers' ? 'active' : ''}`}
                    onClick={() => setActiveSubTab('transfers')}
                >
                    <ArrowRightLeft size={16} /> Transfers
                </button>
                <button 
                    className={`stock-ops-tab ${activeSubTab === 'adjustments' ? 'active' : ''}`}
                    onClick={() => setActiveSubTab('adjustments')}
                >
                    <SlidersHorizontal size={16} /> Adjustments
                </button>
                <button 
                    className={`stock-ops-tab ${activeSubTab === 'transactions' ? 'active' : ''}`}
                    onClick={() => setActiveSubTab('transactions')}
                >
                    <History size={16} /> Transactions
                </button>
            </div>
            
            <div className="stock-ops-content">
                {activeSubTab === 'transfers' && <StockTransfersTab />}
                {activeSubTab === 'adjustments' && <StockAdjustmentsTab />}
                {activeSubTab === 'transactions' && <InventoryTransactionsTab />}
            </div>
        </div>
    );
};

export default StockOperationsTab;
