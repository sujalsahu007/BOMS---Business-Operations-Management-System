import { api } from './api';

export const contractApi = {
    // Dashboard
    getDashboard: async () => {
        const response = await api.get('/contracts/dashboard');
        return response.data;
    },

    // Parties
    getParties: async (params) => {
        const response = await api.get('/contract-parties', { params });
        return response.data;
    },
    getPartyById: async (id) => {
        const response = await api.get(`/contract-parties/${id}`);
        return response.data;
    },
    createParty: async (data) => {
        const response = await api.post('/contract-parties', data);
        return response.data;
    },
    updateParty: async (id, data) => {
        const response = await api.put(`/contract-parties/${id}`, data);
        return response.data;
    },
    deactivateParty: async (id) => {
        const response = await api.post(`/contract-parties/${id}/deactivate`);
        return response.data;
    },

    // Contracts
    getContracts: async (params) => {
        const response = await api.get('/contracts', { params });
        return response.data;
    },
    getRenewalsExpiry: async (params) => {
        const response = await api.get('/contracts/renewals-expiry', { params });
        return response.data;
    },
    getContractById: async (id) => {
        const response = await api.get(`/contracts/${id}`);
        return response.data;
    },
    createContract: async (data) => {
        const response = await api.post('/contracts', data);
        return response.data;
    },
    updateContract: async (id, data) => {
        const response = await api.put(`/contracts/${id}`, data);
        return response.data;
    },
    // Renewal & Signatures
    renewContract: async (id, data) => {
        const response = await api.post(`/contracts/${id}/renew`, data);
        return response.data;
    },
    sendForSignature: async (id, data) => {
        const response = await api.post(`/contracts/${id}/send-signature`, data);
        return response.data;
    },
    getSigningRequest: async (id) => {
        const response = await api.get(`/contracts/${id}/signing-request`);
        return response.data;
    },

    // Status Transitions
    submitForReview: async (id) => {
        const response = await api.post(`/contracts/${id}/submit-review`);
        return response.data;
    },
    submitForApproval: async (id) => {
        const response = await api.post(`/contracts/${id}/submit-approval`);
        return response.data;
    },
    approveContract: async (id, data) => {
        const response = await api.post(`/contracts/${id}/approve`, data);
        return response.data;
    },
    rejectContract: async (id, data) => {
        const response = await api.post(`/contracts/${id}/reject`, data);
        return response.data;
    },
    terminateContract: async (id) => {
        const response = await api.post(`/contracts/${id}/terminate`);
        return response.data;
    },

    // Approvals History & Pending
    getContractApprovals: async (id) => {
        const response = await api.get(`/contracts/${id}/approvals`);
        return response.data;
    },
    getPendingApprovals: async (params) => {
        const response = await api.get('/contracts/approvals', { params });
        return response.data;
    },

    // Obligations
    getObligationKpis: async () => {
        const response = await api.get('/contracts/obligations/kpis');
        return response.data;
    },
    getAllObligations: async (params) => {
        const response = await api.get('/contracts/obligations', { params });
        return response.data;
    },
    getObligations: async (contractId) => {
        const response = await api.get(`/contracts/${contractId}/obligations`);
        return response.data;
    },
    createObligation: async (contractId, data) => {
        const response = await api.post(`/contracts/${contractId}/obligations`, data);
        return response.data;
    },
    updateObligation: async (id, data) => {
        const response = await api.put(`/obligations/${id}`, data);
        return response.data;
    },
    completeObligation: async (id) => {
        const response = await api.post(`/obligations/${id}/complete`);
        return response.data;
    },
    cancelObligation: async (id) => {
        const response = await api.post(`/obligations/${id}/cancel`);
        return response.data;
    },

    // Documents
    getDocuments: async (contractId) => {
        const response = await api.get(`/contracts/${contractId}/documents`);
        return response.data;
    },
    uploadDocument: async (contractId, file) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post(`/contracts/${contractId}/documents`, formData);
        return response.data;
    },
    getDocumentDownloadUrl: (contractId, documentId) => {
        return `${api.defaults.baseURL}/contracts/${contractId}/documents/download/${documentId}`;
    },
    downloadDocument: async (contractId, documentId) => {
        const response = await api.get(`/contracts/${contractId}/documents/download/${documentId}`, {
            responseType: 'blob'
        });
        return response.data;
    },

    // Activities
    getActivitiesByReference: async (referenceId, module) => {
        const response = await api.get(`/activities/Contract/${referenceId}`);
        return response.data;
    }
};
