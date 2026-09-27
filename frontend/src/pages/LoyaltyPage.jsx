import React, { useState } from 'react';
import { 
    LayoutDashboard, Gift, Award,
    Percent, Users, RefreshCcw
} from 'lucide-react';
import LoyaltyProgramsTab from '../components/loyalty/LoyaltyProgramsTab';
import TiersBenefitsTab from '../components/loyalty/TiersBenefitsTab';
import RewardsPromotionsTab from '../components/loyalty/RewardsPromotionsTab';
import CustomersTab from '../components/loyalty/CustomersTab';
import TransactionsTab from '../components/loyalty/TransactionsTab';
import DashboardTab from '../components/loyalty/DashboardTab';
import './LoyaltyPage.css';

const LoyaltyPage = () => {
    const [activeTab, setActiveTab] = useState('programs');

    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'programs', label: 'Loyalty Programs', icon: Gift },
        { id: 'tiers', label: 'Tiers & Benefits', icon: Award },
        { id: 'rewards', label: 'Rewards & Promotions', icon: Percent },
        { id: 'customers', label: 'Customers', icon: Users },
        { id: 'transactions', label: 'Transactions', icon: RefreshCcw },
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'programs':
                return <LoyaltyProgramsTab />;
            case 'tiers':
                return <TiersBenefitsTab />;
            case 'rewards':
                return <RewardsPromotionsTab />;
            case 'customers':
                return <CustomersTab />;
            case 'transactions':
                return <TransactionsTab />;
            case 'dashboard':
                return <DashboardTab setActiveTab={setActiveTab} />;
            default:
                return null;
        }
    };

    return (
        <div className="loyalty-module-container">
            <div className="loyalty-module-shell">
                <div className="loyalty-tab-bar">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button 
                                key={tab.id}
                                className={`loyalty-tab ${isActive ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <Icon size={16} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="loyalty-tab-content">
                    {renderTabContent()}
                </div>
            </div>
        </div>
    );
};

export default LoyaltyPage;
