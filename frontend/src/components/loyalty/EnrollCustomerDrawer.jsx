import React, { useState, useEffect, useRef } from 'react';
import { loyaltyApi } from '../../services/loyaltyApi';
import SharedDrawer from '../shared/SharedDrawer';
import { Search } from 'lucide-react';

const EnrollCustomerDrawer = ({ programs, onClose, onSuccess }) => {
    const [partyId, setPartyId] = useState('');
    const [loyaltyProgramId, setLoyaltyProgramId] = useState('');
    
    const [customers, setCustomers] = useState([]);
    const [customerSearch, setCustomerSearch] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    
    const [saving, setSaving] = useState(false);
    const searchDebounceRef = useRef(null);

    const searchCustomers = async (query) => {
        setIsSearching(true);
        try {
            const res = await loyaltyApi.getCustomersDropdown(query);
            setCustomers(res.data || []);
        } catch (err) {
            console.error("Failed to fetch customers", err);
        } finally {
            setIsSearching(false);
        }
    };

    // Initial load
    useEffect(() => {
        searchCustomers('');
    }, []);

    // Debounced search
    useEffect(() => {
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = setTimeout(() => {
            searchCustomers(customerSearch);
        }, 500);
        return () => clearTimeout(searchDebounceRef.current);
    }, [customerSearch]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!partyId || !loyaltyProgramId) {
            alert("Please select both a customer and a program.");
            return;
        }

        setSaving(true);
        try {
            await loyaltyApi.enrollCustomer({
                partyId: parseInt(partyId),
                loyaltyProgramId: parseInt(loyaltyProgramId)
            });
            onSuccess();
        } catch (error) {
            console.error("Enrollment failed", error);
            alert(error.response?.data?.message || "Failed to enroll customer. They may already be enrolled in this program.");
        } finally {
            setSaving(false);
        }
    };

    const selectedCustomer = customers.find(c => c.partyId.toString() === partyId);
    const selectedProgram = programs.find(p => p.loyaltyProgramId.toString() === loyaltyProgramId);

    return (
        <SharedDrawer
            isOpen={true}
            onClose={onClose}
            title="Enroll Customer"
            width="500px"
        >
            <div className="drawer-body">
                <form id="enrollForm" onSubmit={handleSubmit} className="p-6">
                    
                    {/* Customer Selection */}
                    <div className="form-section">
                        <h3>SELECT CUSTOMER</h3>
                        
                        <div className="form-group relative mb-4">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                className="form-control pl-9"
                                placeholder="Search by name or code..."
                                value={customerSearch}
                                onChange={(e) => setCustomerSearch(e.target.value)}
                            />
                            {isSearching && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">Searching...</span>}
                        </div>

                        <div className="max-h-[200px] overflow-y-auto border border-gray-700 rounded-md">
                            {customers.length === 0 && !isSearching ? (
                                <div className="p-4 text-center text-muted text-sm">No customers found.</div>
                            ) : (
                                <div className="divide-y divide-gray-800">
                                    {customers.map(c => (
                                        <label key={c.partyId} className={`flex items-center p-3 hover:bg-gray-800 cursor-pointer ${partyId === c.partyId.toString() ? 'bg-blue-900/20' : ''}`}>
                                            <input 
                                                type="radio" 
                                                name="customer" 
                                                value={c.partyId} 
                                                checked={partyId === c.partyId.toString()}
                                                onChange={(e) => setPartyId(e.target.value)}
                                                className="mr-3"
                                            />
                                            <div>
                                                <div className="font-medium text-sm text-gray-200">{c.partyName}</div>
                                                <div className="text-xs text-muted">{c.partyCode} • {c.partyType}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Program Selection */}
                    <div className="form-section mt-6">
                        <h3>SELECT PROGRAM</h3>
                        <div className="form-group">
                            <select 
                                className="form-control w-full"
                                value={loyaltyProgramId}
                                onChange={(e) => setLoyaltyProgramId(e.target.value)}
                                required
                            >
                                <option value="">-- Select Active Program --</option>
                                {programs.map(p => (
                                    <option key={p.loyaltyProgramId} value={p.loyaltyProgramId}>
                                        {p.programName} ({p.programCode})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Read-Only Context */}
                    {(selectedCustomer || selectedProgram) && (
                        <div className="form-section mt-6">
                            <h3>ENROLLMENT SUMMARY</h3>
                            <div className="bg-blue-900/10 p-4 rounded-md border border-blue-800/30 space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted">Customer:</span>
                                    <span className="font-medium text-gray-200">{selectedCustomer ? selectedCustomer.partyName : 'Not selected'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted">Program:</span>
                                    <span className="font-medium text-gray-200">{selectedProgram ? selectedProgram.programName : 'Not selected'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted">Initial Points:</span>
                                    <span className="font-medium text-gray-200">0</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted">Status:</span>
                                    <span className="font-medium text-green-500">Active</span>
                                </div>
                            </div>
                        </div>
                    )}
                </form>
            </div>
            <div className="drawer-footer">
                <div className="flex justify-end gap-3 w-full">
                    <button type="button" className="secondary-btn" onClick={onClose} disabled={saving}>Cancel</button>
                    <button type="submit" form="enrollForm" className="primary-btn" disabled={saving || !partyId || !loyaltyProgramId}>
                        {saving ? 'Enrolling...' : 'Enroll Customer'}
                    </button>
                </div>
            </div>
        </SharedDrawer>
    );
};

export default EnrollCustomerDrawer;
