import axios from 'axios';

export const api = axios.create({
    baseURL: 'https://boms-9707.onrender.com/api', // Adjusted base URL for API controllers
});

// Inventory
export const productsApi = {
    getAll: (params) => api.get('/products', { params }),
    getById: (id) => api.get(`/products/${id}`),
    create: (data) => api.post('/products', data),
    update: (id, data) => api.put(`/products/${id}`, data)
};

export const warehousesApi = {
    getAll: (params) => api.get('/warehouses', { params }),
    getById: (id) => api.get(`/warehouses/${id}`),
    create: (data) => api.post('/warehouses', data),
    update: (id, data) => api.put(`/warehouses/${id}`, data)
};

export const inventoryDashboardApi = {
    get: () => api.get('/inventory/dashboard')
};


export const stockApi = {
    getOverview: (params) => api.get('/stock', { params }),
    getTransactions: (params) => api.get('/stock/transactions', { params }),
    initialize: (data) => api.post('/stock/initialize', data),
    getTransfers: (params) => api.get('/stock/transfers', { params }),
    createTransfer: (data) => api.post('/stock/transfers', data),
    getAdjustments: (params) => api.get('/stock/adjustments', { params }),
    createAdjustment: (data) => api.post('/stock/adjustments', data)
};

export const suppliersApi = {
    getAll: (params) => api.get('/suppliers', { params }),
    getById: (id) => api.get(`/suppliers/${id}`),
    create: (data) => api.post('/suppliers', data),
    update: (id, data) => api.put(`/suppliers/${id}`, data),
    toggleStatus: (id) => api.post(`/suppliers/${id}/toggle-status`)
};

export const purchaseOrdersApi = {
    getAll: (params) => api.get('/purchaseorders', { params }),
    getById: (id) => api.get(`/purchaseorders/${id}`),
    createDraft: (data) => api.post('/purchaseorders', data),
    updateDraft: (id, data) => api.put(`/purchaseorders/${id}`, data),
    submit: (id) => api.post(`/purchaseorders/${id}/submit`),
    approve: (id, data) => api.post(`/purchaseorders/${id}/approve`, data),
    reject: (id, data) => api.post(`/purchaseorders/${id}/reject`, data),
    cancel: (id) => api.post(`/purchaseorders/${id}/cancel`)
};

export const authApi = {
    login: (credentials) => api.post('/auth/login', credentials),
    getProfile: () => api.get('/auth/profile')
};

export const sentinelApi = {
    getDashboard: () => api.get('/sentinel'),
    acknowledge: (id) => api.post(`/sentinel/${id}/acknowledge`),
    resolve: (id) => api.post(`/sentinel/${id}/resolve`)
};

export const usersApi = {
    getAll: (params) => api.get('/users', { params }),
    getById: (id) => api.get(`/users/${id}`),
};

export const activityApi = {
    getForEntity: (entityType, entityId) => api.get(`/activities/${entityType}/${entityId}`)
};

export const aiApi = {
    askQuestion: (data) => api.post('/ai/ask', data)
};

// Response interceptor to handle 401s globally
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response) {
            const status = error.response.status;
            
            // Standardize error messages as per enterprise standard
            if (status === 400) {
                if (error.response.data && error.response.data.Message) {
                    error.message = error.response.data.Message;
                } else if (error.response.data && error.response.data.message) {
                    error.message = error.response.data.message;
                } else {
                    error.message = "Please correct the highlighted fields.";
                }
            } else if (status === 401) {
                error.message = "Your session has expired. Please sign in again.";
                localStorage.removeItem('boms_token');
                window.location.href = '/login';
            } else if (status === 403) {
                error.message = "You do not have permission to perform this action.";
            } else if (status === 404) {
                error.message = "The requested record could not be found.";
            } else if (status === 409) {
                error.message = "This record already exists or conflicts with existing data.";
            } else if (status >= 500) {
                error.message = "Something went wrong. Please try again.";
            } else if (error.response.data && error.response.data.message) {
                error.message = error.response.data.message;
            }
        } else {
            error.message = "Network error or server is unreachable.";
        }
        return Promise.reject(error);
    }
);

// Keep existing health check pointing to root
export const checkHealth = async () => {
    try {
        const response = await axios.get('https://boms-9707.onrender.com/health');
        return {
            backend: true,
            database: response.data === 'Healthy'
        };
    } catch (error) {
        console.error("Health check failed:", error);
        return {
            backend: false,
            database: false,
            error: error.message
        };
    }
};
