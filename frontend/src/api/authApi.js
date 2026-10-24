import axiosClient from './axiosClient.js';

const AUTH_URL = '/api/auth';

const authApi = {
  register: (request) => axiosClient.post(`${AUTH_URL}/register`, request),
  login: (request) => axiosClient.post(`${AUTH_URL}/login`, request),
  getCurrentUser: () => axiosClient.get(`${AUTH_URL}/me`),
};

export default authApi;
