import { api } from './api';

export const loyaltyApi = {
    getProgramKpis: () => api.get('/loyalty/programs/kpis'),
    getPrograms: (params) => api.get('/loyalty/programs', { params }),
    getProgramById: (id) => api.get(`/loyalty/programs/${id}`),
    createProgram: (data) => api.post('/loyalty/programs', data),
    updateProgram: (id, data) => api.put(`/loyalty/programs/${id}`, data),
    activateProgram: (id) => api.post(`/loyalty/programs/${id}/activate`),
    deactivateProgram: (id) => api.post(`/loyalty/programs/${id}/deactivate`),

    // Tiers
    getTierKpis: () => api.get('/loyalty/tiers/kpis'),
    getTiers: (params) => api.get('/loyalty/tiers', { params }),
    getTierById: (id) => api.get(`/loyalty/tiers/${id}`),
    createTier: (data) => api.post('/loyalty/tiers', data),
    updateTier: (id, data) => api.put(`/loyalty/tiers/${id}`, data),
    activateTier: (id) => api.post(`/loyalty/tiers/${id}/activate`),
    deactivateTier: (id) => api.post(`/loyalty/tiers/${id}/deactivate`),

    // Benefits
    getBenefitsByTier: (tierId) => api.get(`/loyalty/tiers/${tierId}/benefits`),
    createBenefit: (tierId, data) => api.post(`/loyalty/tiers/${tierId}/benefits`, data),
    updateBenefit: (id, data) => api.put(`/loyalty/benefits/${id}`, data),
    activateBenefit: (id) => api.post(`/loyalty/benefits/${id}/activate`),
    deactivateBenefit: (id) => api.post(`/loyalty/benefits/${id}/deactivate`),

    // Rewards
    getRewards: (params) => api.get('/loyalty/rewards', { params }),
    getRewardKpis: () => api.get('/loyalty/rewards/kpis'),
    getRewardById: (id) => api.get(`/loyalty/rewards/${id}`),
    createReward: (data) => api.post('/loyalty/rewards', data),
    updateReward: (id, data) => api.put(`/loyalty/rewards/${id}`, data),
    activateReward: (id) => api.post(`/loyalty/rewards/${id}/activate`),
    deactivateReward: (id) => api.post(`/loyalty/rewards/${id}/deactivate`),

    // Promotions
    getPromotions: (params) => api.get('/loyalty/promotions', { params }),
    getPromotionKpis: () => api.get('/loyalty/promotions/kpis'),
    getPromotionById: (id) => api.get(`/loyalty/promotions/${id}`),
    createPromotion: (data) => api.post('/loyalty/promotions', data),
    updatePromotion: (id, data) => api.put(`/loyalty/promotions/${id}`, data),
    activatePromotion: (id) => api.post(`/loyalty/promotions/${id}/activate`),
    deactivatePromotion: (id) => api.post(`/loyalty/promotions/${id}/deactivate`),

    // Memberships
    getMembershipKpis: () => api.get('/loyalty/memberships/kpis'),
    getMemberships: (params) => api.get('/loyalty/memberships', { params }),
    getMembershipById: (id) => api.get(`/loyalty/memberships/${id}`),
    enrollCustomer: (data) => api.post('/loyalty/memberships', data),
    activateMembership: (id) => api.post(`/loyalty/memberships/${id}/activate`),
    deactivateMembership: (id) => api.post(`/loyalty/memberships/${id}/deactivate`),
    getCustomersDropdown: (search) => api.get('/loyalty/memberships/customers-dropdown', { params: { search } }),
    
    // Transactions
    getTransactionKpis: () => api.get('/loyalty/transactions/kpis'),
    getTransactions: (params) => api.get('/loyalty/transactions', { params }),
    getTransactionById: (id) => api.get(`/loyalty/transactions/${id}`),
    createTransaction: (data) => api.post('/loyalty/transactions', data),
};
