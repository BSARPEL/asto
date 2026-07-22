import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Profile } from '@asto/shared';
import { api } from './api';
import * as storage from './storage';

const TOKEN_KEY = 'asto_auth_token';

type AuthContextValue = {
  token: string | null;
  profile: Profile | null;
  loading: boolean;
  adClaimsToday: number;
  maxAdsPerDay: number;
  refresh: () => Promise<void>;
  setProfile: (p: Profile) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [adClaimsToday, setAdClaimsToday] = useState(0);
  const [maxAdsPerDay, setMaxAdsPerDay] = useState(5);

  const refresh = useCallback(async () => {
    if (!token) return;
    const data = await api.me(token);
    setProfile(data.profile);
    setAdClaimsToday(data.adClaimsToday);
    setMaxAdsPerDay(data.maxAdsPerDay);
  }, [token]);

  useEffect(() => {
    (async () => {
      try {
        const stored = await storage.getItem(TOKEN_KEY);
        if (stored) {
          setToken(stored);
          const data = await api.me(stored);
          setProfile(data.profile);
          setAdClaimsToday(data.adClaimsToday);
          setMaxAdsPerDay(data.maxAdsPerDay);
        }
      } catch {
        await storage.deleteItem(TOKEN_KEY);
        setToken(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.login(email, password);
    await storage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setProfile(data.profile);
  }, []);

  const register = useCallback(async (email: string, password: string, displayName: string) => {
    const data = await api.register(email, password, displayName);
    await storage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setProfile(data.profile);
  }, []);

  const logout = useCallback(async () => {
    await storage.deleteItem(TOKEN_KEY);
    setToken(null);
    setProfile(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      profile,
      loading,
      adClaimsToday,
      maxAdsPerDay,
      refresh,
      setProfile,
      login,
      register,
      logout,
    }),
    [token, profile, loading, adClaimsToday, maxAdsPerDay, refresh, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth AuthProvider içinde kullanılmalı');
  return ctx;
}
