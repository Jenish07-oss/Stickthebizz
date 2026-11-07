"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  api,
  setAccessToken,
  clearAccessToken,
  getAccessToken,
} from "../lib/api/client";

export interface AuthUser {
  id: string;
  email: string;
  role: "MERCHANT" | "CUSTOMER" | "ADMIN";
  fullName?: string | null;
  phone?: string | null;
  [key: string]: any;
}

export interface MerchantProfile {
  id: string;
  name: string;
  slug: string;
  category: string;
  [key: string]: any;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  merchant: MerchantProfile | null;
  customer: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    token: string,
    user: AuthUser,
    merchant?: MerchantProfile | null,
    customer?: any | null
  ) => Promise<void>;
  loginCustomer: (token: string, user: AuthUser, customer?: any) => Promise<void>;
  loginMerchant: (
    token: string,
    user: AuthUser,
    merchant?: MerchantProfile | null
  ) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<boolean>;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  merchant: null,
  customer: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  loginCustomer: async () => {},
  loginMerchant: async () => {},
  logout: async () => {},
  checkSession: async () => false,
  refreshMe: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [merchant, setMerchant] = useState<MerchantProfile | null>(null);
  const [customer, setCustomer] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Validate session on mount or manual refresh via GET /api/v1/auth/me
  const checkSession = useCallback(async (): Promise<boolean> => {
    try {
      const storedToken = getAccessToken();
      if (storedToken) {
        setTokenState(storedToken);
      }

      // Calls /api/v1/auth/me with credentials: "include" and Bearer header
      const res = await api.auth.me();
      const userData = res?.data?.user || res?.user;
      const merchantData = res?.data?.merchant || res?.merchant;
      const customerData = res?.data?.customer || res?.customer;

      if (userData) {
        setUser(userData);
        if (merchantData) setMerchant(merchantData);
        if (customerData) setCustomer(customerData);
        return true;
      }

      // If no active session
      setUser(null);
      setMerchant(null);
      setCustomer(null);
      return false;
    } catch {
      setUser(null);
      setMerchant(null);
      setCustomer(null);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshMe = useCallback(async () => {
    await checkSession();
  }, [checkSession]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Atomic state dispatch: commits token to memory/storage and updates React state synchronously
  const login = useCallback(
    async (
      newToken: string,
      newUser: AuthUser,
      newMerchant?: MerchantProfile | null,
      newCustomer?: any | null
    ) => {
      setAccessToken(newToken);
      setTokenState(newToken);
      setUser(newUser);
      if (newMerchant !== undefined) setMerchant(newMerchant);
      if (newCustomer !== undefined) setCustomer(newCustomer);
      setIsLoading(false);
    },
    []
  );

  const loginCustomer = useCallback(
    async (newToken: string, newUser: AuthUser, newCustomer?: any) => {
      await login(newToken, newUser, null, newCustomer);
    },
    [login]
  );

  const loginMerchant = useCallback(
    async (
      newToken: string,
      newUser: AuthUser,
      newMerchant?: MerchantProfile | null
    ) => {
      await login(newToken, newUser, newMerchant, null);
    },
    [login]
  );

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch {
      // Continue client cleanup even if network request fails
    } finally {
      clearAccessToken();
      setTokenState(null);
      setUser(null);
      setMerchant(null);
      setCustomer(null);
      setIsLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      merchant,
      customer,
      isLoading,
      isAuthenticated: !!user,
      login,
      loginCustomer,
      loginMerchant,
      logout,
      checkSession,
      refreshMe,
    }),
    [
      user,
      token,
      merchant,
      customer,
      isLoading,
      login,
      loginCustomer,
      loginMerchant,
      logout,
      checkSession,
      refreshMe,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
