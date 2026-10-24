import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import authApi from '../api/authApi.js';
import {
  AUTH_INVALIDATED_EVENT,
  LOGOUT_EVENT,
  TOKEN_STORAGE_KEY,
} from '../api/axiosClient.js';
import { getApiError } from '../utils/apiError.js';

const AuthContext = createContext(null);
let currentUserRequest;

function restoreCurrentUser() {
  if (!currentUserRequest) {
    currentUserRequest = authApi.getCurrentUser()
      .then(({ data }) => {
        toast.success('Your session has been restored.');
        return data;
      })
      .catch((error) => {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        const result = getApiError(error, 'Your session could not be restored. Please sign in again.');
        toast.error(result.message);
        throw error;
      });
  }
  return currentUserRequest;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);

    if (!token) {
      setIsLoading(false);
      return () => {
        isMounted = false;
      };
    }

    restoreCurrentUser()
      .then((profile) => {
        if (isMounted) setUser(profile);
      })
      .catch(() => {
        if (isMounted) {
          setUser(null);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const invalidateSession = () => {
      setUser(null);
      setIsLoading(false);
    };

    window.addEventListener(AUTH_INVALIDATED_EVENT, invalidateSession);
    window.addEventListener(LOGOUT_EVENT, invalidateSession);
    return () => {
      window.removeEventListener(AUTH_INVALIDATED_EVENT, invalidateSession);
      window.removeEventListener(LOGOUT_EVENT, invalidateSession);
    };
  }, []);

  const acceptAuthentication = useCallback((authResponse) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, authResponse.token);
    setUser(authResponse.user);
    return authResponse.user;
  }, []);

  const login = useCallback(async (credentials) => {
    const { data } = await authApi.login(credentials);
    return acceptAuthentication(data);
  }, [acceptAuthentication]);

  const register = useCallback(async (details) => {
    const { data } = await authApi.register(details);
    return acceptAuthentication(data);
  }, [acceptAuthentication]);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setUser(null);
    window.dispatchEvent(new Event(LOGOUT_EVENT));
  }, []);

  const value = useMemo(() => ({
    user,
    isLoading,
    isAuthenticated: Boolean(user),
    login,
    register,
    logout,
  }), [user, isLoading, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
