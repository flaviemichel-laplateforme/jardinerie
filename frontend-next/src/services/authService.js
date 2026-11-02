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

    buildRequestPasswordResetUrl() {
        return `${AUTH_ENDPOINT}/request-password-reset`;
    },

    buildResetPasswordUrl() {
        return `${AUTH_ENDPOINT}/reset-password`;
    },

    // Les liens des e-mails (vérification, changement d'adresse) sont validés par un POST qui porte le jeton dans le corps :
    // un robot qui ouvre le lien (antivirus, aperçu d'e-mail) ne l'utilise donc pas à la place de la personne.
    buildVerifyEmailUrl() {
        return `${AUTH_ENDPOINT}/verify-email`;
    },

    buildConfirmEmailChangeUrl() {
        return `${AUTH_ENDPOINT}/confirm-email-change`;
    },

}
