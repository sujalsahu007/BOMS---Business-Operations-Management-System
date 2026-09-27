import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
    LayoutDashboard, Package, FileSignature, 
    Heart, BarChart3, Bell, Users, Settings, 
    PanelLeftClose, PanelLeftOpen, Hexagon, Shield, FileText, Radar, ShieldAlert
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './AppShell.css';

const Sidebar = ({ collapsed, onToggle }) => {
    const { currentUser } = useAuth();
    
    // Check if user has permission. If no specific permission needed, return true.
    const hasPermission = (permissionCode) => {
        if (!permissionCode) return true;
        // The currentUser object from API should ideally have a permissions array.
        // Assuming currentUser.permissions is an array of strings like ["Users.View", "Dashboard.View"]
        return currentUser?.permissions?.includes(permissionCode);
    };

    const navigation = [
        {
            title: 'General',
            items: [
                { name: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard, permission: 'Dashboard.View' },
                { name: 'BOMS Sentinel', path: '/app/sentinel', icon: Radar, permission: 'Dashboard.View' },
            ]
        },
        {
            title: 'Operations',
            items: [
                { name: 'Inventory', path: '/app/inventory', icon: Package, permission: 'Inventory.View' },
                { name: 'Contracts', path: '/app/contracts', icon: FileText, permission: 'Contracts.View' },
                { name: 'Customer Loyalty', path: '/app/loyalty', icon: Heart, permission: 'Loyalty.View' },
            ]
        },
        {
            title: 'Management',
            items: [
                { name: 'Reports', path: '/app/reports', icon: BarChart3, permission: 'Dashboard.View' },
                { name: 'Notifications', path: '/app/notifications', icon: Bell, permission: 'Notifications.View' },
                { name: 'Users', path: '/app/users', icon: Users, permission: 'Users.View' },
                { name: 'Roles', path: '/app/roles', icon: Shield, permission: 'Roles.View' },
                { name: 'Settings', path: '/app/settings', icon: Settings, permission: 'Settings.View' },
            ]
        },
        {
            title: 'Security',
            items: [
                { name: 'Audit Logs', path: '/app/audit', icon: Shield, permission: 'Audit.View' },
                { name: 'Activity Timeline', path: '/app/activity', icon: BarChart3, permission: 'Activity.View' }
            ]
        }
    ];

    return (
        <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
            <div className={`sidebar-header ${collapsed ? 'collapsed-header' : ''}`}>
                {!collapsed && (
                    <div className="brand" title="HOSHO BOMS" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src="/hosho-logo.jpg" alt="HOSHO Logo" style={{ height: '28px', width: 'auto', objectFit: 'contain', borderRadius: '4px' }} />
                        <span style={{ fontWeight: 'bold' }}>BOMS</span>
                    </div>
                )}
                <button className="sidebar-toggle" onClick={onToggle} style={collapsed ? { margin: '0 auto' } : {}}>
                    {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
                </button>
            </div>
            
            <nav className="sidebar-nav">
                {navigation.map((section, idx) => {
                    // Filter items based on permissions
                    const visibleItems = section.items.filter(item => hasPermission(item.permission));
                    
                    if (visibleItems.length === 0) return null;

                    return (
                        <div key={idx} className="nav-section">
                            <div className="nav-section-title">{section.title}</div>
                            {visibleItems.map(item => (
                                <NavLink 
                                    key={item.name} 
                                    to={item.path} 
                                    end={item.exact}
                                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                                    title={collapsed ? item.name : ''}
                                >
                                    <item.icon size={20} />
                                    <span className="nav-label">{item.name}</span>
                                </NavLink>
                            ))}
                        </div>
                    );
                })}
            </nav>
        </aside>
    );
};

export default Sidebar;
