import React, { useEffect, useState } from 'react';
import { checkHealth } from '../services/api';

const TestPage = () => {
    const [status, setStatus] = useState({ backend: null, database: null, error: null });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStatus = async () => {
            setLoading(true);
            const result = await checkHealth();
            setStatus(result);
            setLoading(false);
        };

        fetchStatus();
    }, []);

    if (loading) {
        return <div style={styles.container}>Loading System Status...</div>;
    }

    return (
        <div style={styles.container}>
            <h1 style={styles.heading}>HOSHO BOMS</h1>
            <h2 style={styles.subheading}>System Status</h2>
            
            <div style={styles.card}>
                <div style={styles.statusRow}>
                    <span style={styles.label}>Backend:</span>
                    {status.backend ? 
                        <span style={styles.connected}>Connected</span> : 
                        <span style={styles.disconnected}>Backend unavailable {status.error && `(${status.error})`}</span>
                    }
                </div>
                <div style={styles.statusRow}>
                    <span style={styles.label}>Database:</span>
                    {status.database ? 
                        <span style={styles.connected}>Connected</span> : 
                        <span style={styles.disconnected}>Database unavailable</span>
                    }
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: 'sans-serif',
        backgroundColor: '#f4f4f9',
        color: '#333'
    },
    heading: {
        fontSize: '3rem',
        marginBottom: '10px',
        color: '#2c3e50'
    },
    subheading: {
        fontSize: '1.5rem',
        marginBottom: '30px',
        color: '#7f8c8d'
    },
    card: {
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        width: '400px'
    },
    statusRow: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '15px',
        fontSize: '1.2rem'
    },
    label: {
        fontWeight: 'bold'
    },
    connected: {
        color: '#27ae60',
        fontWeight: 'bold'
    },
    disconnected: {
        color: '#c0392b',
        fontWeight: 'bold'
    }
};

export default TestPage;
