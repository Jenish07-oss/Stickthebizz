"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface ShopRule {
  shopName: string;
  slug: string;
  minSpend: number;
  visitsNeeded: number;
  expiryDays: number;
  rewardName: string;
}

export interface RewardTicketData {
  code: string;
  pin: string;
  rewardName: string;
  expiryDate: string;
  isRedeemed: boolean;
}

export interface CustomerData {
  identifier: string;
  isLoggedIn: boolean;
  hasConsent: boolean;
  visits: number;
  lastScanTimestamp: number; // in ms
  cycleStartTimestamp: number;
  rewardTicket: RewardTicketData | null;
  hasReviewed: boolean;
  rating: number;
  comment: string;
}

export interface ReviewItem {
  id: string;
  customerMasked: string;
  rating: number;
  comment: string;
  date: string;
}

export interface CustomerRecord {
  id: string;
  masked: string;
  visits: number;
  targetVisits: number;
  lastVisit: string;
  status: "Reward ready" | "Almost there" | "Collecting";
  rewardRedeemed: boolean;
}

interface StoreContextType {
  rule: ShopRule;
  updateRule: (newRule: Partial<ShopRule>) => void;
  customer: CustomerData;
  loginCustomer: (identifier: string) => void;
  logoutCustomer: () => void;
  scanStamp: () => { success: boolean; message: string };
  submitReview: (rating: number, comment: string) => void;
  customers: CustomerRecord[];
  reviews: ReviewItem[];
  markRewardGiven: (id: string) => void;
  // Demo Controls
  skip12Hours: () => void;
  jumpToNearReward: () => void;
  resetNewUser: () => void;
  checkLockStatus: () => { isLocked: boolean; hoursRemaining: number; nextOpenTime: string };
}

const DEFAULT_RULE: ShopRule = {
  shopName: "Kesar Chai Corner",
  slug: "kesar-chai",
  minSpend: 100,
  visitsNeeded: 10,
  expiryDays: 40,
  rewardName: "Free Masala Chai",
};

const DEFAULT_CUSTOMER: CustomerData = {
  identifier: "9820012345",
  isLoggedIn: true,
  hasConsent: true,
  visits: 7,
  lastScanTimestamp: Date.now() - 14 * 60 * 60 * 1000, // 14 hours ago (available to scan)
  cycleStartTimestamp: Date.now() - 23 * 24 * 60 * 60 * 1000, // Day 23 of 40
  rewardTicket: null,
  hasReviewed: false,
  rating: 5,
  comment: "",
};

const INITIAL_REVIEWS: ReviewItem[] = [
  {
    id: "rev-1",
    customerMasked: "98***12",
    rating: 5,
    comment: "Best ginger tea in the area! The punch card is so easy, no app needed.",
    date: "Yesterday",
  },
  {
    id: "rev-2",
    customerMasked: "r***h@example.com",
    rating: 5,
    comment: "Almost at my 10th visit reward. Highly recommend!",
    date: "2 days ago",
  },
  {
    id: "rev-3",
    customerMasked: "97***89",
    rating: 4,
    comment: "Good service and quick checkout.",
    date: "4 days ago",
  },
];

const INITIAL_CUSTOMERS: CustomerRecord[] = [
  {
    id: "c-1",
    masked: "98***12",
    visits: 10,
    targetVisits: 10,
    lastVisit: "Today, 10:15 AM",
    status: "Reward ready",
    rewardRedeemed: false,
  },
  {
    id: "c-2",
    masked: "r***h@example.com",
    visits: 9,
    targetVisits: 10,
    lastVisit: "Yesterday, 6:30 PM",
    status: "Almost there",
    rewardRedeemed: false,
  },
  {
    id: "c-3",
    masked: "98***45",
    visits: 7,
    targetVisits: 10,
    lastVisit: "Today, 9:40 AM",
    status: "Collecting",
    rewardRedeemed: false,
  },
  {
    id: "c-4",
    masked: "a***t@gmail.com",
    visits: 4,
    targetVisits: 10,
    lastVisit: "2 days ago",
    status: "Collecting",
    rewardRedeemed: false,
  },
  {
    id: "c-5",
    masked: "91***90",
    visits: 10,
    targetVisits: 10,
    lastVisit: "3 days ago",
    status: "Reward ready",
    rewardRedeemed: true,
  },
];

const StoreContext = createContext<StoreContextType | null>(null);

const STORAGE_KEY = "stb_phase1_state_v1";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [rule, setRule] = useState<ShopRule>(DEFAULT_RULE);
  const [customer, setCustomer] = useState<CustomerData>(DEFAULT_CUSTOMER);
  const [customers, setCustomers] = useState<CustomerRecord[]>(INITIAL_CUSTOMERS);
  const [reviews, setReviews] = useState<ReviewItem[]>(INITIAL_REVIEWS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.rule) setRule(parsed.rule);
        if (parsed.customer) setCustomer(parsed.customer);
        if (parsed.customers) setCustomers(parsed.customers);
        if (parsed.reviews) setReviews(parsed.reviews);
      }
    } catch {
      // LocalStorage error or private mode fallback
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ rule, customer, customers, reviews })
      );
    } catch {
      // ignore storage quota errors
    }
  }, [rule, customer, customers, reviews, isLoaded]);

  // Anti-fraud check: 12-hour or midnight IST lock
  const checkLockStatus = () => {
    const now = Date.now();
    const TWELVE_HOURS = 12 * 60 * 60 * 1000;
    const timeSinceLastScan = now - customer.lastScanTimestamp;

    if (timeSinceLastScan < TWELVE_HOURS) {
      const msRemaining = TWELVE_HOURS - timeSinceLastScan;
      const hoursRemaining = Math.max(1, Math.ceil(msRemaining / (60 * 60 * 1000)));
      const unlockTime = new Date(customer.lastScanTimestamp + TWELVE_HOURS);
      const formattedTime = unlockTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      return { isLocked: true, hoursRemaining, nextOpenTime: formattedTime };
    }

    return { isLocked: false, hoursRemaining: 0, nextOpenTime: "Now" };
  };

  const updateRule = (newRule: Partial<ShopRule>) => {
    setRule((prev) => {
      const updated = { ...prev, ...newRule };
      // Also update customer records target visits if visitsNeeded changes
      if (newRule.visitsNeeded && newRule.visitsNeeded !== prev.visitsNeeded) {
        setCustomers((old) =>
          old.map((c) => ({
            ...c,
            targetVisits: updated.visitsNeeded,
            status:
              c.visits >= updated.visitsNeeded
                ? "Reward ready"
                : c.visits >= updated.visitsNeeded - 2
                ? "Almost there"
                : "Collecting",
          }))
        );
      }
      return updated;
    });
  };

  const loginCustomer = (identifier: string) => {
    setCustomer((prev) => ({
      ...prev,
      identifier,
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

  const scanStamp = () => {
    const lock = checkLockStatus();
    if (lock.isLocked) {
      return {
        success: false,
        message: `Already checked in today! Next stamp opens in ${lock.hoursRemaining} hours (${lock.nextOpenTime}).`,
      };
    }

    const nextVisits = customer.visits + 1;
    let ticket = customer.rewardTicket;

    if (nextVisits >= rule.visitsNeeded && !ticket) {
      // Generate unique reward ticket
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const pin = Math.floor(1000 + Math.random() * 9000).toString();
      const expiry = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      ticket = {
        code: `STB-7Q4K-${randomSuffix}`,
        pin,
        rewardName: rule.rewardName,
        expiryDate: expiry,
        isRedeemed: false,
      };
    }

    setCustomer((prev) => ({
      ...prev,
      visits: nextVisits,
      lastScanTimestamp: Date.now(),
      rewardTicket: ticket,
    }));

    // Update customer entry in store directory
    setCustomers((prev) => {
      const masked = customer.identifier.includes("@")
        ? customer.identifier.replace(/^(.{2})(.*)(@.*)$/, "$1***$3")
        : customer.identifier.replace(/^(\d{2})(\d+)(\d{2})$/, "$1***$3");

      const existingIndex = prev.findIndex((c) => c.masked === masked);
      const isTarget = nextVisits >= rule.visitsNeeded;
      const status = isTarget
        ? "Reward ready"
        : nextVisits >= rule.visitsNeeded - 2
        ? "Almost there"
        : "Collecting";

      const updatedRecord: CustomerRecord = {
        id: existingIndex >= 0 ? prev[existingIndex].id : `c-${Date.now()}`,
        masked,
        visits: nextVisits,
        targetVisits: rule.visitsNeeded,
        lastVisit: "Just now",
        status,
        rewardRedeemed: false,
      };

      if (existingIndex >= 0) {
        const copy = [...prev];
        copy[existingIndex] = updatedRecord;
        return copy;
      } else {
        return [updatedRecord, ...prev];
      }
    });

    return {
      success: true,
      message:
        nextVisits >= rule.visitsNeeded
          ? `🎉 Hurray! You've reached ${nextVisits} visits and unlocked your reward: ${rule.rewardName}!`
          : `Visit #${nextVisits} approved! Keep up your streak!`,
    };
  };

  const submitReview = (rating: number, comment: string) => {
    const masked = customer.identifier.includes("@")
      ? customer.identifier.replace(/^(.{2})(.*)(@.*)$/, "$1***$3")
      : customer.identifier.replace(/^(\d{2})(\d+)(\d{2})$/, "$1***$3");

    const newRev: ReviewItem = {
      id: `rev-${Date.now()}`,
      customerMasked: masked || "98***12",
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

  const markRewardGiven = (id: string) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, rewardRedeemed: true } : c))
    );
    // If the active customer matches this, also update their ticket
    if (customer.rewardTicket) {
      setCustomer((prev) => ({
        ...prev,
        rewardTicket: prev.rewardTicket
          ? { ...prev.rewardTicket, isRedeemed: true }
          : null,
      }));
    }
  };

  // Demo Controls
  const skip12Hours = () => {
    setCustomer((prev) => ({
      ...prev,
      lastScanTimestamp: Date.now() - 13 * 60 * 60 * 1000,
    }));
  };

  const jumpToNearReward = () => {
    const targetNear = Math.max(0, rule.visitsNeeded - 1);
    setCustomer((prev) => ({
      ...prev,
      visits: targetNear,
      lastScanTimestamp: Date.now() - 13 * 60 * 60 * 1000,
      rewardTicket: null,
    }));
  };

  const resetNewUser = () => {
    setCustomer({
      ...DEFAULT_CUSTOMER,
      identifier: "9876543210",
      visits: 0,
      lastScanTimestamp: 0,
      rewardTicket: null,
      hasReviewed: false,
      comment: "",
      rating: 5,
    });
  };

  return (
    <StoreContext.Provider
      value={{
        rule,
        updateRule,
        customer,
        loginCustomer,
        logoutCustomer,
        scanStamp,
        submitReview,
        customers,
        reviews,
        markRewardGiven,
        skip12Hours,
        jumpToNearReward,
        resetNewUser,
        checkLockStatus,
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
