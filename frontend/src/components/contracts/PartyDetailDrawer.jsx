import React, { useState, useEffect } from 'react';
import { X, Building2, User, MapPin, Hash, AlertCircle, FileText, RefreshCw, Briefcase, Calendar } from 'lucide-react';
import { contractApi } from '../../services/contractApi';
import SharedDrawer from '../shared/SharedDrawer';
import ActivityTimeline from '../shared/ActivityTimeline';
import '../inventory/InventoryDrawers.css';

const getContractStatusClass = (status) => {
    if (!status) return 'draft';
    switch (status.toLowerCase()) {
        case 'active': return 'active';
        case 'expired': return 'expired';
        case 'draft': return 'draft';
        case 'terminated': return 'terminated';
        case 'pending approval': return 'pending';
        case 'pending signature': return 'pending';
        case 'rejected': return 'rejected';
        case 'renewed': return 'renewed';
        default: return 'draft';
    }
};

const PartyDetailDrawer = ({ partyId, isOpen, onClose }) => {
    const [party, setParty] = useState(null);
    const [contracts, setContracts] = useState([]);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen && partyId) {
            fetchData();
        } else {
            setParty(null);
            setContracts([]);
            setActivities([]);
        }
    }, [isOpen, partyId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Fetch party details
            const partyData = await contractApi.getPartyById(partyId);
            setParty(partyData);
            
            // Fetch associated contracts
            try {
                const contractsData = await contractApi.getContracts({ partyId: partyId, pageSize: 100 });
                setContracts(contractsData?.items || contractsData || []);
            } catch (cErr) {
                console.error("Failed to fetch party contracts:", cErr);
                setContracts([]);
            }
            
            // Fetch activities
            try {
                const actsData = await contractApi.getActivitiesByReference(partyId.toString(), 'Parties');
                setActivities(actsData?.items || actsData || []);
            } catch (aErr) {
                console.error("Failed to fetch party activities:", aErr);
                setActivities([]);
            }
            
        } catch (err) {
            console.error('Failed to fetch party details:', err);
            setError('Could not load party details.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SharedDrawer
            isOpen={isOpen}
            onClose={onClose}
            title="Party Details"
            subtitle={party ? party.partyCode : 'Loading...'}
            icon={Building2}
            width="600px"
        >
            <div className="contract-drawer-content">
                {loading ? (
                        <div className="flex justify-center items-center h-full">
                            <div className="spinner"></div>
                        </div>
                    ) : error ? (
                        <div className="drawer-alert error">
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    ) : party ? (
                        <div className="space-y-6 pb-6">
                            
                            {/* Header Card */}
                            <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-lg p-5 flex flex-col gap-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-xl font-bold text-[var(--text-main)] mb-1 flex items-center gap-2">
                                            <Building2 size={20} className="text-[var(--primary-color)]" />
                                            {party.partyName}
                                        </h3>
                                        <span className={`status-badge ${party.partyType.toLowerCase()}`}>
                                            {party.partyType}
                                        </span>
                                    </div>
                                    <span className={`status-badge ${party.status.toLowerCase()}`}>
                                        {party.status}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mt-2 pt-4 border-t border-[var(--border-color)]">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Active Contracts</span>
                                        <span className="text-xl font-semibold text-[var(--text-main)]">{party.activeContractsCount || 0}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Total Contracts</span>
                                        <span className="text-xl font-semibold text-[var(--text-main)]">{party.totalContractsCount || 0}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                
                                {/* Contact Info */}
                                <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-lg p-4">
                                    <h4 className="text-sm font-semibold text-[var(--text-main)] mb-3 flex items-center gap-2 border-b border-[var(--border-color)] pb-2">
                                        <User size={14} className="text-[var(--text-muted)]" />
                                        Contact Information
                                    </h4>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex flex-col">
                                            <span className="text-[var(--text-muted)] text-xs">Contact Person</span>
                                            <span className="text-[var(--text-main)]">{party.contactPerson || 'Not provided'}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[var(--text-muted)] text-xs">Email Address</span>
                                            <span className="text-[var(--text-main)]">{party.email || 'Not provided'}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[var(--text-muted)] text-xs">Phone Number</span>
                                            <span className="text-[var(--text-main)]">{party.phone || 'Not provided'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Address & Identification */}
                                <div className="space-y-4">
                                    <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-lg p-4">
                                        <h4 className="text-sm font-semibold text-[var(--text-main)] mb-3 flex items-center gap-2 border-b border-[var(--border-color)] pb-2">
                                            <MapPin size={14} className="text-[var(--text-muted)]" />
                                            Address
                                        </h4>
                                        <p className="text-sm text-[var(--text-main)] whitespace-pre-wrap">
                                            {party.address || 'Not provided'}
                                        </p>
                                    </div>

                                    <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-lg p-4">
                                        <h4 className="text-sm font-semibold text-[var(--text-main)] mb-3 flex items-center gap-2 border-b border-[var(--border-color)] pb-2">
                                            <Hash size={14} className="text-[var(--text-muted)]" />
                                            Identification
                                        </h4>
                                        <div className="flex flex-col">
                                            <span className="text-[var(--text-muted)] text-xs">Tax / VAT Number</span>
                                            <span className="text-[var(--text-main)] font-mono text-sm">{party.taxNumber || 'Not provided'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Associated Contracts */}
                            <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-lg p-4">
                                <h4 className="text-sm font-semibold text-[var(--text-main)] mb-3 flex items-center gap-2 border-b border-[var(--border-color)] pb-2">
                                    <Briefcase size={14} className="text-[var(--text-muted)]" />
                                    Associated Contracts
                                </h4>
                                {contracts.length === 0 ? (
                                    <div className="text-sm text-[var(--text-muted)] py-2">
                                        No contracts associated with this party.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {contracts.map(contract => (
                                            <div key={contract.contractId} className="flex justify-between items-center p-3 bg-[var(--background-color)] rounded border border-[var(--border-color)]">
                                                <div>
                                                    <div className="font-semibold text-sm text-[var(--text-main)]">
                                                        {contract.contractNumber} - {contract.title}
                                                    </div>
                                                    <div className="text-xs text-[var(--text-muted)] mt-1 flex items-center gap-2">
                                                        <span>{contract.contractType}</span>
                                                        <span>•</span>
                                                        <span>{contract.currency} {contract.contractValue?.toLocaleString() || 0}</span>
                                                        <span>•</span>
                                                        <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(contract.startDate).toLocaleDateString()} to {new Date(contract.endDate).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className={`status-badge ${getContractStatusClass(contract.status)}`}>
                                                        {contract.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Activity History */}
                            <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-lg p-4">
                                <h4 className="text-sm font-semibold text-[var(--text-main)] mb-3 flex items-center gap-2 border-b border-[var(--border-color)] pb-2">
                                    <RefreshCw size={14} className="text-[var(--text-muted)]" />
                                    Activity History
                                </h4>
                                {activities.length === 0 ? (
                                    <div className="text-sm text-[var(--text-muted)] py-2">
                                        No activity recorded.
                                    </div>
                                ) : (
                                    <ActivityTimeline activities={activities} loading={false} />
                                )}
                            </div>

                        </div>
                    ) : null}
            </div>
        </SharedDrawer>
    );
};

export default PartyDetailDrawer;
