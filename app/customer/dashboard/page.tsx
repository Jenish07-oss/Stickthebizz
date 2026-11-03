"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  getCustomerWalletAction,
  CustomerWalletData,
  CustomerStorePass,
} from "@/app/actions/customer";
import {
  ChaiCupIcon,
  BasketIcon,
  StreakIcon,
  StarStampIcon,
  GiftBoxIcon,
  AntiFraudIcon,
} from "@/components/BrandIcons";
import {
  Sparkles,
  Store,
  Clock,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  History,
  QrCode,
  LogOut,
  Calendar,
  Lock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import CameraQRScanner from "@/components/CameraQRScanner";

export default function CustomerDashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [walletData, setWalletData] = useState<CustomerWalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [scannerOpen, setScannerOpen] = useState(false);

  useEffect(() => {
    async function loadWallet() {
      try {
        const localPhone = typeof window !== "undefined" ? localStorage.getItem("stb_customer_phone") : null;
        const data = await getCustomerWalletAction(localPhone || undefined);
        setWalletData(data);
      } catch (err) {
        console.error("Failed to load customer wallet:", err);
      } finally {
        setLoading(false);
      }
    }
    loadWallet();
  }, []);

  const handleSignOut = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("stb_customer_phone");
      localStorage.removeItem("stb_customer_name");
    }
    await supabase.auth.signOut();
    router.push("/auth/customer/login");
  };

  const getCategoryIcon = (category: string) => {
    const lower = (category || "").toLowerCase();
    if (lower.includes("chai") || lower.includes("cafe")) return <ChaiCupIcon size={24} />;
    if (lower.includes("kirana") || lower.includes("grocery")) return <BasketIcon size={24} />;
    return <StreakIcon size={24} />;
  };

  return (
    <div className="flex min-h-screen flex-col bg-sand overflow-x-hidden">
      <Navbar />

      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {/* Header Profile Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl bg-white p-6 sm:p-8 border border-border shadow-card">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-sand px-3 py-1 font-mono text-xs font-bold text-secondary">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                CUSTOMER MULTI-STORE WALLET
              </div>
              <h1 className="mt-2 font-display text-2xl sm:text-3xl font-extrabold text-secondary">
                {walletData?.customer?.fullName || "My Digital Passes"}
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-ink/70">
                Connected Mobile / Email:{" "}
                <span className="font-mono font-bold text-secondary">
                  {walletData?.customer?.phone ? `+91 ${walletData.customer.phone}` : (walletData?.customer?.email || "Registered Regular")}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setScannerOpen(true)}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm transition hover:bg-primary/90"
              >
                <QrCode className="h-4 w-4" />
                <span>📷 Scan Counter QR</span>
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2.5 text-xs font-bold text-ink/65 hover:text-secondary"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>

          <CameraQRScanner isOpen={scannerOpen} onClose={() => setScannerOpen(false)} />

          {/* Active Passes Section */}
          <div className="mt-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-extrabold text-secondary">
                  My Active Store Passes
                </h2>
                <p className="text-xs text-ink/65">
                  Tap any store card to open your full Apple Wallet punch pass at the billing counter.
                </p>
              </div>
              <span className="font-mono text-xs font-bold rounded-full bg-white px-3 py-1 text-secondary border border-border">
                {walletData?.passes?.length || 0} Stores
              </span>
            </div>

            {loading ? (
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-56 rounded-3xl bg-white/60 animate-pulse border border-border" />
                ))}
              </div>
            ) : (
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {walletData?.passes.map((pass) => (
                  <Link
                    key={pass.merchantId}
                    href={`/s/${pass.merchantSlug}`}
                    replace={false}
                    className="group relative flex flex-col justify-between rounded-3xl border border-border bg-white p-6 shadow-card transition-all duration-200 hover:shadow-float hover:-translate-y-1"
                  >
                    <div>
                      {/* Top Bar: Icon + Status */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-sand text-primary shadow-inner">
                            {getCategoryIcon(pass.category)}
                          </span>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-ink/50">
                              {pass.category}
                            </span>
                            <h3 className="font-display text-base font-extrabold text-secondary group-hover:text-primary transition-colors">
                              {pass.merchantName}
                            </h3>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-bold ${
                            pass.status === "REWARD READY"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : pass.status === "LOCKED UNTIL 12:00 AM IST"
                              ? "bg-amber-100 text-amber-800 border border-amber-300"
                              : "bg-coral/15 text-primary border border-primary/20"
                          }`}
                        >
                          {pass.status}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-6">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-secondary font-display text-sm font-extrabold">
                            {pass.displayVisits} of {pass.visitsRequired} Visits
                          </span>
                          <span className="text-primary font-mono">{pass.progressPercent}%</span>
                        </div>
                        <div className="mt-2 h-2.5 w-full rounded-full bg-sand overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-500"
                            style={{ width: `${pass.progressPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Reward Teaser */}
                      <div className="mt-4 flex items-center gap-2 rounded-xl bg-sand/50 p-2.5 border border-border/60">
                        <GiftBoxIcon size={18} />
                        <span className="text-xs font-bold text-secondary truncate">
                          Reward: <strong className="text-primary">{pass.rewardName}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Bottom Metadata */}
                    <div className="mt-6 pt-4 border-t border-border/70 flex items-center justify-between text-[11px] font-semibold text-ink/65">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-primary" />
                        {pass.daysRemaining} days left in streak
                      </span>
                      <span className="flex items-center gap-1 text-primary group-hover:translate-x-0.5 transition-transform">
                        <span>View Pass</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Pass History & Audit Log */}
          <div className="mt-12">
            <button
              type="button"
              onClick={() => setHistoryOpen(!historyOpen)}
              className="flex w-full items-center justify-between rounded-2xl bg-white p-5 border border-border shadow-sm text-left"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-sand text-secondary">
                  <History className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-display text-base font-extrabold text-secondary">
                    Visit History &amp; Audit Log
                  </h3>
                  <p className="text-xs text-ink/60">
                    Chronological record of verified check-ins and redeemed counter rewards.
                  </p>
                </div>
              </div>
              <ChevronDown
                className={`h-5 w-5 text-secondary transition-transform ${
                  historyOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {historyOpen && (
              <div className="mt-4 rounded-3xl border border-border bg-white overflow-hidden shadow-card">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-ink/80">
                    <thead className="border-b border-border bg-sand/40 text-[11px] font-bold uppercase tracking-wider text-secondary">
                      <tr>
                        <th className="px-6 py-4">Store Name</th>
                        <th className="px-6 py-4">Date (IST)</th>
                        <th className="px-6 py-4">Bill Amount</th>
                        <th className="px-6 py-4">Verification Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 font-semibold">
                      {walletData?.history && walletData.history.length > 0 ? (
                        walletData.history.map((record) => (
                          <tr key={record.id} className="hover:bg-sand/20 transition-colors">
                            <td className="px-6 py-4 font-display font-bold text-secondary">
                              {record.merchantName}
                            </td>
                            <td className="px-6 py-4 font-mono text-xs text-ink/70">
                              {record.visitDate}
                            </td>
                            <td className="px-6 py-4 font-mono font-bold text-secondary">
                              ₹{record.billAmount}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-xs font-bold ${
                                  record.status === "Approved"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : record.status === "Redeemed"
                                    ? "bg-secondary text-white"
                                    : "bg-sand text-ink/75"
                                }`}
                              >
                                {record.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-xs text-ink/50">
                            No visits recorded yet. Tap "Scan At Counter" on your next visit!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

