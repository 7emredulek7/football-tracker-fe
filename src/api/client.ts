export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export const apiClient = {
    async request(endpoint: string, options: RequestInit = {}) {
        const token = localStorage.getItem('token');

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...((options.headers as Record<string, string>) || {}),
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        // Some endpoints might return 204 No Content
        if (response.status === 204) {
            return null;
        }

        return response.json();
    },

    get(endpoint: string, options?: RequestInit) {
        return this.request(endpoint, { ...options, method: 'GET' });
    },

    post(endpoint: string, body: any, options?: RequestInit) {
        return this.request(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(body),
        });
    },

    put(endpoint: string, body: any, options?: RequestInit) {
        return this.request(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(body),
        });
    },

    delete(endpoint: string, options?: RequestInit) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    },
};
