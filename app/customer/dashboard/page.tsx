"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  getCustomerWalletAction,
  exportCustomerDataAction,
  deleteCustomerAccountAction,
  syncCustomerAccountAction,
  updateCustomerProfileAction,
  CustomerWalletData,
  CustomerStorePass,
} from "@/app/actions/customer";
import { decodeHtml } from "@/lib/utils/sanitize";
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
  Download,
  Trash2,
  AlertTriangle,
  User,
  Edit3,
  X,
  Phone,
  Mail,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const CameraQRScanner = dynamic(() => import("@/components/CameraQRScanner"), {
  ssr: false,
});
const ConfettiEffect = dynamic(() => import("@/components/ConfettiEffect"), {
  ssr: false,
});
const StampGrid = dynamic(() => import("@/components/StampGrid"), {
  ssr: false,
});
const RewardTicket = dynamic(() => import("@/components/RewardTicket"), {
  ssr: false,
});
const PhoneFrame = dynamic(() => import("@/components/PhoneFrame"), {
  ssr: false,
});

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
        // 1. Check client session
        const { data: { session } } = await supabase.auth.getSession();
        let user = session?.user ?? null;
        if (!user) {
          const { data } = await supabase.auth.getUser();
          user = data.user;
        }

        // If local storage has a phone number but user account doesn't have it synced yet
        const storedPhone = typeof window !== "undefined" ? localStorage.getItem("stb_customer_phone") : null;
        if (storedPhone && /^\d{10}$/.test(storedPhone)) {
          await syncCustomerAccountAction({ phone: storedPhone });
        }

        // 2. Fetch server-verified customer wallet
        const data = await getCustomerWalletAction();

        // 3. Only redirect if genuinely unauthenticated on BOTH client and server
        if (!user && !data?.customer) {
          router.replace("/auth/customer/login");
          return;
        }

        setWalletData(data);

        // Keep localStorage healed from verified server session
        if (data?.customer?.phone && typeof window !== "undefined") {
          localStorage.setItem("stb_customer_phone", data.customer.phone);
          if (data.customer.fullName) {
            localStorage.setItem("stb_customer_name", data.customer.fullName);
          }
        }
      } catch (err) {
        console.error("Failed to load customer wallet:", err);
      } finally {
        setLoading(false);
      }
    }
    loadWallet();
  }, [router, supabase]);

  const handleSignOut = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("stb_customer_phone");
      localStorage.removeItem("stb_customer_name");
    }
    await supabase.auth.signOut();
    router.push("/auth/customer/login");
  };

  const [isExporting, setIsExporting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Profile Edit State
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const [profileNameInput, setProfileNameInput] = useState("");
  const [profilePhoneInput, setProfilePhoneInput] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const handleOpenEditProfile = () => {
    setProfileNameInput(walletData?.customer?.fullName || "");
    setProfilePhoneInput(walletData?.customer?.phone || "");
    setProfileFeedback(null);
    setEditProfileModalOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileFeedback(null);
    const cleanPhone = profilePhoneInput.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setProfileFeedback({ success: false, message: "Please enter a valid 10-digit mobile number." });
      return;
    }
    const cleanName = profileNameInput.trim();
    if (!cleanName) {
      setProfileFeedback({ success: false, message: "Please enter your full name." });
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const res = await updateCustomerProfileAction({
        fullName: cleanName,
        phone: cleanPhone,
      });

      if (res.success && res.customer) {
        setWalletData((prev) =>
          prev
            ? {
                ...prev,
                customer: {
                  ...prev.customer!,
                  fullName: res.customer.full_name,
                  phone: res.customer.phone,
                },
              }
            : prev
        );
        if (typeof window !== "undefined") {
          localStorage.setItem("stb_customer_phone", cleanPhone);
          localStorage.setItem("stb_customer_name", cleanName);
        }
        setProfileFeedback({ success: true, message: "✓ Profile updated successfully!" });
        setTimeout(() => {
          setEditProfileModalOpen(false);
        }, 800);
      } else {
        setProfileFeedback({ success: false, message: res.error || "Failed to update profile." });
      }
    } catch (err: any) {
      setProfileFeedback({ success: false, message: err.message || "Error updating profile." });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      const res = await exportCustomerDataAction();
      if (res.success && res.data) {
        const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "stickthebizz-customer-data-" + new Date().toISOString().slice(0, 10) + ".json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        alert(res.error || "Unable to export data at this time.");
      }
    } catch (err: any) {
      alert("Export failed: " + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      const res = await deleteCustomerAccountAction();
      if (res.success) {
        alert("Your account and phone number have been permanently anonymized per DPDP Act standards.");
        router.push("/auth/customer/login");
      } else {
        alert(res.error || "Failed to delete account.");
      }
    } catch (err: any) {
      alert("Deletion failed: " + err.message);
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    const lower = (category || "").toLowerCase();
    if (lower.includes("chai") || lower.includes("cafe")) return <ChaiCupIcon size={24} />;
    if (lower.includes("kirana") || lower.includes("grocery")) return <BasketIcon size={24} />;
    return <StreakIcon size={24} />;
  };

  const connectedPasses = (walletData?.passes || []).filter(
    (p) => p.visitsCount > 0 || p.lastVisitDate
  );
  const otherStores = (walletData?.passes || []).filter(
    (p) => p.visitsCount === 0 && !p.lastVisitDate
  );

  return (
    <div className="flex min-h-screen flex-col bg-sand overflow-x-hidden">
      <Navbar />

      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {/* CUSTOMER PRIVATE PROFILE SECTION */}
          <div className="rounded-3xl bg-white p-6 sm:p-8 border border-border shadow-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/70">
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-white font-display text-xl font-extrabold shadow-sm">
                  {walletData?.customer?.fullName ? walletData.customer.fullName.slice(0, 2).toUpperCase() : "ME"}
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-sand px-3 py-0.5 font-mono text-[11px] font-bold text-secondary">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    <span>PRIVATE CUSTOMER PROFILE</span>
                  </div>
                  <h1 className="mt-1 font-display text-2xl sm:text-3xl font-extrabold text-secondary">
                    {walletData?.customer?.fullName || "Valued Regular"}
                  </h1>
                  <p className="text-xs text-ink/65">
                    Only you can view and manage your account and connected loyalty passes.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleOpenEditProfile}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-border bg-sand/60 px-4 py-2 text-xs font-bold text-secondary transition hover:bg-sand"
                >
                  <Edit3 className="h-3.5 w-3.5 text-primary" />
                  <span>Edit Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => setScannerOpen(true)}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-primary px-5 py-2 text-xs sm:text-sm font-bold text-white shadow-sm transition hover:bg-primary/90"
                >
                  <QrCode className="h-4 w-4" />
                  <span>📷 Scan Counter QR</span>
                </button>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 text-xs font-bold text-ink/65 hover:text-secondary hover:border-ink/30 transition"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>

            {/* Profile Info Cards */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl bg-sand/50 p-4 border border-border/70">
                <div className="flex items-center gap-2 text-ink/50 text-[11px] font-bold uppercase tracking-wider">
                  <User className="h-3.5 w-3.5 text-primary" />
                  <span>Full Name</span>
                </div>
                <p className="mt-1 font-display text-base font-extrabold text-secondary truncate">
                  {walletData?.customer?.fullName || "Not Specified"}
                </p>
              </div>

              <div className="rounded-2xl bg-sand/50 p-4 border border-border/70">
                <div className="flex items-center gap-2 text-ink/50 text-[11px] font-bold uppercase tracking-wider">
                  <Phone className="h-3.5 w-3.5 text-primary" />
                  <span>Mobile Number</span>
                </div>
                <p className="mt-1 font-mono text-base font-bold text-secondary truncate">
                  {walletData?.customer?.phone ? `+91 ${walletData.customer.phone}` : "Not linked"}
                </p>
              </div>

              <div className="rounded-2xl bg-sand/50 p-4 border border-border/70">
                <div className="flex items-center gap-2 text-ink/50 text-[11px] font-bold uppercase tracking-wider">
                  <Mail className="h-3.5 w-3.5 text-primary" />
                  <span>Email Address</span>
                </div>
                <p className="mt-1 text-sm font-semibold text-secondary truncate">
                  {walletData?.customer?.email || "Signed In"}
                </p>
              </div>
            </div>
          </div>

          <CameraQRScanner isOpen={scannerOpen} onClose={() => setScannerOpen(false)} />

          {/* SECTION 1: CONNECTED STORES & STAMP PASSES */}
          <div className="mt-10">
            <div className="flex items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                  <Store className="h-3.5 w-3.5" />
                  <span>My Retail Network</span>
                </div>
                <h2 className="font-display text-xl sm:text-2xl font-extrabold text-secondary mt-0.5">
                  Connected Store Passes
                </h2>
                <p className="text-xs text-ink/65">
                  Stores where you have visited and collected digital stamps.
                </p>
              </div>
              <span className="font-mono text-xs font-bold rounded-full bg-white px-3.5 py-1 text-secondary border border-border">
                {connectedPasses.length} Active {connectedPasses.length === 1 ? "Store" : "Stores"}
              </span>
            </div>

            {loading ? (
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-56 rounded-3xl bg-white/60 animate-pulse border border-border" />
                ))}
              </div>
            ) : connectedPasses.length === 0 ? (
              <div className="mt-6 rounded-3xl border border-dashed border-border bg-white p-8 sm:p-12 text-center shadow-sm">
                <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Sparkles className="h-7 w-7" />
                </div>
                <h3 className="font-display text-xl font-extrabold text-secondary">
                  No Connected Store Passes Yet
                </h3>
                <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm text-ink/70 leading-relaxed">
                  You haven&apos;t collected stamps at any counter yet. On your next visit to any partner chai stall, bakery, cafe, or kirana store, scan their acrylic counter standee to punch your first stamp!
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setScannerOpen(true)}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-primary px-5 text-xs sm:text-sm font-bold text-white shadow-sm transition hover:bg-primary/90"
                  >
                    <QrCode className="h-4 w-4" />
                    <span>Scan Counter QR Standee</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {connectedPasses.map((pass) => (
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
                              {decodeHtml(pass.category)}
                            </span>
                            <h3 className="font-display text-base font-extrabold text-secondary group-hover:text-primary transition-colors">
                              {decodeHtml(pass.merchantName)}
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
                            {pass.displayVisits} of {pass.visitsRequired} Stamps Collected
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
                          Goal: <strong className="text-primary">{decodeHtml(pass.rewardName)}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Bottom Metadata */}
                    <div className="mt-6 pt-4 border-t border-border/70 flex items-center justify-between text-[11px] font-semibold text-ink/65">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-primary" />
                        {pass.daysRemaining} days left in streak
                      </span>
                      <span className="flex items-center gap-1 text-primary group-hover:translate-x-0.5 transition-transform font-bold">
                        <span>Open Pass</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 2: DISCOVER OTHER LOCAL STORES */}
          {otherStores.length > 0 && (
            <div className="mt-12">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg sm:text-xl font-extrabold text-secondary">
                    Discover Other Local Counters
                  </h3>
                  <p className="text-xs text-ink/65">
                    Visit these stores to earn digital stamps and exclusive loyalty rewards.
                  </p>
                </div>
                <span className="font-mono text-xs font-bold text-ink/50">
                  {otherStores.length} Available
                </span>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {otherStores.map((store) => (
                  <Link
                    key={store.merchantId}
                    href={`/s/${store.merchantSlug}`}
                    className="flex items-center justify-between rounded-2xl border border-border bg-white p-4 shadow-sm hover:border-primary/40 hover:shadow-card transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-sand text-secondary">
                        {getCategoryIcon(store.category)}
                      </span>
                      <div>
                        <h4 className="font-display text-sm font-extrabold text-secondary">
                          {decodeHtml(store.merchantName)}
                        </h4>
                        <p className="text-[11px] text-ink/60">
                          {decodeHtml(store.category)} • Min ₹{store.minSpend}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-primary flex items-center gap-1">
                      <span>Pass</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

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

          {/* DPDP Act 2023 Customer Privacy & Data Rights Card */}
          <div className="mt-10 rounded-3xl border border-secondary/20 bg-white p-6 sm:p-8 shadow-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-success">
                  <ShieldCheck className="h-4 w-4" />
                  DPDP ACT 2023 PRIVACY GUARANTEE
                </div>
                <h2 className="mt-1 font-display text-xl font-extrabold text-secondary">
                  Your Privacy &amp; Data Rights
                </h2>
                <p className="mt-1 text-xs text-ink/70">
                  StickTheBizz never sells or monetizes your data. You have the full legal right to export or permanently delete your account at any time.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleExportData}
                  disabled={isExporting}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-sand/60 px-4 py-2.5 text-xs font-bold text-secondary transition hover:bg-sand"
                >
                  <Download className="h-3.5 w-3.5 text-primary" />
                  {isExporting ? "Exporting..." : "Export My Data (JSON)"}
                </button>

                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-700 transition hover:bg-red-100"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-600" />
                  Delete My Account
                </button>
              </div>
            </div>
          </div>

          {/* Delete Confirmation Modal */}
          {deleteModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
              <div className="w-full max-w-md rounded-[2rem] border border-border bg-white p-6 sm:p-8 shadow-2xl">
                <div className="flex items-center gap-3 text-red-600">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-red-100">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-lg font-extrabold text-secondary">
                    Delete Customer Account?
                  </h3>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-ink/75">
                  Under India&apos;s DPDP Act 2023, this will <strong>permanently anonymize your phone number and identity</strong>.
                  Your existing punch card stamps and passes will be permanently decoupled. This action cannot be undone.
                </p>
                <div className="mt-6 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setDeleteModalOpen(false)}
                    className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-ink/70 hover:bg-sand/40"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {isDeleting ? "Anonymizing..." : "Yes, Delete Everything"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Profile Modal */}
          {editProfileModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-secondary/80 p-4 backdrop-blur-sm animate-in fade-in">
              <div className="relative w-full max-w-md rounded-3xl border border-border bg-white p-6 sm:p-8 shadow-2xl">
                <button
                  type="button"
                  onClick={() => setEditProfileModalOpen(false)}
                  className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-sand text-ink/60 hover:text-secondary"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="text-center">
                  <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-sand text-secondary">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-display text-xl font-extrabold text-secondary">
                    Edit Your Account Profile
                  </h3>
                  <p className="mt-1 text-xs text-ink/65">
                    Your name and mobile number are used to identify your digital passes at checkout counters.
                  </p>
                </div>

                {profileFeedback && (
                  <div
                    className={`mt-4 rounded-xl p-3 text-xs font-bold text-center border ${
                      profileFeedback.success
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-red-50 text-red-700 border-red-200"
                    }`}
                  >
                    {profileFeedback.message}
                  </div>
                )}

                <form onSubmit={handleSaveProfile} className="mt-5 space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                      Your Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={profileNameInput}
                      onChange={(e) => setProfileNameInput(e.target.value)}
                      placeholder="e.g. Ramesh Patel"
                      className="mt-1.5 w-full rounded-xl border border-border bg-white p-3 text-sm font-bold text-secondary focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                      10-Digit Mobile Number
                    </label>
                    <div className="relative mt-1.5">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 font-mono text-xs font-bold text-secondary">
                        +91
                      </span>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={profilePhoneInput}
                        onChange={(e) => setProfilePhoneInput(e.target.value.replace(/\D/g, ""))}
                        placeholder="98200 12345"
                        className="w-full rounded-xl border border-border bg-white p-3 pl-14 font-mono text-sm font-bold text-secondary focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setEditProfileModalOpen(false)}
                      className="rounded-xl border border-border px-4 py-2.5 text-xs font-bold text-ink/70 hover:bg-sand/40"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUpdatingProfile}
                      className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-card hover:bg-primary/90 disabled:opacity-50"
                    >
                      {isUpdatingProfile ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

