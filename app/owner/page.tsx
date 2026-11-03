"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CounterQR from "@/components/CounterQR";
import ConfettiEffect from "@/components/ConfettiEffect";
import { useStore } from "@/context/StoreContext";
import { createClient } from "@/lib/supabase/client";
import { approveVisit, rejectVisit } from "@/app/actions/scan";
import { playApprovalBell } from "@/lib/audio";
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
} from "lucide-react";

interface QueueItem {
  id: string;
  customerMasked: string;
  amount: number;
  formattedTime: string;
  isDb?: boolean;
}

export default function OwnerPage() {
  const {
    rule,
    updateRule,
    pendingQueue,
    approveScan,
    rejectScan,
    verifyPin,
    customers,
    reviews,
    markRewardGiven,
  } = useStore();

  const [dbVisits, setDbVisits] = useState<QueueItem[]>([]);

  // Supabase Real-Time WebSocket Listener for pending scans
  useEffect(() => {
    const supabase = createClient();

    // 1. Initial fetch of active pending visits from PostgreSQL
    const fetchPendingVisits = async () => {
      try {
        const { data, error } = await supabase
          .from("visits")
          .select("id, created_at, status, customers(phone)")
          .eq("status", "PENDING")
          .order("created_at", { ascending: false });

        if (data && !error) {
          const items: QueueItem[] = data.map((v: any) => {
            const rawPhone = v.customers?.phone || "";
            const masked =
              rawPhone.length >= 10
                ? `${rawPhone.slice(0, 2)}••••••${rawPhone.slice(-2)}`
                : "Customer Check-in";
            return {
              id: v.id,
              customerMasked: masked,
              amount: rule.minSpend,
              formattedTime: "Just now",
              isDb: true,
            };
          });
          setDbVisits(items);
        }
      } catch (err) {
        console.warn("Could not fetch DB visits:", err);
      }
    };

    fetchPendingVisits();

    // 2. Real-time WebSocket channel for incoming customer scans
    const channel = supabase
      .channel("scans")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "visits",
          filter: "status=eq.PENDING",
        },
        async (payload) => {
          // Play the native Web Audio approval chime
          playApprovalBell();
          const v = payload.new;

          let masked = "Customer Check-in";
          if (v.customer_id) {
            const { data: cust } = await supabase
              .from("customers")
              .select("phone")
              .eq("id", v.customer_id)
              .maybeSingle();

            if (cust?.phone && cust.phone.length >= 10) {
              masked = `${cust.phone.slice(0, 2)}••••••${cust.phone.slice(-2)}`;
            }
          }

          const newItem: QueueItem = {
            id: v.id,
            customerMasked: masked,
            amount: rule.minSpend,
            formattedTime: "Just now",
            isDb: true,
          };

          setDbVisits((prev) => [newItem, ...prev.filter((item) => item.id !== newItem.id)]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "visits",
        },
        (payload) => {
          const v = payload.new;
          if (v.status !== "PENDING") {
            setDbVisits((prev) => prev.filter((item) => item.id !== v.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rule.minSpend]);

  const handleApproveScan = async (item: QueueItem) => {
    if (item.isDb) {
      setDbVisits((prev) => prev.filter((q) => q.id !== item.id));
      await approveVisit(item.id);
    } else {
      approveScan(item.id);
    }
  };

  const handleRejectScan = async (item: QueueItem) => {
    if (item.isDb) {
      setDbVisits((prev) => prev.filter((q) => q.id !== item.id));
      await rejectVisit(item.id);
    } else {
      rejectScan(item.id);
    }
  };

  const [shopNameInput, setShopNameInput] = useState(rule.name);
  const [minSpendInput, setMinSpendInput] = useState(rule.minSpend);
  const [visitsInput, setVisitsInput] = useState(rule.visitsRequired);
  const [expiryInput, setExpiryInput] = useState(rule.validityDays);
  const [rewardInput, setRewardInput] = useState(rule.rewardName);
  const [ruleSaveMessage, setRuleSaveMessage] = useState<string | null>(null);

  // Search filter for regulars
  const [searchQuery, setSearchQuery] = useState("");

  // PIN Redemption states
  const [pinInput, setPinInput] = useState("");
  const [pinFeedback, setPinFeedback] = useState<{ success: boolean; message: string } | null>(
    null
  );
  const [showConfetti, setShowConfetti] = useState(false);

  // Compute live KPIs
  const visitsToday = customers.filter(
    (c) => c.lastVisit.includes("Today") || c.lastVisit.includes("Just now")
  ).length;

  const closeToReward = customers.filter(
    (c) => c.visits >= rule.visitsRequired - 2 && c.visits < rule.visitsRequired
  ).length;

  const rewardsWaiting = customers.filter(
    (c) => c.visits >= rule.visitsRequired && !c.rewardRedeemed
  ).length;

  const avgRating =
    reviews.length > 0
      ? (
          reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length
        ).toFixed(1)
      : "5.0";

  const handleSaveRule = (e: React.FormEvent) => {
    e.preventDefault();
    updateRule({
      name: shopNameInput,
      minSpend: Number(minSpendInput),
      visitsRequired: Number(visitsInput),
      validityDays: Number(expiryInput),
      rewardName: rewardInput,
    });
    setRuleSaveMessage("✓ Rule updated instantly across all customer cards!");
    setTimeout(() => setRuleSaveMessage(null), 3000);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput || pinInput.length !== 4) return;
    const res = verifyPin(pinInput);
    setPinFeedback(res);
    if (res.success) {
      setShowConfetti(true);
      setPinInput("");
    }
  };

  const localPending: QueueItem[] = pendingQueue
    .filter((q) => q.status === "pending")
    .map((q) => ({
      id: q.id,
      customerMasked: q.customerMasked,
      amount: q.amount,
      formattedTime: q.formattedTime,
      isDb: false,
    }));

  const allPending = [
    ...dbVisits,
    ...localPending.filter((lp) => !dbVisits.some((dv) => dv.id === lp.id)),
  ];

  const filteredCustomers = customers.filter((c) =>
    c.masked.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                SHOP OWNER TERMINAL
              </div>
              <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-secondary sm:text-4xl">
                {rule.name}
              </h1>
              <p className="mt-1 text-sm text-ink/75">
                Live counter telemetry, customer streak progress &amp; reward redemptions.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-bold text-success shadow-sm border border-border">
                <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                Terminal Online &amp; Listening
              </span>
            </div>
          </div>

          {/* 1. REAL-TIME KPI STRIP (4 METRIC TILES) */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* KPI 1 */}
            <div className="rounded-3xl border border-border bg-white p-6 shadow-card">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-ink/50">
                  Visits Today
                </p>
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-sand text-secondary">
                  <Clock className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-4 font-display text-4xl font-extrabold text-secondary">
                {visitsToday}
              </p>
              <p className="mt-1 text-xs text-ink/65">+22% repeat rate</p>
            </div>

            {/* KPI 2 */}
            <div className="rounded-3xl border border-border bg-white p-6 shadow-card">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-ink/50">
                  Close to Reward
                </p>
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-sand text-secondary">
                  <Users className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-4 font-display text-4xl font-extrabold text-secondary">
                {closeToReward}
              </p>
              <p className="mt-1 text-xs text-ink/65">&gt;= {rule.visitsRequired - 2} visits logged</p>
            </div>

            {/* KPI 3 (Highlighted in gold/coral) */}
            <div className="rounded-3xl border-2 border-primary bg-coral/10 p-6 shadow-card">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-primary">
                  Rewards Waiting
                </p>
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-white shadow-sm">
                  <Gift className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-4 font-display text-4xl font-extrabold text-primary">
                {rewardsWaiting}
              </p>
              <p className="mt-1 font-semibold text-xs text-ink/70">
                Ready for counter claim
              </p>
            </div>

            {/* KPI 4 */}
            <div className="rounded-3xl border border-border bg-white p-6 shadow-card">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-ink/50">
                  Average Rating
                </p>
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-warning/20 text-warning">
                  <Star className="h-5 w-5 fill-warning" />
                </span>
              </div>
              <p className="mt-4 font-display text-4xl font-extrabold text-secondary">
                {avgRating} <span className="text-xl text-ink/40">/ 5.0</span>
              </p>
              <p className="mt-1 text-xs text-ink/65">Based on {reviews.length} verified reviews</p>
            </div>
          </div>

          {/* 2. LIVE PENDING QUEUE & PIN REDEMPTION (TWO-COLUMN SECTION) */}
          <div className="mt-8 grid gap-8 lg:grid-cols-12">
            {/* LIVE PENDING QUEUE (7 cols) */}
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
                      Real-time approval stream from customer camera scans.
                    </p>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold rounded-full bg-primary px-3 py-1 text-white">
                  {allPending.length} Pending
                </span>
              </div>

              <div className="mt-6 space-y-3">
                {allPending.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/20 p-8 text-center text-white/75">
                    <p className="font-semibold text-sm">No pending scans right now. Waiting for customers...</p>
                    <p className="mt-1 text-xs text-white/55">
                      When a customer scans your counter QR stand, their 1-tap check-in will appear here with an audio chime.
                    </p>
                  </div>
                ) : (
                  allPending.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-white p-4 text-ink shadow-sm animate-stamp-pop"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-base font-extrabold text-secondary">
                            {item.customerMasked}
                          </span>
                          <span className="rounded bg-sand px-2 py-0.5 font-mono text-xs font-bold text-ink/75">
                            Bill ₹{item.amount}
                          </span>
                          {item.isDb && (
                            <span className="rounded bg-emerald-100 text-emerald-800 px-2 py-0.5 font-mono text-[10px] font-bold">
                              Live Scan
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-ink/50">
                          {item.formattedTime} • Counter Scan
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleApproveScan(item)}
                          className="flex min-h-[48px] items-center gap-1.5 rounded-xl bg-success px-5 text-xs font-bold text-white shadow-sm transition hover:opacity-90"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          1-Tap Approve
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRejectScan(item)}
                          className="flex min-h-[48px] items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-4 text-xs font-bold text-primary transition hover:bg-primary hover:text-white"
                        >
                          <XCircle className="h-4 w-4" />
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* PIN REDEMPTION BOX (5 cols) */}
            <div className="rounded-[2.2rem] border border-border bg-white p-6 shadow-card sm:p-8 lg:col-span-5">
              <div className="flex items-center gap-2.5 border-b border-border/70 pb-4">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-sand text-secondary">
                  <KeyRound className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-display text-xl font-extrabold text-secondary">
                    Voucher PIN Redemption
                  </h2>
                  <p className="text-xs text-ink/65">
                    Verify customer&apos;s 4-digit code to give reward.
                  </p>
                </div>
              </div>

              <form onSubmit={handlePinSubmit} className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="pin"
                    className="block text-xs font-bold uppercase tracking-wider text-ink/70"
                  >
                    Enter Customer 4-Digit PIN
                  </label>
                  <input
                    id="pin"
                    type="text"
                    maxLength={4}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="e.g. 8492"
                    className="mt-2 w-full text-center font-mono text-3xl font-extrabold tracking-widest rounded-xl border border-border p-3 text-secondary focus:border-primary focus:outline-none"
                  />
                  <p className="mt-1 text-center font-mono text-[11px] text-ink/50">
                    Try demo PIN: 8492
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={pinInput.length !== 4}
                  className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white shadow-sm transition hover:bg-secondary disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Verify &amp; Redeem Reward
                </button>

                {pinFeedback && (
                  <div
                    className={`rounded-xl p-3 text-center text-xs font-bold ${
                      pinFeedback.success
                        ? "bg-success/15 text-success"
                        : "bg-primary/15 text-primary"
                    }`}
                  >
                    {pinFeedback.message}
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* TWO COLUMN GRID: RULE SETUP & COUNTER QR */}
          <div className="mt-10 grid gap-8 lg:grid-cols-12">
            {/* RULE CUSTOMIZATION FORM (5 cols) */}
            <div className="rounded-[2.2rem] border border-border bg-white p-6 shadow-card sm:p-8 lg:col-span-5">
              <div className="flex items-center gap-2 border-b border-border/70 pb-4">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-sand text-secondary">
                  <Sliders className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-display text-xl font-extrabold text-secondary">
                    Card Rule Setup
                  </h2>
                  <p className="text-xs text-ink/65">
                    Changes apply immediately to all customer cards.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveRule} className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="shopName"
                    className="block text-xs font-bold uppercase tracking-wider text-ink/70"
                  >
                    Shop Counter Name
                  </label>
                  <input
                    id="shopName"
                    type="text"
                    value={shopNameInput}
                    onChange={(e) => setShopNameInput(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-border p-3 text-sm font-bold text-ink focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="minSpend"
                      className="block text-xs font-bold uppercase tracking-wider text-ink/70"
                    >
                      Min Spend (₹)
                    </label>
                    <select
                      id="minSpend"
                      value={minSpendInput}
                      onChange={(e) => setMinSpendInput(Number(e.target.value))}
                      className="mt-1.5 w-full rounded-xl border border-border p-3 text-sm font-semibold text-ink bg-white focus:border-primary focus:outline-none"
                    >
                      <option value={100}>₹100</option>
                      <option value={150}>₹150</option>
                      <option value={200}>₹200</option>
                      <option value={300}>₹300</option>
                      <option value={500}>₹500</option>
                      <option value={3000}>₹3000 (Kirana)</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="visitsInput"
                      className="block text-xs font-bold uppercase tracking-wider text-ink/70"
                    >
                      Visits Needed
                    </label>
                    <select
                      id="visitsInput"
                      value={visitsInput}
                      onChange={(e) => setVisitsInput(Number(e.target.value))}
                      className="mt-1.5 w-full rounded-xl border border-border p-3 text-sm font-semibold text-ink bg-white focus:border-primary focus:outline-none"
                    >
                      <option value={7}>7 Visits</option>
                      <option value={10}>10 Visits</option>
                      <option value={15}>15 Visits</option>
                      <option value={20}>20 Visits</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="expiryDays"
                      className="block text-xs font-bold uppercase tracking-wider text-ink/70"
                    >
                      Card Validity
                    </label>
                    <select
                      id="expiryDays"
                      value={expiryInput}
                      onChange={(e) => setExpiryInput(Number(e.target.value))}
                      className="mt-1.5 w-full rounded-xl border border-border p-3 text-sm font-semibold text-ink bg-white focus:border-primary focus:outline-none"
                    >
                      <option value={30}>30 Days</option>
                      <option value={40}>40 Days</option>
                      <option value={50}>50 Days</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="rewardName"
                      className="block text-xs font-bold uppercase tracking-wider text-ink/70"
                    >
                      Reward Description
                    </label>
                    <input
                      id="rewardName"
                      type="text"
                      value={rewardInput}
                      onChange={(e) => setRewardInput(e.target.value)}
                      placeholder="e.g. Free Masala Chai"
                      className="mt-1.5 w-full rounded-xl border border-border p-3 text-sm font-semibold text-ink focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-secondary text-sm font-bold text-white transition hover:bg-primary shadow-sm"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Save &amp; Update Customer Cards
                </button>

                {ruleSaveMessage && (
                  <p className="mt-2 text-center text-xs font-bold text-success">
                    {ruleSaveMessage}
                  </p>
                )}
              </form>
            </div>

            {/* COUNTER QR CODE GENERATOR (7 cols) */}
            <div className="rounded-[2.2rem] border border-border bg-white p-6 shadow-card sm:p-8 lg:col-span-7">
              <div className="flex items-center gap-2 border-b border-border/70 pb-4">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-sand text-secondary">
                  <QrCode className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-display text-xl font-extrabold text-secondary">
                    Your Counter QR Stand
                  </h2>
                  <p className="text-xs text-ink/65">
                    Print once and place at your cash billing counter.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <CounterQR
                  name={rule.name}
                  slug={rule.slug}
                  minSpend={rule.minSpend}
                  visitsRequired={rule.visitsRequired}
                  rewardName={rule.rewardName}
                />
              </div>
            </div>
          </div>

          {/* 3. SEARCHABLE CUSTOMER REGULARS DIRECTORY */}
          <div className="mt-10 rounded-[2.2rem] border border-border bg-white p-6 shadow-card sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/70 pb-4">
              <div>
                <h2 className="font-display text-xl font-extrabold text-secondary">
                  Customer Regulars Directory
                </h2>
                <p className="text-xs text-ink/65">
                  Masked under India&apos;s DPDP Act to ensure customer data protection.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search masked number..."
                  className="w-full rounded-full border border-border py-2 pl-9 pr-4 text-xs font-semibold text-ink placeholder:text-ink/40 focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left text-sm text-ink">
                <thead>
                  <tr className="border-b border-border/80 text-[11px] font-bold uppercase tracking-wider text-ink/50">
                    <th className="pb-3">Customer ID</th>
                    <th className="pb-3">Last Visit</th>
                    <th className="pb-3">Progress</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Counter Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredCustomers.map((c) => {
                    const isRewardReady = c.visits >= c.targetVisits && !c.rewardRedeemed;
                    return (
                      <tr key={c.id} className="transition hover:bg-sand/30">
                        <td className="py-4 font-mono font-bold text-secondary">
                          {c.masked}
                        </td>
                        <td className="py-4 text-xs text-ink/75">
                          {c.lastVisit}
                        </td>
                        <td className="py-4">
                          <div className="w-36">
                            <div className="flex justify-between text-[11px] font-mono font-bold text-ink/70">
                              <span>{c.visits}/{c.targetVisits}</span>
                              <span>{Math.round((c.visits / c.targetVisits) * 100)}%</span>
                            </div>
                            <div className="mt-1 h-2 rounded-full bg-sand">
                              <div
                                className="h-full rounded-full bg-primary"
                                style={{
                                  width: `${Math.min(100, (c.visits / c.targetVisits) * 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          {c.rewardRedeemed ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1 font-mono text-[11px] font-bold text-ink/60">
                              Claimed
                            </span>
                          ) : isRewardReady ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-coral/15 px-2.5 py-1 font-mono text-[11px] font-bold text-primary animate-pulse">
                              <Sparkles className="h-3 w-3" />
                              Reward Ready
                            </span>
                          ) : c.status === "Almost there" ? (
                            <span className="inline-flex items-center rounded-full bg-warning/15 px-2.5 py-1 font-mono text-[11px] font-bold text-warning">
                              Almost there
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-sand px-2.5 py-1 font-mono text-[11px] font-semibold text-ink/60">
                              Collecting
                            </span>
                          )}
                        </td>
                        <td className="py-4 text-right">
                          {isRewardReady ? (
                            <button
                              type="button"
                              onClick={() => markRewardGiven(c.id)}
                              className="inline-flex min-h-[40px] items-center rounded-xl bg-primary px-3.5 text-xs font-bold text-white transition hover:bg-secondary shadow-sm"
                            >
                              Mark Reward Given
                            </button>
                          ) : c.rewardRedeemed ? (
                            <span className="text-xs font-medium text-success">
                              ✓ Given
                            </span>
                          ) : (
                            <span className="text-xs font-mono text-ink/40">
                              In Progress
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. VERIFIED RATINGS FEED */}
          <div className="mt-10 rounded-[2.2rem] border border-border bg-white p-6 shadow-card sm:p-8">
            <div className="flex items-center justify-between border-b border-border/70 pb-4">
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-warning/15 text-warning">
                  <Award className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-display text-xl font-extrabold text-secondary">
                    Verified Customer Feedback
                  </h2>
                  <p className="text-xs text-ink/65">
                    Real reviews submitted only by customers who visited your counter.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="rounded-2xl border border-border/80 bg-sand/30 p-5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-secondary">
                      {rev.customerMasked}
                    </span>
                    <span className="text-[11px] text-ink/50">{rev.date}</span>
                  </div>

                  <div className="mt-2 flex items-center gap-1 text-warning">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < rev.rating
                            ? "fill-warning text-warning"
                            : "text-border"
                        }`}
                      />
                    ))}
                  </div>

                  <p className="mt-3 text-xs leading-relaxed text-ink/80 italic">
                    &ldquo;{rev.comment}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
