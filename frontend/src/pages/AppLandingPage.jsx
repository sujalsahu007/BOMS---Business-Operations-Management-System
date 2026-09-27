import React from 'react';
import { useAuth } from '../context/AuthContext';

const AppLandingPage = () => {
    const { currentUser, logout } = useAuth();

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={styles.title}>HOSHO BOMS</h1>
                <div style={styles.info}>
                    <p>Authenticated as: <strong>{currentUser?.name || currentUser?.username}</strong></p>
                    <p>Email: {currentUser?.email}</p>
                    <p>Status: {currentUser?.status}</p>
                </div>
                <button onClick={logout} style={styles.logoutButton}>
                    Logout
                </button>
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#f9fafb',
        fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
    },
    card: {
        backgroundColor: '#ffffff',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
        textAlign: 'center',
        minWidth: '350px'
    },
    title: {
        color: '#2c3e50',
        marginBottom: '20px'
    },
    info: {
        color: '#34495e',
        marginBottom: '30px',
        fontSize: '1.1rem',
        lineHeight: '1.6'
    },
    logoutButton: {
        backgroundColor: '#e74c3c',
        color: 'white',
        border: 'none',
        padding: '10px 20px',
        borderRadius: '4px',
        fontSize: '1rem',
        cursor: 'pointer',
        fontWeight: 'bold'
    }
};

export default AppLandingPage;
