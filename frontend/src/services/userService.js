import { BASE_URL } from './apiClient';

const ME_ENDPOINT = `${BASE_URL}/api/me`;

export const userService = {

      // Modifier les informations personnelles:
      buildProfileUrl() {
        return `${ME_ENDPOINT}/profile`
      },

      // Changer le mot de passe:
      buildPasswordUrl() {
        return `${ME_ENDPOINT}/password`
      },

       //Récupéré les données utilisateur:
      buildDashboardUrl() {
        return `${ME_ENDPOINT}/dashboard`
      },
};