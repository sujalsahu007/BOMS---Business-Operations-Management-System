import React, { useState } from 'react';
import { 
    LayoutDashboard, Package, Warehouse, Users, 
    ShoppingCart, FileInput, ArrowLeftRight, Clock 
} from 'lucide-react';
import ProductsTab from '../components/inventory/ProductsTab';
import WarehousesTab from '../components/inventory/WarehousesTab';
import SuppliersTab from '../components/inventory/SuppliersTab';
import PurchaseOrdersTab from '../components/inventory/PurchaseOrdersTab';
import GoodsReceiptsTab from '../components/inventory/GoodsReceiptsTab';
import StockOperationsTab from '../components/inventory/StockOperationsTab';
import InventoryDashboardTab from '../components/inventory/InventoryDashboardTab';
import './InventoryPage.css';

const InventoryPage = () => {
    const [activeTab, setActiveTab] = useState('dashboard');

    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'products', label: 'Products', icon: Package },
        { id: 'warehouses', label: 'Warehouses & Stock', icon: Warehouse },
        { id: 'suppliers', label: 'Suppliers', icon: Users },
        { id: 'purchase_orders', label: 'Purchase Orders', icon: ShoppingCart },
        { id: 'goods_receipts', label: 'Goods Receipts', icon: FileInput },
        { id: 'stock_operations', label: 'Stock Operations', icon: ArrowLeftRight },
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <InventoryDashboardTab />;
            case 'products':
                return <ProductsTab />;
            case 'warehouses':
                return <WarehousesTab />;
            case 'suppliers':
                return <SuppliersTab />;
            case 'purchase_orders':
                return <PurchaseOrdersTab />;
            case 'goods_receipts':
                return <GoodsReceiptsTab />;
            case 'stock_operations':
                return <StockOperationsTab />;
            default:
                return null;
        }
    };

    return (
        <div className="inventory-module-container">
            <div className="inventory-module-shell">
                <div className="inventory-tab-bar">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button 
                                key={tab.id}
                                className={`inventory-tab ${isActive ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <Icon size={16} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="inventory-tab-content">
                    {renderTabContent()}
                </div>
            </div>
        </div>
    );
};

export default InventoryPage;
