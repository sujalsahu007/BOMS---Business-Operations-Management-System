import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
    Building2, Mail, Phone, Globe, MapPin, 
    Hash, UserCircle, Briefcase, AtSign,
    CheckCircle2, AlertCircle, Save
} from 'lucide-react';
import './SettingsPage.css';

const SettingsPage = () => {
    const { currentUser } = useAuth();
    
    // UI State
    const [activeTab, setActiveTab] = useState('account');
    
    // Data State (Account Profile is editable)
    const [profileData, setProfileData] = useState({
        firstName: currentUser?.firstName || '',
        lastName: currentUser?.lastName || '',
        email: currentUser?.email || '',
        username: currentUser?.username || ''
    });

    // Preferences (Notifications)
    const [preferences, setPreferences] = useState({
        notifContracts: localStorage.getItem('boms_notif_contracts') !== 'false',
        notifInventory: localStorage.getItem('boms_notif_inventory') !== 'false',
        notifSystem: localStorage.getItem('boms_notif_system') !== 'false',
    });
    const [originalPreferences] = useState({...preferences});

    const [isDirty, setIsDirty] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        let isChanged = false;
        if (activeTab === 'account') {
            isChanged = profileData.firstName !== (currentUser?.firstName || '') ||
                        profileData.lastName !== (currentUser?.lastName || '') ||
                        profileData.email !== (currentUser?.email || '');
        } else if (activeTab === 'notifications') {
            isChanged = JSON.stringify(preferences) !== JSON.stringify(originalPreferences);
        }
        setIsDirty(isChanged);
        if (isChanged && saveStatus === 'saved') setSaveStatus(null);
    }, [profileData, preferences, activeTab, currentUser, originalPreferences, saveStatus]);

    const handleSave = async () => {
        setSaveStatus('saving');
        setErrorMessage('');
        
        try {
            if (activeTab === 'account') {
                const rolesRes = await api.get('/roles');
                
                // Fallback for casing issues if roles is passed as 'Roles'
                const userRoles = currentUser?.roles || currentUser?.Roles || [];
                
                const matchedRoleIds = rolesRes.data
                    .filter(r => userRoles.includes(r.roleName))
                    .map(r => r.roleId);

                const statusMap = { 'Active': 0, 'Inactive': 1, 'Suspended': 2 };
                
                await api.put(`/users/${currentUser.userId}`, {
                    firstName: profileData.firstName,
                    lastName: profileData.lastName,
                    username: profileData.username,
                    email: profileData.email,
                    roleIds: matchedRoleIds,
                    status: statusMap[currentUser.status] ?? 0
                });
            } else if (activeTab === 'notifications') {
                localStorage.setItem('boms_notif_contracts', preferences.notifContracts);
                localStorage.setItem('boms_notif_inventory', preferences.notifInventory);
                localStorage.setItem('boms_notif_system', preferences.notifSystem);
            }

            setIsDirty(false);
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus(null), 3000);
        } catch (error) {
            setErrorMessage(error.response?.data?.message || 'Unable to save settings.');
            setSaveStatus('error');
        }
    };

    const renderAccountProfile = () => (
        <div className="settings-content-card">
            <div className="settings-card-header">
                <h2>Account Profile</h2>
                <p>Manage your personal administrator identity and contact information.</p>
            </div>
            
            <div className="settings-form-grid">
                <div className="settings-input-group">
                    <label className="settings-label">First Name</label>
                    <div className="settings-input-wrapper">
                        <div className="settings-input-icon"><UserCircle size={16} /></div>
                        <input 
                            type="text" 
                            value={profileData.firstName}
                            onChange={e => setProfileData({...profileData, firstName: e.target.value})}
                        />
                    </div>
                </div>

                <div className="settings-input-group">
                    <label className="settings-label">Last Name</label>
                    <div className="settings-input-wrapper">
                        <div className="settings-input-icon"><UserCircle size={16} /></div>
                        <input 
                            type="text" 
                            value={profileData.lastName}
                            onChange={e => setProfileData({...profileData, lastName: e.target.value})}
                        />
                    </div>
                </div>

                <div className="settings-input-group">
                    <label className="settings-label">Email Address</label>
                    <div className="settings-input-wrapper">
                        <div className="settings-input-icon"><Mail size={16} /></div>
                        <input 
                            type="email" 
                            value={profileData.email}
                            onChange={e => setProfileData({...profileData, email: e.target.value})}
                        />
                    </div>
                </div>

                <div className="settings-input-group">
                    <label className="settings-label">Username <span className="readonly-badge">System</span></label>
                    <div className="settings-input-wrapper">
                        <div className="settings-input-icon"><AtSign size={16} /></div>
                        <input type="text" value={profileData.username} disabled />
                    </div>
                </div>
                
                <div className="settings-input-group">
                    <label className="settings-label">Primary Role <span className="readonly-badge">Read Only</span></label>
                    <div className="settings-input-wrapper">
                        <div className="settings-input-icon"><Briefcase size={16} /></div>
                        <input type="text" value={(currentUser?.roles || currentUser?.Roles || []).join(', ') || 'N/A'} disabled />
                    </div>
                </div>
            </div>
        </div>
    );

    const renderOrganizationProfile = () => (
        <div className="settings-content-card">
            <div className="settings-card-header">
                <h2>Company Profile</h2>
                <p>Manage your company's basic information and public identity.</p>
            </div>
            
            <div className="settings-form-grid">
                <div className="settings-input-group">
                    <label className="settings-label">Company Name</label>
                    <div className="settings-input-wrapper">
                        <div className="settings-input-icon"><Building2 size={16} /></div>
                        <input type="text" value="HOSHO Technologies" disabled />
                    </div>
                </div>

                <div className="settings-input-group">
                    <label className="settings-label">Tax ID / Registration Number</label>
                    <div className="settings-input-wrapper">
                        <div className="settings-input-icon"><Hash size={16} /></div>
                        <input type="text" value="UEN: 202418763M" disabled />
                    </div>
                </div>

                <div className="settings-input-group">
                    <label className="settings-label">Support Email</label>
                    <div className="settings-input-wrapper">
                        <div className="settings-input-icon"><Mail size={16} /></div>
                        <input type="email" value="support@hoshotechnologies.com" disabled />
                    </div>
                </div>

                <div className="settings-input-group">
                    <label className="settings-label">Phone Number</label>
                    <div className="settings-input-wrapper">
                        <div className="settings-input-icon"><Phone size={16} /></div>
                        <input type="text" value="+65 6789 4521" disabled />
                    </div>
                </div>

                <div className="settings-input-group full-width">
                    <label className="settings-label">Website</label>
                    <div className="settings-input-wrapper">
                        <div className="settings-input-icon"><Globe size={16} /></div>
                        <input type="text" value="https://www.hoshotechnologies.com" disabled />
                    </div>
                </div>

                <div className="settings-input-group full-width">
                    <label className="settings-label">Physical Address</label>
                    <div className="settings-input-wrapper">
                        <div className="settings-input-icon"><MapPin size={16} /></div>
                        <input type="text" value="Level 18, Hosho Business Centre, 88 Marina View, Singapore 018960" disabled />
                    </div>
                </div>
            </div>
        </div>
    );

    const renderNotifications = () => (
        <div className="settings-content-card">
            <div className="settings-card-header">
                <h2>Notification Preferences</h2>
                <p>Configure how and when you receive system alerts.</p>
            </div>
            
            <div className="settings-list-wrapper">
                <div className="settings-list-row">
                    <div className="settings-row-info">
                        <h4>Contract Alerts</h4>
                        <p>Receive notifications for approaching contract expiries and renewals.</p>
                    </div>
                    <label className="toggle-switch">
                        <input 
                            type="checkbox" 
                            checked={preferences.notifContracts} 
                            onChange={e => setPreferences({...preferences, notifContracts: e.target.checked})}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                </div>

                <div className="settings-list-row">
                    <div className="settings-row-info">
                        <h4>Inventory Alerts</h4>
                        <p>Get notified when stock falls below minimum reorder thresholds.</p>
                    </div>
                    <label className="toggle-switch">
                        <input 
                            type="checkbox" 
                            checked={preferences.notifInventory} 
                            onChange={e => setPreferences({...preferences, notifInventory: e.target.checked})}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                </div>

                <div className="settings-list-row">
                    <div className="settings-row-info">
                        <h4>System Updates</h4>
                        <p>Important BOMS platform maintenance and version announcements.</p>
                    </div>
                    <label className="toggle-switch">
                        <input 
                            type="checkbox" 
                            checked={preferences.notifSystem} 
                            onChange={e => setPreferences({...preferences, notifSystem: e.target.checked})}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                </div>
            </div>
        </div>
    );

    return (
        <div className="settings-page-wrapper">
            <div className="settings-container">
                
                {/* Header with Save Button */}
                <div className="settings-top-bar">
                    <div className="settings-title-group">
                        <h1>Centralized Settings</h1>
                        <p>Manage all enterprise configurations from one master control panel.</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {saveStatus === 'saved' && (
                            <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem' }}>
                                <CheckCircle2 size={16} /> Saved
                            </span>
                        )}
                        {saveStatus === 'error' && (
                            <span style={{ color: '#EF4444', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem' }}>
                                <AlertCircle size={16} /> Error
                            </span>
                        )}
                        <button 
                            className="settings-main-save-btn" 
                            onClick={handleSave}
                            disabled={!isDirty || saveStatus === 'saving'}
                        >
                            <Save size={16} /> 
                            {saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>

                {/* Horizontal Navigation Tabs */}
                <div className="settings-tabs-container">
                    <button 
                        className={`settings-tab-btn ${activeTab === 'account' ? 'active' : ''}`}
                        onClick={() => setActiveTab('account')}
                    >
                        Account Profile
                    </button>
                    <button 
                        className={`settings-tab-btn ${activeTab === 'company' ? 'active' : ''}`}
                        onClick={() => setActiveTab('company')}
                    >
                        Company Profile
                    </button>
                    <button 
                        className={`settings-tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
                        onClick={() => setActiveTab('notifications')}
                    >
                        Notification Preferences
                    </button>
                </div>

                {/* Main Content Area */}
                {activeTab === 'account' && renderAccountProfile()}
                {activeTab === 'company' && renderOrganizationProfile()}
                {activeTab === 'notifications' && renderNotifications()}

            </div>
        </div>
    );
};

export default SettingsPage;
