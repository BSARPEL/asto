import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import type { Profile } from '@asto/shared';
import { TOKEN_REWARDS } from '@asto/shared';
import { getFirebaseAuth, getFirebaseIdToken } from './firebase';
import {
  firebaseGetAdCountToday,
  firebaseGetProfile,
  firebaseLogin,
  firebaseLogout,
  firebaseRegister,
} from './firebase-profile';
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

async function loadSession(userId: string) {
  const [profile, adClaimsToday, token] = await Promise.all([
    firebaseGetProfile(userId),
    firebaseGetAdCountToday(userId),
    getFirebaseIdToken(),
  ]);
  return { profile, adClaimsToday, token };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [adClaimsToday, setAdClaimsToday] = useState(0);
  const maxAdsPerDay = TOKEN_REWARDS.maxRewardedAdsPerDay;

  const refresh = useCallback(async () => {
    const user = getFirebaseAuth().currentUser;
    if (!user) return;
    const session = await loadSession(user.uid);
    if (session.profile) setProfile(session.profile);
    setAdClaimsToday(session.adClaimsToday);
    if (session.token) {
      setToken(session.token);
      await storage.setItem(TOKEN_KEY, session.token);
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(getFirebaseAuth(), async (user) => {
      try {
        if (!user) {
          setToken(null);
          setProfile(null);
          setAdClaimsToday(0);
          await storage.deleteItem(TOKEN_KEY);
          return;
        }
        const session = await loadSession(user.uid);
        if (!session.profile) {
          await firebaseLogout();
          return;
        }
        setProfile(session.profile);
        setAdClaimsToday(session.adClaimsToday);
        if (session.token) {
          setToken(session.token);
          await storage.setItem(TOKEN_KEY, session.token);
        }
      } catch (e) {
        console.error('[auth] Oturum yüklenemedi:', e);
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const p = await firebaseLogin(email, password);
    const idToken = await getFirebaseIdToken();
    setProfile(p);
    if (idToken) {
      setToken(idToken);
      await storage.setItem(TOKEN_KEY, idToken);
    }
    setAdClaimsToday(await firebaseGetAdCountToday(p.id));
  }, []);

  const register = useCallback(async (email: string, password: string, displayName: string) => {
    const p = await firebaseRegister(email, password, displayName);
    const idToken = await getFirebaseIdToken();
    setProfile(p);
    if (idToken) {
      setToken(idToken);
      await storage.setItem(TOKEN_KEY, idToken);
    }
    setAdClaimsToday(0);
  }, []);

  const logout = useCallback(async () => {
    await firebaseLogout();
    await storage.deleteItem(TOKEN_KEY);
    setToken(null);
    setProfile(null);
    setAdClaimsToday(0);
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
