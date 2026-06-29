import { BASE_URL } from './apiClient';

const AUTH_ENDPOINT = `${BASE_URL}/api/auth`;

export const authService = {

    buildLoginUrl() {
        return `${AUTH_ENDPOINT}/login`;
    },

    buildRegisterUrl() {
        return `${AUTH_ENDPOINT}/register`;
    },

    buildMeUrl() {
        return `${AUTH_ENDPOINT}/me`;
    },

    buildLogoutUrl() {
        return `${AUTH_ENDPOINT}/logout`;
    },

}