"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CounterQR from "@/components/CounterQR";
import ConfettiEffect from "@/components/ConfettiEffect";
import { createClient } from "@/lib/supabase/client";
import {
  approveVisit,
  rejectVisit,
  verifyRedemptionPin,
  getPendingVisits,
  getMerchantLedger,
} from "@/app/actions/scan";
import { getOwnerMerchant, updateMerchantRuleAction } from "@/app/actions/merchant";
import { playApprovalBell, playScanChime } from "@/lib/audio";
import {
  Store,
  Users,
  Gift,
  Star,
  QrCode,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Sliders,
  Award,
  Search,
  KeyRound,
  BellRing,
  Printer,
  History,
  ShieldCheck,
  RefreshCw,
  LogOut,
  ArrowRight,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface LivePendingScan {
  id: string;
  customerName: string;
  customerMasked: string;
  rawPhone: string;
  amount: number;
  formattedTime: string;
  status: string;
}

interface LedgerRecord {
  id: string;
  customerName: string;
  contactMasked: string;
  visitDate: string;
  billAmount: number;
  status: string;
  createdAt: string;
}

export default function OwnerDashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [merchant, setMerchant] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form Rule inputs
  const [shopNameInput, setShopNameInput] = useState("");
  const [minSpendInput, setMinSpendInput] = useState(100);
  const [visitsInput, setVisitsInput] = useState(10);
  const [rewardInput, setRewardInput] = useState("Free Masala Chai");
  const [validityInput, setValidityInput] = useState(45);
  const [ruleSaveMessage, setRuleSaveMessage] = useState<string | null>(null);

  // Live WebSocket Queue
  const [pendingQueue, setPendingQueue] = useState<LivePendingScan[]>([]);
  const [ledger, setLedger] = useState<LedgerRecord[]>([]);

  // 4-Digit Voucher PIN Verification
  const [pinInput, setPinInput] = useState("");
  const [pinCustomerPhone, setPinCustomerPhone] = useState("");
  const [pinFeedback, setPinFeedback] = useState<{ success: boolean; message: string } | null>(
    null
  );
  const [showConfetti, setShowConfetti] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);

  // 1. Initial Load of Merchant and Historical Ledger
  useEffect(() => {
    async function init() {
      try {
        const { merchant: m } = await getOwnerMerchant();
        if (m) {
          setMerchant(m);
          setShopNameInput(m.name);
          setMinSpendInput(Number(m.min_spend) || 100);
          setVisitsInput(Number(m.visits_required) || 10);
          setRewardInput(m.reward_name);
          setValidityInput(Number(m.validity_days) || 45);

          // Fetch pending visits
          const { visits: pending } = await getPendingVisits(m.id);
          const initialQueue: LivePendingScan[] = (pending || []).map((v: any) => {
            const rawPhone = v.customers?.phone || "";
            const masked =
              rawPhone.length >= 10
                ? `+91 ${rawPhone.slice(0, 2)}*** **${rawPhone.slice(-2)}`
                : "Customer Check-in";
            return {
              id: v.id,
              customerName: v.customers?.full_name || "Diner / Shopper",
              customerMasked: masked,
              rawPhone,
              amount: Number(v.bill_amount) || m.min_spend,
              formattedTime: "Just now",
              status: v.status,
            };
          });
          setPendingQueue(initialQueue);

          // Fetch ledger
          const { visits: leg } = await getMerchantLedger(m.id);
          const initialLedger: LedgerRecord[] = (leg || []).map((v: any) => {
            const raw = v.customers?.phone || "";
            const msk =
              raw.length >= 10
                ? `+91 ${raw.slice(0, 2)}*** **${raw.slice(-2)}`
                : "Walk-in";
            return {
              id: v.id,
              customerName: v.customers?.full_name || "Customer",
              contactMasked: msk,
              visitDate: v.visit_date_ist,
              billAmount: Number(v.bill_amount) || m.min_spend,
              status: v.status,
              createdAt: v.created_at,
            };
          });
          setLedger(initialLedger);
        }
      } catch (err) {
        console.error("Dashboard init error:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // 2. Realtime WebSocket Subscription to 'visits'
  useEffect(() => {
    if (!merchant?.id) return;

    const channel = supabase
      .channel("merchant-scans")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "visits",
          filter: `merchant_id=eq.${merchant.id}`,
        },
        async (payload) => {
          const v = payload.new;
          if (v.status === "PENDING") {
            // Play two-tone counter bell (523Hz + 659Hz)
            playApprovalBell();

            // Resolve customer phone
            let rawPhone = "";
            let custName = "Customer Check-in";
            if (v.customer_id) {
              const { data: cust } = await supabase
                .from("customers")
                .select("phone, full_name")
                .eq("id", v.customer_id)
                .maybeSingle();

              if (cust) {
                rawPhone = cust.phone || "";
                custName = cust.full_name || "Customer Check-in";
              }
            }

            const masked =
              rawPhone.length >= 10
                ? `+91 ${rawPhone.slice(0, 2)}*** **${rawPhone.slice(-2)}`
                : "Customer Check-in";

            const newScan: LivePendingScan = {
              id: v.id,
              customerName: custName,
              customerMasked: masked,
              rawPhone,
              amount: Number(v.bill_amount) || merchant.min_spend,
              formattedTime: "Just now",
              status: "PENDING",
            };

            setPendingQueue((prev) => [newScan, ...prev.filter((q) => q.id !== newScan.id)]);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "visits",
          filter: `merchant_id=eq.${merchant.id}`,
        },
        (payload) => {
          const updated = payload.new;
          if (updated.status !== "PENDING") {
            setPendingQueue((prev) => prev.filter((q) => q.id !== updated.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [merchant?.id, merchant?.min_spend, supabase]);

  // 1-Tap Actions
  const handleApprove = async (scanId: string) => {
    setPendingQueue((prev) => prev.filter((q) => q.id !== scanId));
    playApprovalBell();
    await approveVisit(scanId);

    // Refresh ledger
    if (merchant?.id) {
      const { visits: leg } = await getMerchantLedger(merchant.id);
      if (leg) {
        setLedger(
          leg.map((v: any) => ({
            id: v.id,
            customerName: v.customers?.full_name || "Customer",
            contactMasked: v.customers?.phone ? `+91 ${v.customers.phone.slice(0, 2)}***` : "Walk-in",
            visitDate: v.visit_date_ist,
            billAmount: Number(v.bill_amount) || merchant.min_spend,
            status: v.status,
            createdAt: v.created_at,
          }))
        );
      }
    }
  };

  const handleReject = async (scanId: string) => {
    setPendingQueue((prev) => prev.filter((q) => q.id !== scanId));
    await rejectVisit(scanId);
  };

  // Rule Update
  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchant?.id) return;

    setRuleSaveMessage(null);
    const res = await updateMerchantRuleAction({
      merchantId: merchant.id,
      name: shopNameInput,
      minSpend: Number(minSpendInput),
      visitsRequired: Number(visitsInput),
      rewardName: rewardInput,
      validityDays: Number(validityInput),
    });

    if (res.success) {
      setMerchant(res.merchant);
      setRuleSaveMessage("✓ Streak rules updated instantly across all customer passes!");
      setTimeout(() => setRuleSaveMessage(null), 3500);
    }
  };

  // PIN Redemption
  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchant?.id || !pinInput) return;

    const res = await verifyRedemptionPin(merchant.id, pinInput, pinCustomerPhone);
    setPinFeedback(res);

    if (res.success) {
      setShowConfetti(true);
      setPinInput("");
      setPinCustomerPhone("");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/owner/login");
  };

  const scanUrl = `https://stickthebizz.in/s/${merchant?.slug || "kesar-chai"}`;

  return (
    <div className="flex min-h-screen flex-col bg-sand overflow-x-hidden">
      <ConfettiEffect active={showConfetti} onComplete={() => setShowConfetti(false)} />
      <Navbar />

      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Top Title Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-secondary/10 px-3 py-1 font-mono text-xs font-bold text-secondary">
                <Store className="h-3.5 w-3.5 text-primary" />
                SHOP OWNER CASHIER TERMINAL
              </div>
              <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-secondary sm:text-4xl">
                {merchant?.name || "Kesar Chai Corner"}
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-ink/75">
                Live counter queue, custom streak rule studio &amp; acrylic standee artwork.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-bold text-success shadow-sm border border-border">
                <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                Terminal Online &amp; Listening
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3.5 py-2 text-xs font-bold text-ink/65 hover:text-secondary shadow-sm"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>

          {/* TWO-COLUMN LAYOUT: LIVE QUEUE (Left 7 cols) & PIN REDEMPTION (Right 5 cols) */}
          <div className="mt-8 grid gap-8 lg:grid-cols-12">
            {/* 1. LIVE PENDING CHECK-IN STREAM */}
            <div className="rounded-[2.2rem] border-2 border-secondary bg-secondary p-6 text-white shadow-card sm:p-8 lg:col-span-7">
              <div className="flex items-center justify-between border-b border-white/15 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-primary">
                    <BellRing className="h-5 w-5 animate-bell-ring" />
                  </span>
                  <div>
                    <h2 className="font-display text-xl font-extrabold text-white">
                      Live Customer Check-In Queue
                    </h2>
                    <p className="text-xs text-white/70">
                      Real-time audio chime stream from counter QR scans.
                    </p>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold rounded-full bg-primary px-3 py-1 text-white">
                  {pendingQueue.length} Pending
                </span>
              </div>

              {/* Approval Cards Stream */}
              <div className="mt-6 space-y-3">
                {pendingQueue.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/20 p-8 text-center text-white/75">
                    <p className="font-semibold text-sm">
                      No pending scans right now. Waiting for customers...
                    </p>
                    <p className="mt-1 text-xs text-white/55">
                      When a customer scans your counter QR stand, their 1-tap check-in will ding here with a two-tone bell chime.
                    </p>
                  </div>
                ) : (
                  pendingQueue.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-white p-4 text-ink shadow-sm animate-stamp-pop"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display text-sm font-extrabold text-secondary">
                            {item.customerName}
                          </span>
                          <span className="font-mono text-xs font-semibold text-ink/60">
                            {item.customerMasked}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="rounded bg-sand px-2 py-0.5 font-mono text-xs font-bold text-ink/80">
                            Bill ₹{item.amount}
                          </span>
                          <span className="text-[11px] text-ink/50">
                            {item.formattedTime} • Counter Camera Scan
                          </span>
                        </div>
                      </div>

                      {/* Large (min 48px height) Touch Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleApprove(item.id)}
                          className="flex min-h-[48px] items-center gap-1.5 rounded-xl bg-success px-5 text-xs font-bold text-white shadow-sm transition hover:opacity-90 active:scale-95"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          <span>1-Tap Approve</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleReject(item.id)}
                          className="flex min-h-[48px] items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-4 text-xs font-bold text-primary transition hover:bg-primary hover:text-white active:scale-95"
                        >
                          <XCircle className="h-4 w-4" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 2. PIN REDEMPTION TERMINAL */}
            <div className="rounded-[2.2rem] border border-border bg-white p-6 shadow-card sm:p-8 lg:col-span-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 border-b border-border/70 pb-4">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-sand text-secondary">
                    <KeyRound className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="font-display text-xl font-extrabold text-secondary">
                      Voucher PIN Redemption
                    </h2>
                    <p className="text-xs text-ink/65">
                      Verify customer&apos;s 4-digit code to release reward.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleVerifyPin} className="mt-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                      Enter Customer 4-Digit Voucher PIN
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
                      placeholder="e.g. 8492"
                      className="mt-2 w-full text-center font-mono text-3xl font-extrabold tracking-widest rounded-xl border border-border p-3 text-secondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                    />
                    <p className="mt-1 text-center font-mono text-[11px] text-ink/50">
                      Store Verification PIN: {merchant?.redemption_pin || "8492"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                      Customer Phone (Optional for ledger clearance)
                    </label>
                    <input
                      type="tel"
                      value={pinCustomerPhone}
                      onChange={(e) => setPinCustomerPhone(e.target.value)}
                      placeholder="e.g. 9820012345"
                      className="mt-1.5 w-full rounded-xl border border-border p-2.5 text-xs font-mono font-semibold text-secondary focus:border-primary focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary text-xs font-bold text-white shadow-sm transition hover:bg-primary/90 active:scale-95"
                  >
                    <Gift className="h-4 w-4" />
                    <span>Validate PIN &amp; Mark Redeemed</span>
                  </button>
                </form>

                {pinFeedback && (
                  <div
                    className={`mt-4 rounded-xl p-3.5 text-xs font-bold text-center border ${
                      pinFeedback.success
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                        : "bg-coral/10 text-primary border-primary/30"
                    }`}
                  >
                    {pinFeedback.message}
                  </div>
                )}
              </div>

              <div className="mt-6 rounded-2xl bg-sand/60 p-4 border border-border/80">
                <span className="text-[11px] font-bold text-secondary flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Anti-Theft Protocol Active
                </span>
                <p className="mt-1 text-[11px] text-ink/65 leading-relaxed">
                  Only give rewards when the screen shows &ldquo;Voucher Verified&rdquo;. Prevents unauthorized claims.
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 2: COUNTER QR ARTWORK STUDIO & STREAK CONFIGURATION */}
          <div className="mt-10 grid gap-8 lg:grid-cols-12 items-start">
            {/* STANDEE QR CODE STUDIO (Left 5 cols) */}
            <div className="rounded-[2.5rem] border border-border bg-white p-6 sm:p-8 shadow-card lg:col-span-5">
              <div className="flex items-center justify-between border-b border-border/70 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-sand text-secondary">
                    <QrCode className="h-5 w-5 text-primary" />
                  </span>
                  <div>
                    <h2 className="font-display text-xl font-extrabold text-secondary">
                      Counter QR Standee
                    </h2>
                    <p className="text-xs text-ink/65">
                      Printable 5x7 acrylic standee artwork.
                    </p>
                  </div>
                </div>
              </div>

              {/* Live Standee Preview */}
              <div className="mt-6 flex flex-col items-center">
                <CounterQR
                  shopName={merchant?.name || shopNameInput}
                  slug={merchant?.slug || "kesar-chai"}
                  minSpend={Number(minSpendInput)}
                  visitsRequired={Number(visitsInput)}
                  rewardName={rewardInput}
                />

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-secondary px-6 text-sm font-bold text-white shadow-card transition hover:bg-primary"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Acrylic Counter Standee (5x7)</span>
                </button>
              </div>
            </div>

            {/* STREAK RULE CONFIGURATION STUDIO (Right 7 cols) */}
            <div className="rounded-[2.5rem] border border-border bg-white p-6 sm:p-8 shadow-card lg:col-span-7">
              <div className="flex items-center gap-2.5 border-b border-border/70 pb-4">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-sand text-secondary">
                  <Sliders className="h-5 w-5 text-primary" />
                </span>
                <div>
                  <h2 className="font-display text-xl font-extrabold text-secondary">
                    Streak Rule Configuration
                  </h2>
                  <p className="text-xs text-ink/65">
                    Customize your spend thresholds and reward rules.
                  </p>
                </div>
              </div>

              {ruleSaveMessage && (
                <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-300 p-3 text-xs font-bold text-emerald-800 text-center">
                  {ruleSaveMessage}
                </div>
              )}

              <form onSubmit={handleSaveRule} className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                    Store Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={shopNameInput}
                    onChange={(e) => setShopNameInput(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-border p-3 text-sm font-semibold text-secondary focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                      Minimum Bill per Scan (₹)
                    </label>
                    <input
                      type="number"
                      required
                      min={10}
                      value={minSpendInput}
                      onChange={(e) => setMinSpendInput(Number(e.target.value))}
                      className="mt-1.5 w-full rounded-xl border border-border p-3 font-mono text-sm font-semibold text-secondary focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                      Visits Needed for Reward
                    </label>
                    <input
                      type="number"
                      required
                      min={3}
                      max={30}
                      value={visitsInput}
                      onChange={(e) => setVisitsInput(Number(e.target.value))}
                      className="mt-1.5 w-full rounded-xl border border-border p-3 font-mono text-sm font-semibold text-secondary focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                    Customer Reward Description
                  </label>
                  <input
                    type="text"
                    required
                    value={rewardInput}
                    onChange={(e) => setRewardInput(e.target.value)}
                    placeholder="e.g. Free 1L Mustard Oil Pouch"
                    className="mt-1.5 w-full rounded-xl border border-border p-3 text-sm font-semibold text-secondary focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                    Streak Expiry Period (Days)
                  </label>
                  <input
                    type="number"
                    min={15}
                    max={180}
                    value={validityInput}
                    onChange={(e) => setValidityInput(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-xl border border-border p-3 font-mono text-sm font-semibold text-secondary focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-white shadow-sm transition hover:bg-primary/90"
                  >
                    <span>Save &amp; Update Customer Passes</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* SECTION 3: VISIT HISTORY & ANALYTICS LEDGER */}
          <div className="mt-12">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl font-extrabold text-secondary">
                  Customer Visit Ledger
                </h2>
                <p className="text-xs text-ink/65">
                  Verified check-in timestamps, customer contacts &amp; audit history.
                </p>
              </div>
              <span className="font-mono text-xs font-bold rounded-full bg-white px-3 py-1 text-secondary border border-border">
                {ledger.length} Recent Scans
              </span>
            </div>

            <div className="mt-6 rounded-3xl border border-border bg-white overflow-hidden shadow-card">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-ink/80">
                  <thead className="border-b border-border bg-sand/40 text-[11px] font-bold uppercase tracking-wider text-secondary">
                    <tr>
                      <th className="px-6 py-4">Customer Name</th>
                      <th className="px-6 py-4">Masked Contact</th>
                      <th className="px-6 py-4">Date (IST)</th>
                      <th className="px-6 py-4">Bill Amount</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 font-semibold">
                    {ledger.length > 0 ? (
                      ledger.map((row) => (
                        <tr key={row.id} className="hover:bg-sand/20 transition-colors">
                          <td className="px-6 py-4 font-display font-bold text-secondary">
                            {row.customerName}
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-ink/70">
                            {row.contactMasked}
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-ink/70">
                            {row.visitDate}
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-secondary">
                            ₹{row.billAmount}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-xs font-bold ${
                                row.status === "APPROVED"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : row.status === "REDEEMED"
                                  ? "bg-secondary text-white"
                                  : row.status === "PENDING"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-coral/15 text-primary"
                              }`}
                            >
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-xs text-ink/50">
                          No customer scans recorded yet today. Customers will appear here when they scan your standee!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
