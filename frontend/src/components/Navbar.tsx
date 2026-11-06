"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  X,
  Store,
  User,
  Camera,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  QrCode,
  Sparkles,
} from "lucide-react";
import Logo from "./Logo";
import dynamic from "next/dynamic";
import { useAuth } from "../context/AuthContext";

const CameraQRScanner = dynamic(() => import("./CameraQRScanner"), {
  ssr: false,
});

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  const { user, merchant, customer, isLoading, logout } = useAuth();

  const isPricing = pathname === "/auth/owner/register" || pathname === "/pricing";
  const isDashboard = pathname.startsWith("/owner/dashboard") || pathname.startsWith("/customer/dashboard");

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    setProfileDropdownOpen(false);
    router.push("/");
  };

  const isMerchant = user?.role === "MERCHANT";
  const isCustomer = user?.role === "CUSTOMER";
  const displayName =
    (isMerchant ? merchant?.name : customer?.fullName || user?.fullName) ||
    user?.email?.split("@")[0] ||
    "Account";

  return (
    <>
      <header className="sticky top-0 z-50 h-16 w-full bg-white/95 sm:backdrop-blur-md border-b border-[#E5D9C8]/80 transition-colors no-print">
        <nav
          className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-12"
          aria-label="Main Navigation"
        >
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <Logo href="/" size="md" />
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/#how-it-works"
              className="text-sm font-semibold text-ink/75 hover:text-secondary transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="/#retail-presets"
              className="text-sm font-semibold text-ink/75 hover:text-secondary transition-colors"
            >
              For Local Shops
            </Link>
            <Link
              href="/#roi-calculator"
              className="text-sm font-semibold text-ink/75 hover:text-secondary transition-colors"
            >
              ROI Calculator
            </Link>
            <Link
              href="/auth/owner/register"
              className={`text-sm font-semibold transition-colors ${
                isPricing ? "text-primary font-bold" : "text-ink/75 hover:text-secondary"
              }`}
            >
              Pricing (₹749/mo)
            </Link>
          </div>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {/* Quick QR Scanner Button */}
            <button
              type="button"
              onClick={() => setScannerOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-secondary/20 bg-secondary/5 px-3 py-2 text-xs font-bold text-secondary hover:bg-secondary/10 transition shadow-2xs"
              title="Scan counter QR code from camera"
            >
              <Camera className="h-3.5 w-3.5 text-primary" />
              <span>Scan Standee</span>
            </button>

            {isLoading ? (
              <div className="h-9 w-24 animate-pulse rounded-xl bg-sand/60" />
            ) : user ? (
              /* Authenticated User Dropdown */
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-sand/40 px-3.5 py-2 text-xs font-bold text-secondary hover:bg-sand transition"
                >
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-secondary text-white text-[10px]">
                    {displayName[0]?.toUpperCase()}
                  </span>
                  <span className="max-w-[120px] truncate">{displayName}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-ink/50" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-border bg-white p-2 shadow-xl animate-in fade-in slide-in-from-top-2">
                    <div className="border-b border-border/70 px-3 py-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-ink/50">
                        {isMerchant ? "Shop Owner Counter" : "Loyal Customer"}
                      </p>
                      <p className="text-xs font-bold text-secondary truncate">{displayName}</p>
                      <p className="text-[11px] text-ink/60 truncate">{user.email}</p>
                    </div>

                    <div className="py-1">
                      {isMerchant ? (
                        <>
                          <Link
                            href="/owner/dashboard"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-secondary hover:bg-sand/60 transition"
                          >
                            <LayoutDashboard className="h-4 w-4 text-primary" />
                            <span>Merchant Terminal</span>
                          </Link>
                          <Link
                            href="/owner/profile"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-secondary hover:bg-sand/60 transition"
                          >
                            <Store className="h-4 w-4 text-secondary" />
                            <span>Shop Rules &amp; Billing</span>
                          </Link>
                        </>
                      ) : (
                        <Link
                          href="/customer/dashboard"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-secondary hover:bg-sand/60 transition"
                        >
                          <QrCode className="h-4 w-4 text-primary" />
                          <span>My Stamp Passes</span>
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-border/70 pt-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Guest Navigation Buttons */
              <>
                <Link
                  href="/auth/customer/login"
                  className="rounded-xl border border-secondary/30 px-3.5 py-2 text-xs font-bold text-secondary hover:bg-secondary/5 transition"
                >
                  Customer Login
                </Link>
                <Link
                  href="/auth/owner/login"
                  className="rounded-xl bg-secondary px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary transition"
                >
                  Shop Owner Login
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setScannerOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-xl bg-secondary/10 text-secondary"
              aria-label="Scan QR Code"
            >
              <Camera className="h-4 w-4 text-primary" />
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="grid h-9 w-9 place-items-center rounded-xl bg-sand text-secondary"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="border-b border-border bg-white px-5 py-6 md:hidden animate-in fade-in slide-in-from-top-2">
            <div className="flex flex-col gap-3">
              <Link
                href="/#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-semibold text-ink/80 py-1.5"
              >
                How It Works
              </Link>
              <Link
                href="/#retail-presets"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-semibold text-ink/80 py-1.5"
              >
                For Local Retailers
              </Link>
              <Link
                href="/#roi-calculator"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-semibold text-ink/80 py-1.5"
              >
                ROI Calculator
              </Link>
              <Link
                href="/auth/owner/register"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-bold text-primary py-1.5"
              >
                Plans &amp; Pricing (₹749/mo)
              </Link>

              <hr className="my-2 border-border" />

              {user ? (
                <>
                  <div className="px-1 py-1">
                    <p className="text-[11px] font-bold uppercase text-ink/50">Signed in as</p>
                    <p className="text-sm font-bold text-secondary">{displayName}</p>
                  </div>
                  {isMerchant ? (
                    <>
                      <Link
                        href="/owner/dashboard"
                        onClick={() => setMobileMenuOpen(false)}
                        className="rounded-xl bg-secondary px-4 py-2.5 text-center text-xs font-bold text-white"
                      >
                        Merchant Terminal
                      </Link>
                      <Link
                        href="/owner/profile"
                        onClick={() => setMobileMenuOpen(false)}
                        className="rounded-xl border border-secondary px-4 py-2 text-center text-xs font-bold text-secondary"
                      >
                        Shop Rules &amp; Billing
                      </Link>
                    </>
                  ) : (
                    <Link
                      href="/customer/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="rounded-xl bg-secondary px-4 py-2.5 text-center text-xs font-bold text-white"
                    >
                      My Stamp Passes
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-xl bg-rose-50 py-2.5 text-xs font-bold text-rose-600"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/customer/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-xl border border-secondary px-4 py-2.5 text-center text-xs font-bold text-secondary"
                  >
                    Customer Login
                  </Link>
                  <Link
                    href="/auth/owner/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-xl bg-secondary px-4 py-2.5 text-center text-xs font-bold text-white"
                  >
                    Shop Owner Login
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Camera QR Scanner Modal */}
      <CameraQRScanner isOpen={scannerOpen} onClose={() => setScannerOpen(false)} />
    </>
  );
}

