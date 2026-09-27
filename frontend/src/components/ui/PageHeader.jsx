import React from 'react';
import Breadcrumb from './Breadcrumb';
import '../layout/AppShell.css';

const PageHeader = ({ title, subtitle, action }) => {
    return (
        <div className="page-header">
            <div className="page-header-content">
                <Breadcrumb />
                <div className="page-header-title-row">
                    <h1 className="page-title">{title}</h1>
                    {subtitle && <span className="page-subtitle">{subtitle}</span>}
                </div>
            </div>
            
            {action && (
                <div className="page-actions">
                    {action}
                </div>
            )}
        </div>
    );
};

export default PageHeader;
