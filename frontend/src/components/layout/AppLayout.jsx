import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import AiAssistant from '../ai/AiAssistant';
import { useAuth } from '../../context/AuthContext';
import { Hexagon } from 'lucide-react';
import './AppShell.css';

const AppLayout = () => {
    const { isAuthenticated, loading, currentUser } = useAuth();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    if (loading) {
        return (
            <div className="loading-screen">
                <Hexagon size={48} className="skeleton" style={{ color: 'var(--primary-color)' }} />
                <div style={{ width: '200px', height: '24px' }} className="skeleton"></div>
            </div>
        );
    }

    if (!isAuthenticated || !currentUser) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="app-layout">
            <Sidebar 
                collapsed={sidebarCollapsed} 
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
            />
            
            <div className="main-content">
                <Topbar />
                <main className="page-container">
                    <Outlet />
                </main>
            </div>
            <AiAssistant />
        </div>
    );
};

export default AppLayout;
