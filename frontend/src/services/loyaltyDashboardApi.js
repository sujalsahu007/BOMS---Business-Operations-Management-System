import { api } from './api';

export const loyaltyDashboardApi = {
    getSummary: () => api.get('/loyalty/dashboard/summary')
};
