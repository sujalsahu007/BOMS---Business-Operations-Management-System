import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';
import './TableActionMenu.css';

const TableActionMenu = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownStyle, setDropdownStyle] = useState({});
    const containerRef = useRef(null);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && containerRef.current.contains(event.target)) {
                return;
            }
            if (dropdownRef.current && dropdownRef.current.contains(event.target)) {
                return;
            }
            setIsOpen(false);
        };

        const handleScroll = (event) => {
            // Close dropdown if scrolling happens outside the dropdown itself
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', handleScroll, true); // capture phase to catch all scrolls
            window.addEventListener('resize', () => setIsOpen(false));
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', () => setIsOpen(false));
        };
    }, [isOpen]);

    const handleToggle = (e) => {
        e.stopPropagation();
        if (!isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setDropdownStyle({
                position: 'fixed',
                top: `${rect.bottom + 4}px`,
                right: `${window.innerWidth - rect.right}px`,
                zIndex: 999999
            });
        }
        setIsOpen(!isOpen);
    };

    return (
        <div className={`table-action-menu ${isOpen ? 'is-open' : ''}`} ref={containerRef}>
            <button 
                className="action-trigger-btn" 
                onClick={handleToggle}
                aria-label="Actions"
            >
                <MoreVertical size={16} />
            </button>
            
            {isOpen && createPortal(
                <div 
                    ref={dropdownRef}
                    className="action-dropdown"
                    style={dropdownStyle}
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(false);
                    }}
                >
                    {children}
                </div>,
                document.body
            )}
        </div>
    );
};

export default TableActionMenu;
