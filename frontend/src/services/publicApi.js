import axios from 'axios';

const API_BASE_URL = 'https://boms-9707.onrender.com/api/public';

const publicApi = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Since this is public, we don't attach any Authorization tokens.

export const signatureApi = {
    getSignaturePage: async (token) => {
        const response = await publicApi.get(`/signature/${token}`);
        return response.data;
    },
    markViewed: async (token) => {
        const response = await publicApi.post(`/signature/${token}/view`);
        return response.data;
    },
    signContract: async (token, data) => {
        const response = await publicApi.post(`/signature/${token}/sign`, data);
        return response.data;
    },
    declineSignature: async (token, data) => {
        const response = await publicApi.post(`/signature/${token}/decline`, data);
        return response.data;
    }
};
