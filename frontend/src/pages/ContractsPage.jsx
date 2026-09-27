import React, { useState } from 'react';
import { 
    LayoutDashboard, FileText, Users, 
    CalendarClock, CheckCircle, ShieldAlert 
} from 'lucide-react';
import ContractDashboardTab from '../components/contracts/ContractDashboardTab';
import ContractsTab from '../components/contracts/ContractsTab';
import PartiesTab from '../components/contracts/PartiesTab';
import RenewalsTab from '../components/contracts/RenewalsTab';
import ApprovalsTab from '../components/contracts/ApprovalsTab';
import ObligationsTab from '../components/contracts/ObligationsTab';
import './ContractsPage.css';

const ContractsPage = () => {
    const [activeTab, setActiveTab] = useState('dashboard');

    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'contracts', label: 'Contracts', icon: FileText },
        { id: 'parties', label: 'Parties', icon: Users },
        { id: 'renewals', label: 'Renewals & Expiry', icon: CalendarClock },
        { id: 'approvals', label: 'Approvals', icon: CheckCircle },
        { id: 'obligations', label: 'Obligations', icon: ShieldAlert },
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <ContractDashboardTab onNavigate={setActiveTab} />;
            case 'contracts':
                return <ContractsTab />;
            case 'parties':
                return <PartiesTab />;
            case 'renewals':
                return <RenewalsTab />;
            case 'approvals':
                return <ApprovalsTab />;
            case 'obligations':
                return <ObligationsTab />;
            default:
                return null;
        }
    };

    return (
        <div className="contracts-module-container">
            <div className="contracts-module-shell">
                <div className="contracts-tab-bar">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button 
                                key={tab.id}
                                className={`contracts-tab ${isActive ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <Icon size={16} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="contracts-tab-content">
                    {renderTabContent()}
                </div>
            </div>
        </div>
    );
};

export default ContractsPage;
