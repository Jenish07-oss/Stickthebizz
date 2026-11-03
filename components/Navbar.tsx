"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Smartphone, Store, Sparkles, UserCheck } from "lucide-react";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isCustomer = pathname === "/customer";
  const isOwner = pathname === "/owner";
  const isPricing = pathname === "/pricing";
  const isAbout = pathname === "/about";
  const isContact = pathname === "/contact";

  return (
    <header className="sticky top-0 z-50 transition-all bg-white/80 backdrop-blur-md shadow-sm border-b border-[#E5D9C8]/50">
      <nav
        className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8"
        aria-label="Main Navigation"
      >
        {/* Left Side: Brand Logo + Compact Live Server Sync Beacon */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/"
            target="_self"
            className="flex min-h-[44px] items-center gap-2 font-display text-lg sm:text-xl font-extrabold tracking-tight text-secondary transition hover:opacity-90 shrink-0"
            aria-label="StickTheBizz Home"
          >
            <span className="grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-xl bg-primary text-white shadow-sm shrink-0">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
            </span>
            <span className="whitespace-nowrap">
              StickTheBizz<span className="text-primary">.in</span>
            </span>
          </Link>

          {/* Animated Live Server Sync Beacon (Always single line, no wrapping) */}
          <div className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 text-[11px] font-mono font-bold text-emerald-700 shrink-0 whitespace-nowrap">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="whitespace-nowrap">Live Sync</span>
          </div>
        </div>

        {/* Center: Desktop Navigation Links (Strictly whitespace-nowrap, never wrap) */}
        <div className="hidden items-center gap-4 xl:gap-6 text-xs sm:text-sm font-semibold text-ink/80 lg:flex shrink-0">
          <Link
            href="/#how-it-works"
            target="_self"
            className="group relative flex flex-col items-center py-2 min-h-[44px] justify-center transition hover:text-secondary whitespace-nowrap"
          >
            <span className="transition-transform duration-150 group-hover:-translate-y-0.5 whitespace-nowrap">
              How It Works
            </span>
            <span className="absolute bottom-1 h-1 w-1 rounded-full bg-[#F2765E] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
          </Link>

          <Link
            href="/#for-shops"
            target="_self"
            className="group relative flex flex-col items-center py-2 min-h-[44px] justify-center transition hover:text-secondary whitespace-nowrap"
          >
            <span className="transition-transform duration-150 group-hover:-translate-y-0.5 whitespace-nowrap">
              For Shops
            </span>
            <span className="absolute bottom-1 h-1 w-1 rounded-full bg-[#F2765E] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
          </Link>

          <Link
            href="/pricing"
            target="_self"
            className={`group relative flex flex-col items-center py-2 min-h-[44px] justify-center transition hover:text-secondary whitespace-nowrap ${
              isPricing ? "text-primary font-bold" : ""
            }`}
          >
            <span className="transition-transform duration-150 group-hover:-translate-y-0.5 whitespace-nowrap">
              Pricing (₹199)
            </span>
            <span
              className={`absolute bottom-1 h-1 w-1 rounded-full bg-[#F2765E] transition-opacity duration-200 ${
                isPricing ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}
            />
          </Link>

          <Link
            href="/#faq"
            target="_self"
            className="group relative flex flex-col items-center py-2 min-h-[44px] justify-center transition hover:text-secondary whitespace-nowrap"
          >
            <span className="transition-transform duration-150 group-hover:-translate-y-0.5 whitespace-nowrap">
              FAQ
            </span>
            <span className="absolute bottom-1 h-1 w-1 rounded-full bg-[#F2765E] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
          </Link>

          <Link
            href="/about"
            target="_self"
            className={`hidden xl:flex group relative flex-col items-center py-2 min-h-[44px] justify-center transition hover:text-secondary whitespace-nowrap ${
              isAbout ? "text-primary font-bold" : ""
            }`}
          >
            <span className="transition-transform duration-150 group-hover:-translate-y-0.5 whitespace-nowrap">
              About
            </span>
            <span
              className={`absolute bottom-1 h-1 w-1 rounded-full bg-[#F2765E] transition-opacity duration-200 ${
                isAbout ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}
            />
          </Link>

          <Link
            href="/contact"
            target="_self"
            className={`hidden xl:flex group relative flex-col items-center py-2 min-h-[44px] justify-center transition hover:text-secondary whitespace-nowrap ${
              isContact ? "text-primary font-bold" : ""
            }`}
          >
            <span className="transition-transform duration-150 group-hover:-translate-y-0.5 whitespace-nowrap">
              Contact
            </span>
            <span
              className={`absolute bottom-1 h-1 w-1 rounded-full bg-[#F2765E] transition-opacity duration-200 ${
                isContact ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}
            />
          </Link>
        </div>

        {/* Right Side: View Switcher Pill Group + CTAs (Strictly whitespace-nowrap, never wrap) */}
        <div className="hidden items-center gap-2.5 sm:flex shrink-0">
          {/* View Switcher Pill Buttons */}
          <div className="flex items-center rounded-full border border-[#E5D9C8] bg-sand/60 p-1 text-xs shrink-0 whitespace-nowrap">
            <Link
              href="/customer"
              target="_self"
              className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-full px-3 py-1 font-bold transition whitespace-nowrap shrink-0 ${
                isCustomer
                  ? "bg-secondary text-white shadow-sm"
                  : "text-ink/75 hover:text-secondary"
              }`}
            >
              <Smartphone className="h-3.5 w-3.5 shrink-0" />
              <span className="whitespace-nowrap">Customer App</span>
            </Link>
            <Link
              href="/owner"
              target="_self"
              className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-full px-3 py-1 font-bold transition whitespace-nowrap shrink-0 ${
                isOwner
                  ? "bg-secondary text-white shadow-sm"
                  : "text-ink/75 hover:text-secondary"
              }`}
            >
              <Store className="h-3.5 w-3.5 shrink-0" />
              <span className="whitespace-nowrap">Owner Terminal</span>
            </Link>
          </div>

          {/* Merchant Login Button */}
          <Link
            href="/auth/owner/login"
            target="_self"
            className="inline-flex min-h-[38px] items-center justify-center rounded-full border border-secondary/25 bg-white px-3.5 text-xs font-bold text-secondary shadow-sm transition hover:bg-sand hover:border-secondary shrink-0 whitespace-nowrap"
          >
            Login
          </Link>

          {/* Primary Action Button */}
          <Link
            href="/owner"
            target="_self"
            className="inline-flex min-h-[38px] items-center justify-center rounded-full bg-primary px-4 text-xs font-bold text-white shadow-sm transition-all duration-200 hover:bg-primary/90 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 shrink-0 whitespace-nowrap"
          >
            Open Shop Counter
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="grid h-10 w-10 place-items-center rounded-full text-ink hover:bg-black/5 lg:hidden shrink-0"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile Drawer (Always single tab, same window) */}
      {mobileMenuOpen && (
        <div className="border-t border-[#E5D9C8]/50 bg-white/95 px-6 py-5 shadow-float backdrop-blur-md lg:hidden">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E5D9C8]">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="text-xs font-mono font-bold text-emerald-700">
                Live Server Sync: Kesar Chai Corner
              </span>
            </div>

            <Link
              href="/"
              target="_self"
              onClick={() => setMobileMenuOpen(false)}
              className="flex min-h-[44px] items-center rounded-xl px-3 text-sm font-semibold text-ink hover:bg-sand"
            >
              Home
            </Link>
            <Link
              href="/customer"
              target="_self"
              onClick={() => setMobileMenuOpen(false)}
              className="flex min-h-[44px] items-center gap-2 rounded-xl px-3 text-sm font-semibold text-secondary hover:bg-sand"
            >
              <Smartphone className="h-4 w-4 shrink-0" /> Customer Digital Card
            </Link>
            <Link
              href="/owner"
              target="_self"
              onClick={() => setMobileMenuOpen(false)}
              className="flex min-h-[44px] items-center gap-2 rounded-xl px-3 text-sm font-semibold text-secondary hover:bg-sand"
            >
              <Store className="h-4 w-4 shrink-0" /> Shop Owner Terminal
            </Link>
            <Link
              href="/pricing"
              target="_self"
              onClick={() => setMobileMenuOpen(false)}
              className="flex min-h-[44px] items-center rounded-xl px-3 text-sm font-semibold text-ink hover:bg-sand"
            >
              Pricing (₹199/mo)
            </Link>
            <Link
              href="/about"
              target="_self"
              onClick={() => setMobileMenuOpen(false)}
              className="flex min-h-[44px] items-center rounded-xl px-3 text-sm font-semibold text-ink hover:bg-sand"
            >
              About StickTheBizz
            </Link>
            <Link
              href="/contact"
              target="_self"
              onClick={() => setMobileMenuOpen(false)}
              className="flex min-h-[44px] items-center rounded-xl px-3 text-sm font-semibold text-ink hover:bg-sand"
            >
              Merchant Support &amp; WhatsApp
            </Link>

            <div className="my-2 border-t border-border pt-2">
              <Link
                href="/auth/owner/login"
                target="_self"
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-[44px] items-center gap-2 rounded-xl px-3 text-sm font-bold text-secondary hover:bg-sand"
              >
                <UserCheck className="h-4 w-4 shrink-0" /> Merchant Login
              </Link>
              <Link
                href="/auth/customer/login"
                target="_self"
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-[44px] items-center gap-2 rounded-xl px-3 text-sm font-bold text-ink/75 hover:bg-sand"
              >
                <Smartphone className="h-4 w-4 shrink-0" /> Customer OTP Login
              </Link>
            </div>

            <Link
              href="/auth/owner/register"
              target="_self"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-2 flex min-h-[46px] w-full items-center justify-center rounded-full bg-primary text-center font-bold text-white shadow-sm"
            >
              Register Shop Counter
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
