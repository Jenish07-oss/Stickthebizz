"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, setAccessToken, getAccessToken } from "../lib/api/client";

export interface AuthUser {
  id: string;
  email: string;
  role: "MERCHANT" | "CUSTOMER" | "ADMIN";
  fullName?: string | null;
  phone?: string | null;
  [key: string]: any;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  merchant: any | null;
  customer: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginCustomer: (token: string, user: AuthUser, customer?: any) => void;
  loginMerchant: (token: string, user: AuthUser, merchant?: any) => void;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  merchant: null,
  customer: null,
  isLoading: true,
  isAuthenticated: false,
  loginCustomer: () => {},
  loginMerchant: () => {},
  logout: async () => {},
  refreshMe: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [merchant, setMerchant] = useState<any | null>(null);
  const [customer, setCustomer] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    try {
      const storedToken = getAccessToken();
      if (!storedToken) {
        setUser(null);
        setMerchant(null);
        setCustomer(null);
        setIsLoading(false);
        return;
      }

      setTokenState(storedToken);
      const res = await api.auth.getMe();
      if (res && res.user) {
        setUser(res.user);
        if (res.user.role === "MERCHANT" && res.merchant) {
          setMerchant(res.merchant);
        }
        if (res.customer) {
          setCustomer(res.customer);
        }
      } else {
        setUser(null);
        setMerchant(null);
        setCustomer(null);
      }
    } catch {
      setUser(null);
      setMerchant(null);
      setCustomer(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  const loginCustomer = (newToken: string, newUser: AuthUser, newCustomer?: any) => {
    setAccessToken(newToken);
    setTokenState(newToken);
    setUser(newUser);
    if (newCustomer) setCustomer(newCustomer);
  };

  const loginMerchant = (newToken: string, newUser: AuthUser, newMerchant?: any) => {
    setAccessToken(newToken);
    setTokenState(newToken);
    setUser(newUser);
    if (newMerchant) setMerchant(newMerchant);
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch {
      // Continue client cleanup even if network fails
    } finally {
      setAccessToken(null);
      setTokenState(null);
      setUser(null);
      setMerchant(null);
      setCustomer(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        merchant,
        customer,
        isLoading,
        isAuthenticated: !!user,
        loginCustomer,
        loginMerchant,
        logout,
        refreshMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

