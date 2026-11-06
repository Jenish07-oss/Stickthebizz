"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Store,
  User,
  Camera,
  LogOut,
  ChevronDown,
  CheckCircle2,
  LayoutDashboard,
  History,
  QrCode,
  Sparkles,
} from "lucide-react";
import Logo from "@/components/Logo";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";

const CameraQRScanner = dynamic(() => import("@/components/CameraQRScanner"), {
  ssr: false,
});

interface AuthProfile {
  isLoading: boolean;
  userType: "owner" | "customer" | "guest";
  name: string;
  phone?: string;
  merchantSlug?: string;
}

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const [authProfile, setAuthProfile] = useState<AuthProfile>({
    isLoading: true,
    userType: "guest",
    name: "",
  });

  const isPricing = pathname === "/pricing";
  const isAbout = pathname === "/about";
  const isContact = pathname === "/contact";
  const isHowItWorks = pathname === "/how-it-works";

  // Check Supabase Auth & LocalStorage Customer Profile
  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    async function checkAuth() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // Check if user owns a merchant shop
          const { data: merchant } = await supabase
            .from("merchants")
            .select("id, name, slug")
            .eq("owner_id", user.id)
            .maybeSingle();

          if (merchant && mounted) {
            setAuthProfile({
              isLoading: false,
              userType: "owner",
              name: merchant.name,
              merchantSlug: merchant.slug,
            });
            return;
          }

          // Check if customer profile exists
          const { data: cust } = await supabase
            .from("customers")
            .select("id, full_name, phone")
            .or(`auth_id.eq.${user.id},email.eq.${user.email}`)
            .maybeSingle();

          if (mounted) {
            const customerName =
              cust?.full_name ||
              user.user_metadata?.full_name ||
              user.email?.split("@")[0] ||
              "Customer";
            setAuthProfile({
              isLoading: false,
              userType: "customer",
              name: customerName,
              phone: cust?.phone,
            });
            return;
          }
        }

        // Check if customer phone is stored locally
        if (typeof window !== "undefined") {
          const savedPhone = localStorage.getItem("stb_customer_phone");
          if (savedPhone && savedPhone.replace(/\D/g, "").length === 10) {
            const savedName = localStorage.getItem("stb_customer_name") || "Customer Pass";
            if (mounted) {
              setAuthProfile({
                isLoading: false,
                userType: "customer",
                name: savedName,
                phone: savedPhone,
              });
              return;
            }
          }
        }

        if (mounted) {
          setAuthProfile({
            isLoading: false,
            userType: "guest",
            name: "",
          });
        }
      } catch {
        if (mounted) {
          setAuthProfile({
            isLoading: false,
            userType: "guest",
            name: "",
          });
        }
      }
    }

    checkAuth();

    // Close dropdown on outside click
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      mounted = false;
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // ignore
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("stb_customer_phone");
        localStorage.removeItem("stb_customer_name");
        window.location.href = "/";
      }
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 h-16 w-full bg-white/95 sm:backdrop-blur-md border-b border-[#E5D9C8]/80 transition-colors">
        <nav
          className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-12"
          aria-label="Main Navigation"
        >
          {/* Left: Official Brand Logo */}
          <div className="flex items-center gap-3">
            <Logo href="/" size="md" />
          </div>

          {/* Center: Desktop Navigation Links */}
          <div className="hidden items-center gap-4 lg:gap-6 text-xs lg:text-sm font-semibold text-ink/80 xl:flex">
            <Link
              href="/how-it-works"
              className={`whitespace-nowrap transition-colors hover:text-secondary ${
                isHowItWorks ? "text-primary font-bold" : ""
              }`}
            >
              How It Works
            </Link>

            <Link
              href="/#for-shops"
              className="whitespace-nowrap transition-colors hover:text-secondary"
            >
              For Shops
            </Link>

            <Link
              href="/pricing"
              className={`whitespace-nowrap transition-colors hover:text-secondary ${
                isPricing ? "text-primary font-bold" : ""
              }`}
            >
              Pricing
            </Link>

            <Link
              href="/#faq"
              className="whitespace-nowrap transition-colors hover:text-secondary"
            >
              FAQ
            </Link>

            <Link
              href="/about"
              className={`whitespace-nowrap transition-colors hover:text-secondary ${
                isAbout ? "text-primary font-bold" : ""
              }`}
            >
              About
            </Link>

            <Link
              href="/contact"
              className={`whitespace-nowrap transition-colors hover:text-secondary ${
                isContact ? "text-primary font-bold" : ""
              }`}
            >
              Contact
            </Link>
          </div>

          {/* Right: Actions (Desktop) */}
          <div className="hidden items-center gap-2 sm:gap-3 xl:gap-4 md:flex shrink-0">
            {/* Direct Camera QR Scan Button — Primary Ghost */}
            <button
              type="button"
              onClick={() => setScannerOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-transparent px-3.5 py-2 text-xs font-extrabold text-primary hover:bg-primary/10 transition shadow-brand-sm active:scale-95"
              title="Open camera to scan counter QR standee"
            >
              <Camera className="h-4 w-4" />
              <span>Scan Standee</span>
            </button>

            {/* DYNAMIC USER PROFILE & LOGOUT DROPDOWN */}
            {authProfile.userType === "owner" ? (
              // SHOP OWNER LOGGED IN
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-secondary/90"
                >
                  <Store className="h-3.5 w-3.5 text-amber-300" />
                  <span className="max-w-[130px] truncate">{authProfile.name}</span>
                  <ChevronDown className="h-3 w-3 opacity-80" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-border bg-white p-2 shadow-xl animate-in fade-in zoom-in-95 duration-150 z-50">
                    <div className="px-3 py-2 border-b border-border/70">
                      <p className="text-[10px] font-bold uppercase text-ink/50 tracking-wider">Shop Owner Terminal</p>
                      <p className="font-display font-extrabold text-secondary text-sm truncate">{authProfile.name}</p>
                    </div>

                    <div className="py-1 space-y-0.5 text-xs font-bold text-ink/80">
                      <Link
                        href="/owner/dashboard"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-sand transition"
                      >
                        <LayoutDashboard className="h-4 w-4 text-primary" />
                        <span>Live Counter Queue</span>
                      </Link>
                      <Link
                        href="/owner/dashboard#ledger"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-sand transition"
                      >
                        <History className="h-4 w-4 text-secondary" />
                        <span>Customer Visit Ledger</span>
                      </Link>
                      <Link
                        href="/owner/dashboard#qr"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-sand transition"
                      >
                        <QrCode className="h-4 w-4 text-emerald-600" />
                        <span>Print Standee QR Kit</span>
                      </Link>
                    </div>

                    <div className="pt-1 mt-1 border-t border-border/70">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          handleLogout();
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-primary hover:bg-primary/10 transition"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Log Out Terminal</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : authProfile.userType === "customer" ? (
              // CUSTOMER LOGGED IN
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-bold text-primary shadow-xs transition hover:bg-primary hover:text-white"
                >
                  <User className="h-3.5 w-3.5" />
                  <span className="max-w-[120px] truncate">{authProfile.name}</span>
                  <ChevronDown className="h-3 w-3 opacity-80" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-border bg-white p-2 shadow-xl animate-in fade-in zoom-in-95 duration-150 z-50">
                    <div className="px-3 py-2 border-b border-border/70">
                      <p className="text-[10px] font-bold uppercase text-ink/50 tracking-wider">Verified Customer</p>
                      <p className="font-display font-extrabold text-secondary text-sm truncate">{authProfile.name}</p>
                      {authProfile.phone && (
                        <p className="font-mono text-[11px] text-ink/60">+91 {authProfile.phone}</p>
                      )}
                    </div>

                    <div className="py-1 space-y-0.5 text-xs font-bold text-ink/80">
                      <Link
                        href="/customer/dashboard"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-sand transition"
                      >
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span>My Digital Passes</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          setScannerOpen(true);
                        }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left hover:bg-sand transition"
                      >
                        <Camera className="h-4 w-4 text-emerald-600" />
                        <span>Punch Stamp at Counter</span>
                      </button>
                    </div>

                    <div className="pt-1 mt-1 border-t border-border/70">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          handleLogout();
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-primary hover:bg-primary/10 transition"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // GUEST NAVIGATION
              <>
                <Link
                  href="/customer/dashboard"
                  className="whitespace-nowrap text-xs lg:text-sm font-bold text-ink/75 hover:text-secondary transition px-2.5 py-2"
                >
                  Customer Portal
                </Link>

                <Link
                  href="/auth/owner/login"
                  className="whitespace-nowrap inline-flex items-center justify-center rounded-full bg-[#F2765E] hover:bg-[#F2765E]/90 text-white font-medium text-xs lg:text-sm px-4 lg:px-5 py-2 lg:py-2.5 transition shadow-sm active:scale-95"
                >
                  Merchant Login
                </Link>
              </>
            )}
          </div>

          {/* Mobile Right Bar: Direct Camera Button + Hamburger Toggle */}
          <div className="flex items-center gap-2 md:hidden">
            {/* Phone Direct Scan Button — Primary Solid */}
            <button
              type="button"
              onClick={() => setScannerOpen(true)}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-primary text-white px-3 py-1.5 text-xs font-bold shadow-brand-sm active:scale-95 transition hover:bg-primary/90"
              aria-label="Scan Counter QR"
            >
              <Camera className="h-3.5 w-3.5" />
              <span>Scan QR</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="grid h-10 w-10 place-items-center rounded-xl bg-sand/80 text-secondary border border-border touch-manipulation select-none active:scale-95 transition-transform"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-border bg-white px-6 py-6 shadow-xl transform-gpu transition-opacity duration-150">
            <div className="flex flex-col space-y-4 text-base font-bold text-ink/85">
              {/* Prominent Direct Camera Scanner CTA in Mobile Drawer — Primary Solid */}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setScannerOpen(true);
                }}
                className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white shadow-brand-sm transition hover:bg-primary/90 active:scale-95"
              >
                <Camera className="h-4 w-4" />
                <span>📷 Open Camera Scanner</span>
              </button>

              <Link
                href="/how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-secondary"
              >
                How It Works
              </Link>
              <Link
                href="/#for-shops"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-secondary"
              >
                For Shops
              </Link>
              <Link
                href="/pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-secondary"
              >
                Pricing
              </Link>
              <Link
                href="/#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-secondary"
              >
                FAQ
              </Link>
              <Link
                href="/about"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-secondary"
              >
                About
              </Link>
              <Link
                href="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-secondary"
              >
                Contact
              </Link>

              {/* Dynamic Mobile Profile / Auth Section */}
              <div className="pt-4 border-t border-border flex flex-col gap-3">
                {authProfile.userType === "owner" ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-xl bg-secondary/10 p-3 border border-secondary/20">
                      <div className="flex items-center gap-2.5">
                        <Store className="h-5 w-5 text-secondary" />
                        <div>
                          <p className="text-[10px] font-bold uppercase text-ink/60">Merchant Terminal</p>
                          <p className="font-display font-extrabold text-secondary text-sm">{authProfile.name}</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        Online
                      </span>
                    </div>

                    <Link
                      href="/owner/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 rounded-xl bg-secondary py-3 text-sm font-bold text-white shadow-sm"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      <span>Open Counter Terminal</span>
                    </Link>

                    <Link
                      href="/owner/dashboard#ledger"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 rounded-xl bg-sand py-2.5 text-xs font-bold text-secondary border border-border"
                    >
                      <History className="h-4 w-4" />
                      <span>Customer Visit Ledger</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleLogout();
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary/10 py-2.5 text-xs font-bold text-primary hover:bg-primary hover:text-white transition"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Log Out Terminal</span>
                    </button>
                  </div>
                ) : authProfile.userType === "customer" ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-xl bg-primary/10 p-3 border border-primary/20">
                      <div className="flex items-center gap-2.5">
                        <User className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-[10px] font-bold uppercase text-ink/60">Customer Pass Wallet</p>
                          <p className="font-display font-extrabold text-secondary text-sm">{authProfile.name}</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
                        Active
                      </span>
                    </div>

                    <Link
                      href="/customer/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 rounded-xl bg-secondary py-3 text-sm font-bold text-white shadow-sm"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>View My Digital Passes</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleLogout();
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-sand py-2.5 text-xs font-bold text-primary border border-border hover:bg-primary/10 transition"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                ) : (
                  <>
                    <Link
                      href="/customer/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 rounded-xl bg-sand py-3 text-sm font-bold text-secondary border border-border"
                    >
                      <User className="h-4 w-4" />
                      <span>Customer Portal</span>
                    </Link>
                    <Link
                      href="/auth/owner/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 rounded-xl bg-[#F2765E] py-3 text-sm font-bold text-white shadow-sm"
                    >
                      <Store className="h-4 w-4" />
                      <span>Merchant Login</span>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Direct Global Camera QR Scanner Modal */}
      <CameraQRScanner isOpen={scannerOpen} onClose={() => setScannerOpen(false)} />
    </>
  );
}
