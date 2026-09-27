import React from 'react';

const PlaceholderPage = ({ title, description }) => {
    return (
        <div className="enterprise-module-container">
            <div className="module-header">
                <div className="module-title-group">
                    <h2>{title}</h2>
                    <p>{description || "Module not implemented yet."}</p>
                </div>
            </div>
            
            <div style={{
                backgroundColor: 'var(--surface-color)',
                border: '1px dashed var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--spacing-xl)',
                textAlign: 'center',
                color: 'var(--text-muted)'
            }}>
                <p>This module is currently under construction.</p>
            </div>
        </div>
    );
};

export default PlaceholderPage;
