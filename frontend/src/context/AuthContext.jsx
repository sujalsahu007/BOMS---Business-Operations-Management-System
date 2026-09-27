import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('boms_token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const verifyToken = async () => {
            if (token) {
                try {
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    const response = await api.get('/auth/me');
                    setCurrentUser(response.data);
                    setIsAuthenticated(true);
                } catch (error) {
                    logout();
                }
            }
            setLoading(false);
        };

        verifyToken();
    }, [token]);

    const login = async (usernameOrEmail, password) => {
        const response = await api.post('/auth/login', { usernameOrEmail, password });
        const { token: jwtToken, user } = response.data;
        
        localStorage.setItem('boms_token', jwtToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`;
        
        setToken(jwtToken);
        setCurrentUser(user);
        setIsAuthenticated(true);
    };

    const logout = () => {
        localStorage.removeItem('boms_token');
        delete api.defaults.headers.common['Authorization'];
        setToken(null);
        setCurrentUser(null);
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, currentUser, token, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
