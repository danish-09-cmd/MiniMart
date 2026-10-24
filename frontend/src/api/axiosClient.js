import axios from 'axios';

export const TOKEN_STORAGE_KEY = 'minimart_token';
export const AUTH_INVALIDATED_EVENT = 'minimart:auth-invalidated';
export const LOGOUT_EVENT = 'minimart:logout';

const baseURL = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '');

const axiosClient = axios.create({
  baseURL,
  headers: {
    Accept: 'application/json',
  },
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      window.dispatchEvent(new Event(AUTH_INVALIDATED_EVENT));

      // Keep a failed sign-in visible on the sign-in form so its message is not lost.
      if (!['/login', '/register'].includes(window.location.pathname)) {
        const currentRoute = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        const redirect = encodeURIComponent(currentRoute || '/');
        window.location.replace(`/login?redirect=${redirect}`);
      }
    }
    return Promise.reject(error);
  },
);

export default axiosClient;
