import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchUnreadCount = async () => {
        if (!isAuthenticated) return;
        try {
            const response = await api.get('/notifications/unread-count');
            setUnreadCount(response.data.count);
        } catch (error) {
            console.error("Failed to fetch unread notifications count", error);
        }
    };

    useEffect(() => {
        fetchUnreadCount();
        
        // Optional: Could poll every 60s, but we'll stick to mount and explicit updates for now
        // const interval = setInterval(fetchUnreadCount, 60000);
        // return () => clearInterval(interval);
    }, [isAuthenticated]);

    const decrementUnreadCount = () => {
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const clearUnreadCount = () => {
        setUnreadCount(0);
    };

    return (
        <NotificationContext.Provider value={{
            unreadCount,
            fetchUnreadCount,
            decrementUnreadCount,
            clearUnreadCount
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationContext);
