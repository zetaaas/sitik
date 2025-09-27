import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import axios from 'axios';
import { useQueryClient } from '@tanstack/react-query';

import type { User } from '@/lib/types';
import {
  fetchCurrentUser,
  LoginChallenge,
  loginRequest,
  registerRequest,
  RegisterPayload,
  setAuthToken,
  verifyTwoFactorRequest,
} from '@/lib/api';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  verifyTwoFactor: (challengeId: string, code: string) => Promise<void>;
  twoFactorChallenge: TwoFactorChallenge | null;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => void;
  error: string | null;
}

interface TwoFactorChallenge {
  challengeId: string;
  maskedPhone: string;
  expiresIn: number;
  email: string;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    typeof localStorage !== 'undefined' ? localStorage.getItem('cop-token') : null,
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [twoFactorChallenge, setTwoFactorChallenge] = useState<TwoFactorChallenge | null>(null);
  const queryClient = useQueryClient();

  const extractErrorMessage = useCallback((err: unknown) => {
    if (axios.isAxiosError(err)) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        return detail;
      }
    }
    return 'Ошибка аутентификации';
  }, []);

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
      setToken(null);
      setAuthToken(null);
      setUser(null);
      try {
        const challenge: LoginChallenge = await loginRequest(email, password);
        setTwoFactorChallenge({
          challengeId: challenge.challenge_id,
          maskedPhone: challenge.masked_phone,
          expiresIn: challenge.expires_in,
          email,
        });
      } catch (err) {
        console.error(err);
        setError(extractErrorMessage(err));
        setTwoFactorChallenge(null);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [extractErrorMessage],
  );

  const verifyTwoFactor = useCallback(
    async (challengeId: string, code: string) => {
      setLoading(true);
      setError(null);
      try {
        const accessToken = await verifyTwoFactorRequest(challengeId, code);
        setToken(accessToken);
        setAuthToken(accessToken);
        const data = await fetchCurrentUser();
        setUser(data);
        setTwoFactorChallenge(null);
      } catch (err) {
        console.error(err);
        setError(extractErrorMessage(err));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [extractErrorMessage],
  );

  const register = useCallback(async (payload: RegisterPayload) => {
    const created = await registerRequest(payload);
    return created;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setAuthToken(null);
    setTwoFactorChallenge(null);
    setError(null);
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo(
    () => ({ user, token, loading, login, verifyTwoFactor, twoFactorChallenge, register, logout, error }),
    [user, token, loading, login, verifyTwoFactor, twoFactorChallenge, register, logout, error],
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
