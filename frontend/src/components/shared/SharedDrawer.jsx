import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import './SharedDrawer.css';

const SharedDrawer = ({ 
    isOpen, 
    onClose, 
    title, 
    subtitle, 
    icon: Icon,
    children, 
    footer,
    formId,
    onSubmit,
    width = '640px',
    headerAction
}) => {
    
    // Prevent body scrolling when drawer is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const content = (
        <div className="shared-drawer-overlay" onClick={onClose}>
            <div 
                className={`shared-drawer-container ${isOpen ? 'open' : ''}`}
                style={{ width, maxWidth: '100vw' }}
                onClick={e => e.stopPropagation()}
            >
                <div className="shared-drawer-header">
                    <div className="shared-drawer-title-group">
                        {Icon && <div className="shared-drawer-icon"><Icon size={24} /></div>}
                        <div className="shared-drawer-titles">
                            <h2 className="shared-drawer-title">{title}</h2>
                            {subtitle && <p className="shared-drawer-subtitle">{subtitle}</p>}
                        </div>
                    </div>
                    <div className="shared-drawer-header-actions">
                        {headerAction}
                        <button className="shared-drawer-close-btn" onClick={onClose} aria-label="Close Drawer">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {formId || onSubmit ? (
                    <form id={formId} onSubmit={onSubmit} className="shared-drawer-content-wrapper">
                        <div className="shared-drawer-body">
                            {children}
                        </div>
                        {footer && (
                            <div className="shared-drawer-footer">
                                {footer}
                            </div>
                        )}
                    </form>
                ) : (
                    <div className="shared-drawer-content-wrapper">
                        <div className="shared-drawer-body">
                            {children}
                        </div>
                        {footer && (
                            <div className="shared-drawer-footer">
                                {footer}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

    return createPortal(content, document.body);
};

export default SharedDrawer;
