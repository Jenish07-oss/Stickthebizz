"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  playScanChime,
  playApprovalBell,
  playMilestoneFanfare,
  playRejectBuzz,
} from "@/lib/audio";

export interface ShopRule {
  slug: string;
  name: string;
  minSpend: number;
  visitsRequired: number;
  validityDays: number;
  rewardName: string;
}

export interface PendingScan {
  id: string;
  customerPhone: string;
  customerMasked: string;
  amount: number;
  timestamp: number;
  formattedTime: string;
  shopSlug: string;
  status: "pending" | "approved" | "rejected";
}

export interface CustomerState {
  phone: string;
  masked: string;
  isLoggedIn: boolean;
  hasConsent: boolean;
  visits: number;
  streakHistory: Array<{
    date: string;
    amount: number;
    stampNumber: number;
  }>;
  lastScanDate: string | null; // 'YYYY-MM-DD'
  lastScanTimestamp: number;
  lockedUntilMidnight: boolean;
  activeRewardCode: string | null;
  redemptionPin: string | null;
  isRedeemed: boolean;
  hasReviewed: boolean;
  rating: number;
  comment: string;
}

export interface CustomerDirectoryRecord {
  id: string;
  phone: string;
  masked: string;
  visits: number;
  targetVisits: number;
  lastVisit: string;
  status: "Reward ready" | "Almost there" | "Collecting";
  rewardRedeemed: boolean;
}

export interface ReviewItem {
  id: string;
  customerMasked: string;
  rating: number;
  comment: string;
  date: string;
}

export type CategoryPreset = "chai" | "kirana" | "burger";

export const CATEGORY_PRESETS: Record<CategoryPreset, ShopRule> = {
  chai: {
    slug: "kesar-chai",
    name: "Kesar Chai Corner",
    minSpend: 100,
    visitsRequired: 10,
    validityDays: 40,
    rewardName: "Free Masala Chai",
  },
  kirana: {
    slug: "patel-kirana",
    name: "Patel Kirana Superstore",
    minSpend: 3000,
    visitsRequired: 10,
    validityDays: 40,
    rewardName: "1L Cooking Oil Free",
  },
  burger: {
    slug: "burger-joint",
    name: "Burger & Bun Co.",
    minSpend: 150,
    visitsRequired: 7,
    validityDays: 30,
    rewardName: "Free Crispy Burger",
  },
};

interface StoreContextType {
  rule: ShopRule;
  setCategory: (preset: CategoryPreset) => void;
  updateRule: (newRule: Partial<ShopRule>) => void;
  customer: CustomerState;
  pendingQueue: PendingScan[];
  customers: CustomerDirectoryRecord[];
  reviews: ReviewItem[];
  // Actions
  submitScan: (amount?: number) => { success: boolean; message: string };
  approveScan: (id: string) => void;
  rejectScan: (id: string) => void;
  verifyPin: (pin: string) => { success: boolean; message: string };
  fastForwardTime: (hours: number) => void;
  resetDemo: () => void;
  jumpToNearReward: () => void;
  loginCustomer: (phone: string) => void;
  logoutCustomer: () => void;
  submitReview: (rating: number, comment: string) => void;
  markRewardGiven: (customerId: string) => void;
  // Helpers
  getCountdownToMidnight: () => { hours: number; minutes: number; seconds: number; formatted: string };
}

const STORAGE_KEY = "stb_phase2_state_v2";

const getTodayDateString = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

const maskPhoneNumber = (phone: string): string => {
  if (phone.includes("@")) {
    return phone.replace(/^(.{2})(.*)(@.*)$/, "$1***$3");
  }
  const clean = phone.replace(/\D/g, "");
  if (clean.length >= 10) {
    return `${clean.slice(0, 2)}***${clean.slice(-2)}`;
  }
  return "98***12";
};

const DEFAULT_CUSTOMER: CustomerState = {
  phone: "9820012345",
  masked: "98***45",
  isLoggedIn: true,
  hasConsent: true,
  visits: 7,
  streakHistory: [
    { date: "Day 1", amount: 120, stampNumber: 1 },
    { date: "Day 3", amount: 150, stampNumber: 2 },
    { date: "Day 6", amount: 100, stampNumber: 3 },
    { date: "Day 9", amount: 140, stampNumber: 4 },
    { date: "Day 14", amount: 110, stampNumber: 5 },
    { date: "Day 18", amount: 130, stampNumber: 6 },
    { date: "Day 22", amount: 100, stampNumber: 7 },
  ],
  lastScanDate: null, // Available to scan initially
  lastScanTimestamp: Date.now() - 25 * 60 * 60 * 1000,
  lockedUntilMidnight: false,
  activeRewardCode: null,
  redemptionPin: null,
  isRedeemed: false,
  hasReviewed: false,
  rating: 5,
  comment: "",
};

const DEFAULT_PENDING_QUEUE: PendingScan[] = [
  {
    id: "scan-mock-1",
    customerPhone: "9820012345",
    customerMasked: "98***45",
    amount: 120,
    timestamp: Date.now() - 2 * 60 * 1000,
    formattedTime: "2 mins ago",
    shopSlug: "kesar-chai",
    status: "pending",
  },
];

const INITIAL_CUSTOMERS: CustomerDirectoryRecord[] = [
  {
    id: "cust-1",
    phone: "9820012345",
    masked: "98***45",
    visits: 7,
    targetVisits: 10,
    lastVisit: "Today, 10:15 AM",
    status: "Almost there",
    rewardRedeemed: false,
  },
  {
    id: "cust-2",
    phone: "9819988221",
    masked: "98***21",
    visits: 10,
    targetVisits: 10,
    lastVisit: "Today, 9:30 AM",
    status: "Reward ready",
    rewardRedeemed: false,
  },
  {
    id: "cust-3",
    phone: "9769012390",
    masked: "97***90",
    visits: 9,
    targetVisits: 10,
    lastVisit: "Yesterday, 6:45 PM",
    status: "Almost there",
    rewardRedeemed: false,
  },
  {
    id: "cust-4",
    phone: "9920345678",
    masked: "99***78",
    visits: 4,
    targetVisits: 10,
    lastVisit: "3 days ago",
    status: "Collecting",
    rewardRedeemed: false,
  },
];

const INITIAL_REVIEWS: ReviewItem[] = [
  {
    id: "rev-1",
    customerMasked: "98***21",
    rating: 5,
    comment: "The digital stamp card is brilliant! Got my free chai with the 4-digit PIN in 10 seconds.",
    date: "Today",
  },
  {
    id: "rev-2",
    customerMasked: "98***45",
    rating: 5,
    comment: "Best masala ginger tea in town. Super easy to scan at counter.",
    date: "Yesterday",
  },
  {
    id: "rev-3",
    customerMasked: "97***90",
    rating: 4,
    comment: "Quick counter billing and neat loyalty perks.",
    date: "3 days ago",
  },
];

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [rule, setRule] = useState<ShopRule>(CATEGORY_PRESETS.chai);
  const [customer, setCustomer] = useState<CustomerState>(DEFAULT_CUSTOMER);
  const [pendingQueue, setPendingQueue] = useState<PendingScan[]>(DEFAULT_PENDING_QUEUE);
  const [customers, setCustomers] = useState<CustomerDirectoryRecord[]>(INITIAL_CUSTOMERS);
  const [reviews, setReviews] = useState<ReviewItem[]>(INITIAL_REVIEWS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Sync state from localStorage
  const loadStateFromStorage = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data.rule) setRule(data.rule);
        if (data.customer) {
          // Check if lastScanDate is today
          const today = getTodayDateString();
          const isTodayLocked = data.customer.lastScanDate === today;
          setCustomer({
            ...data.customer,
            lockedUntilMidnight: isTodayLocked,
          });
        }
        if (data.pendingQueue) setPendingQueue(data.pendingQueue);
        if (data.customers) setCustomers(data.customers);
        if (data.reviews) setReviews(data.reviews);
      }
    } catch {
      // Storage parsing error
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadStateFromStorage();
  }, [loadStateFromStorage]);

  // Window 'storage' event listener for multi-tab reactivity (Tab A Customer <-> Tab B Owner)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        loadStateFromStorage();
      }
    };

    const handleCustomSync = () => {
      loadStateFromStorage();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("stb_sync", handleCustomSync);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("stb_sync", handleCustomSync);
    };
  }, [loadStateFromStorage]);

  // Save to localStorage and notify other tabs/components
  const persistState = useCallback(
    (
      newRule: ShopRule,
      newCustomer: CustomerState,
      newQueue: PendingScan[],
      newCusts: CustomerDirectoryRecord[],
      newRevs: ReviewItem[]
    ) => {
      try {
        const payload = JSON.stringify({
          rule: newRule,
          customer: newCustomer,
          pendingQueue: newQueue,
          customers: newCusts,
          reviews: newRevs,
        });
        localStorage.setItem(STORAGE_KEY, payload);
        // Dispatch custom event for same-tab reactivity
        window.dispatchEvent(new Event("stb_sync"));
      } catch {
        // LocalStorage quota error
      }
    },
    []
  );

  useEffect(() => {
    if (isLoaded) {
      persistState(rule, customer, pendingQueue, customers, reviews);
    }
  }, [rule, customer, pendingQueue, customers, reviews, isLoaded, persistState]);

  // Category Preset Switcher
  const setCategory = (preset: CategoryPreset) => {
    const nextRule = CATEGORY_PRESETS[preset] || CATEGORY_PRESETS.chai;
    setRule(nextRule);

    // Update customers target visits according to rule
    setCustomers((prev) =>
      prev.map((c) => ({
        ...c,
        targetVisits: nextRule.visitsRequired,
        status:
          c.visits >= nextRule.visitsRequired
            ? "Reward ready"
            : c.visits >= nextRule.visitsRequired - 2
            ? "Almost there"
            : "Collecting",
      }))
    );
  };

  const updateRule = (partial: Partial<ShopRule>) => {
    setRule((prev) => ({ ...prev, ...partial }));
  };

  // Submit scan from customer card
  const submitScan = (amount: number = rule.minSpend) => {
    const today = getTodayDateString();
    if (customer.lastScanDate === today) {
      return {
        success: false,
        message: "Today's visit verified! Next stamp unlocks at 12:00 AM IST.",
      };
    }

    // Play scan trigger audio
    playScanChime();

    const scanId = `scan-${Date.now()}`;
    const newScan: PendingScan = {
      id: scanId,
      customerPhone: customer.phone,
      customerMasked: customer.masked,
      amount,
      timestamp: Date.now(),
      formattedTime: "Just now",
      shopSlug: rule.slug,
      status: "pending",
    };

    setPendingQueue((prev) => [newScan, ...prev.filter((s) => s.status === "pending")]);

    return {
      success: true,
      message: `QR Scanned! Sent to ${rule.name} counter for 1-tap verification.`,
    };
  };

  // Merchant 1-Tap Approval
  const approveScan = (id: string) => {
    const scanItem = pendingQueue.find((s) => s.id === id);
    if (!scanItem) return;

    const today = getTodayDateString();
    const nextVisits = customer.visits + 1;
    const isTargetUnlocked = nextVisits >= rule.visitsRequired;

    let code = customer.activeRewardCode;
    let pin = customer.redemptionPin;

    if (isTargetUnlocked && !code) {
      code = `STB-7Q4K-${Math.floor(1000 + Math.random() * 9000)}`;
      pin = "8492"; // Standard demonstration pin
    }

    // Update customer
    setCustomer((prev) => ({
      ...prev,
      visits: nextVisits,
      lastScanDate: today,
      lastScanTimestamp: Date.now(),
      lockedUntilMidnight: true,
      activeRewardCode: code,
      redemptionPin: pin,
      streakHistory: [
        ...prev.streakHistory,
        {
          date: `Visit #${nextVisits}`,
          amount: scanItem.amount,
          stampNumber: nextVisits,
        },
      ],
    }));

    // Update pending queue status
    setPendingQueue((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: "approved" } : s))
    );

    // Update Customer Directory
    setCustomers((prev) => {
      const idx = prev.findIndex((c) => c.masked === scanItem.customerMasked);
      const status: "Reward ready" | "Almost there" | "Collecting" =
        nextVisits >= rule.visitsRequired
          ? "Reward ready"
          : nextVisits >= rule.visitsRequired - 2
          ? "Almost there"
          : "Collecting";

      const updatedRecord: CustomerDirectoryRecord = {
        id: idx >= 0 ? prev[idx].id : `cust-${Date.now()}`,
        phone: scanItem.customerPhone,
        masked: scanItem.customerMasked,
        visits: nextVisits,
        targetVisits: rule.visitsRequired,
        lastVisit: "Today, Just now",
        status,
        rewardRedeemed: false,
      };

      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updatedRecord;
        return copy;
      }
      return [updatedRecord, ...prev];
    });

    // Play resonant bell or milestone fanfare
    if (isTargetUnlocked) {
      playMilestoneFanfare();
    } else {
      playApprovalBell();
    }
  };

  // Merchant Rejection
  const rejectScan = (id: string) => {
    playRejectBuzz();
    setPendingQueue((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: "rejected" } : s))
    );
  };

  // Verify PIN Redemption at Merchant Counter
  const verifyPin = (pin: string) => {
    const cleanPin = pin.trim();
    if (cleanPin === (customer.redemptionPin || "8492")) {
      playApprovalBell();
      setCustomer((prev) => ({
        ...prev,
        isRedeemed: true,
      }));

      setCustomers((prev) =>
        prev.map((c) =>
          c.masked === customer.masked ? { ...c, rewardRedeemed: true } : c
        )
      );

      return {
        success: true,
        message: `✓ Voucher PIN verified! ${rule.rewardName} redeemed for ${customer.masked}.`,
      };
    }

    playRejectBuzz();
    return {
      success: false,
      message: "Invalid 4-digit PIN. Please verify with customer voucher screen.",
    };
  };

  // Demo Fast Forward
  const fastForwardTime = (hours: number = 12) => {
    setCustomer((prev) => ({
      ...prev,
      lastScanDate: null,
      lastScanTimestamp: Date.now() - hours * 60 * 60 * 1000,
      lockedUntilMidnight: false,
    }));
  };

  const jumpToNearReward = () => {
    const near = Math.max(0, rule.visitsRequired - 1);
    setCustomer((prev) => ({
      ...prev,
      visits: near,
      lastScanDate: null,
      lockedUntilMidnight: false,
      activeRewardCode: null,
      redemptionPin: null,
      isRedeemed: false,
    }));
  };

  const resetDemo = () => {
    setCustomer({
      ...DEFAULT_CUSTOMER,
      phone: "9820012345",
      masked: "98***45",
      visits: 0,
      streakHistory: [],
      lastScanDate: null,
      lastScanTimestamp: 0,
      lockedUntilMidnight: false,
      activeRewardCode: null,
      redemptionPin: null,
      isRedeemed: false,
      hasReviewed: false,
      rating: 5,
      comment: "",
    });
    setPendingQueue([]);
  };

  const loginCustomer = (phone: string) => {
    const masked = maskPhoneNumber(phone);
    setCustomer((prev) => ({
      ...prev,
      phone,
      masked,
      isLoggedIn: true,
      hasConsent: true,
    }));
  };

  const logoutCustomer = () => {
    setCustomer((prev) => ({
      ...prev,
      isLoggedIn: false,
    }));
  };

  const submitReview = (rating: number, comment: string) => {
    const newRev: ReviewItem = {
      id: `rev-${Date.now()}`,
      customerMasked: customer.masked,
      rating,
      comment: comment.trim() || "Great rewards and quick service!",
      date: "Just now",
    };

    setReviews((prev) => [newRev, ...prev]);
    setCustomer((prev) => ({
      ...prev,
      hasReviewed: true,
      rating,
      comment,
    }));
  };

  const markRewardGiven = (customerId: string) => {
    playApprovalBell();
    setCustomer((prev) => ({ ...prev, isRedeemed: true }));
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId || c.phone === customerId || c.masked === customerId
          ? { ...c, rewardRedeemed: true }
          : c
      )
    );
  };

  const getCountdownToMidnight = () => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);

    const diff = Math.max(0, midnight.getTime() - now.getTime());
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const formatted = `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(
      2,
      "0"
    )}m ${String(seconds).padStart(2, "0")}s`;

    return { hours, minutes, seconds, formatted };
  };

  return (
    <StoreContext.Provider
      value={{
        rule,
        setCategory,
        updateRule,
        customer,
        pendingQueue,
        customers,
        reviews,
        submitScan,
        approveScan,
        rejectScan,
        verifyPin,
        fastForwardTime,
        resetDemo,
        jumpToNearReward,
        loginCustomer,
        logoutCustomer,
        submitReview,
        markRewardGiven,
        getCountdownToMidnight,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return ctx;
}
