import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';

import type { User } from '@/lib/types';
import {
  fetchCurrentUser,
  loginRequest,
  registerRequest,
  RegisterPayload,
  setAuthToken,
} from '@/lib/api';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    typeof localStorage !== 'undefined' ? localStorage.getItem('cop-token') : null,
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const loadUser = useCallback(async () => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await fetchCurrentUser();
      setUser(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setAuthToken(null);
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    setAuthToken(token);
    loadUser();
  }, [token, loadUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      setError(null);
      try {
        const accessToken = await loginRequest(email, password);
        setToken(accessToken);
        setAuthToken(accessToken);
        const data = await fetchCurrentUser();
        setUser(data);
      } catch (err) {
        console.error(err);
        setError('Authentication failed');
        setToken(null);
        setAuthToken(null);
        setUser(null);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const register = useCallback(async (payload: RegisterPayload) => {
    const created = await registerRequest(payload);
    return created;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setAuthToken(null);
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout, error }),
    [user, token, loading, login, register, logout, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
