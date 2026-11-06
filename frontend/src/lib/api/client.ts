const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

let inMemoryToken: string | null = null;
let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

export function setAccessToken(token: string | null) {
  inMemoryToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("stb_access_token", token);
    } else {
      localStorage.removeItem("stb_access_token");
    }
  }
}

export function getAccessToken(): string | null {
  if (inMemoryToken) return inMemoryToken;
  if (typeof window !== "undefined") {
    return localStorage.getItem("stb_access_token");
  }
  return null;
}

export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
  [key: string]: any;
}

/**
 * Unified fetch wrapper with auto cookie credentials, Bearer header, and 401 token refresh retry.
 */
export async function apiClient<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const token = getAccessToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: "include", // Required for HTTP-only refresh cookies across domains
  };

  let response = await fetch(url, config);

  // If 401 and not already refreshing or calling refresh/login endpoint
  if (
    response.status === 401 &&
    !endpoint.includes("/auth/refresh") &&
    !endpoint.includes("/auth/owner/login") &&
    !endpoint.includes("/auth/customer/otp/verify")
  ) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshRes = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          const newToken = refreshData.accessToken || refreshData.token;
          setAccessToken(newToken);
          refreshQueue.forEach((cb) => cb(newToken));
          refreshQueue = [];

          // Retry initial request with new token
          headers.set("Authorization", `Bearer ${newToken}`);
          response = await fetch(url, { ...config, headers });
        } else {
          setAccessToken(null);
          refreshQueue.forEach((cb) => cb(null));
          refreshQueue = [];
        }
      } catch {
        setAccessToken(null);
      } finally {
        isRefreshing = false;
      }
    } else {
      // Wait for ongoing refresh to complete
      const newToken = await new Promise<string | null>((resolve) => {
        refreshQueue.push(resolve);
      });

      if (newToken) {
        headers.set("Authorization", `Bearer ${newToken}`);
        response = await fetch(url, { ...config, headers });
      }
    }
  }

  const contentType = response.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const errorMsg = data?.error || data?.message || `HTTP ${response.status} Request failed`;
    const err = new Error(errorMsg);
    (err as any).status = response.status;
    (err as any).data = data;
    throw err;
  }

  return data as T;
}

// -------------------------------------------------------------
// Typed API SDK Namespaces
// -------------------------------------------------------------

export const api = {
  auth: {
    requestCustomerOtp: (email: string) =>
      apiClient("/api/v1/auth/customer/otp/request", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
    verifyCustomerOtp: (data: { email: string; code: string; phone?: string; fullName?: string }) =>
      apiClient<{ success: boolean; token?: string; user?: any; customer?: any; message?: string }>("/api/v1/auth/customer/otp/verify", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    ownerRegister: (data: { email: string; password?: string; fullName: string; phone?: string; shopName?: string }) =>
      apiClient("/api/v1/auth/owner/register", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    ownerLogin: (data: { email: string; password?: string; pin?: string }) =>
      apiClient("/api/v1/auth/owner/login", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    getMe: () => apiClient("/api/v1/auth/me"),
    logout: () => apiClient("/api/v1/auth/logout", { method: "POST" }),
    refresh: () => apiClient("/api/v1/auth/refresh", { method: "POST" }),
  },
  scans: {
    punch: (data: { customerPhone: string; merchantId: string; billAmount?: number; customerName?: string; scannedQrToken?: string; idempotencyKey?: string }) =>
      apiClient("/api/v1/scans/punch", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    approve: (visitId: string) =>
      apiClient(`/api/v1/scans/${visitId}/approve`, {
        method: "POST",
        body: JSON.stringify({ visitId }),
      }),
    reject: (visitId: string) =>
      apiClient(`/api/v1/scans/${visitId}/reject`, {
        method: "POST",
        body: JSON.stringify({ visitId }),
      }),
    redeem: (merchantId: string, pin: string, customerPhone?: string) =>
      apiClient("/api/v1/scans/redeem", {
        method: "POST",
        body: JSON.stringify({ merchantId, pin, customerPhone }),
      }),
    status: (merchantId: string, phone?: string) =>
      apiClient(`/api/v1/scans/status?merchantId=${merchantId}${phone ? `&customerPhone=${encodeURIComponent(phone)}` : ""}`),
    pending: (merchantId: string) =>
      apiClient(`/api/v1/scans/pending?merchantId=${merchantId}`),
    ledger: (merchantId: string, limit: number = 50) =>
      apiClient(`/api/v1/scans/ledger?merchantId=${merchantId}&limit=${limit}`),
  },
  customers: {
    wallet: (phone?: string, email?: string) =>
      apiClient(`/api/v1/customers/wallet${phone ? `?phone=${encodeURIComponent(phone)}` : email ? `?email=${encodeURIComponent(email)}` : ""}`),
    updateProfile: (fullName: string, phone: string) =>
      apiClient("/api/v1/customers/profile", {
        method: "PATCH",
        body: JSON.stringify({ fullName, phone }),
      }),
    sync: (data: { phone?: string; email?: string; fullName?: string }) =>
      apiClient("/api/v1/customers/sync", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    exportData: () => apiClient("/api/v1/customers/export"),
    deleteAccount: () => apiClient("/api/v1/customers/profile", { method: "DELETE" }),
  },
  merchants: {
    me: () => apiClient("/api/v1/merchant/me"),
    bySlug: (slug: string) => apiClient(`/api/v1/merchant/slug/${encodeURIComponent(slug)}`),
    updateRules: (data: { merchantId: string; name?: string; category?: string; minSpend?: number; visitsRequired?: number; rewardName?: string; validityDays?: number; redemptionPin?: string }) =>
      apiClient("/api/v1/merchant/rules", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    rotateQr: (merchantId: string) =>
      apiClient("/api/v1/merchant/rotate-qr", {
        method: "POST",
        body: JSON.stringify({ merchantId }),
      }),
    updatePin: (merchantId: string, pin: string) =>
      apiClient("/api/v1/merchant/terminal-pin", {
        method: "PATCH",
        body: JSON.stringify({ merchantId, pin }),
      }),
  },
  subscriptions: {
    validatePromo: (code: string, planId: string = "MONTHLY") =>
      apiClient("/api/v1/subscriptions/validate-promo", {
        method: "POST",
        body: JSON.stringify({ code, planId }),
      }),
    createOrder: (planOrData: string | { planId: string; promoCode?: string; shopName?: string; email?: string; mobile?: string }, promoCode?: string) => {
      const payload = typeof planOrData === "string" ? { planId: planOrData, promoCode } : planOrData;
      return apiClient<any>("/api/v1/subscriptions/create-order", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    activate: (data: { orderId?: string; paymentId?: string; signature?: string; planId: string; promoCode?: string; shopName?: string; ownerName?: string; category?: string; mobile?: string; email?: string }) =>
      apiClient<any>("/api/v1/subscriptions/activate", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    status: (merchantId: string) =>
      apiClient(`/api/v1/subscriptions/status/${merchantId}`),
  },
};

