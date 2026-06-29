export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export function buildRequestOptions({ method = 'GET', body, headers = {} } = {}) {

        const options = {
            method,
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                ...headers,
            },
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        return options;
}