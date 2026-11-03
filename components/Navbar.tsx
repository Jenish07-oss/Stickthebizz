"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Smartphone, Store, Sparkles, UserCheck } from "lucide-react";
import { ChaiCupIcon } from "@/components/BrandIcons";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isCustomer = pathname === "/customer";
  const isOwner = pathname === "/owner";
  const isPricing = pathname === "/pricing";
  const isAbout = pathname === "/about";
  const isContact = pathname === "/contact";

  return (
    <header className="sticky top-0 z-50 transition-all bg-white/75 backdrop-blur-md shadow-sm border-b border-[#E5D9C8]/40">
      <nav
        className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8"
        aria-label="Main Navigation"
      >
        {/* Left Side: Brand Logo + Live Server Sync Beacon */}
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex min-h-[48px] items-center gap-2.5 font-display text-xl font-extrabold tracking-tight text-secondary transition hover:opacity-90"
            aria-label="StickTheBizz Home"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-white shadow-sm">
              <Sparkles className="h-5 w-5" />
            </span>
            <span className="flex items-center">
              StickTheBizz<span className="text-primary">.in</span>
            </span>
          </Link>

          {/* Animated Live Server Sync Beacon */}
          <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 text-[11px] font-mono font-bold text-emerald-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="tracking-tight">Live Server Sync</span>
          </div>
        </div>

        {/* Center: Desktop Navigation Links with Micro-bounce & Coral Hover Dots */}
        <div className="hidden items-center gap-7 text-sm font-semibold text-ink/80 lg:flex">
          <Link
            href="/#how-it-works"
            className="group relative flex flex-col items-center py-2 min-h-[48px] justify-center transition hover:text-secondary"
          >
            <span className="transition-transform duration-150 group-hover:-translate-y-0.5">
              How It Works
            </span>
            <span className="absolute bottom-1 h-1 w-1 rounded-full bg-[#F2765E] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
          </Link>

          <Link
            href="/#for-shops"
            className="group relative flex flex-col items-center py-2 min-h-[48px] justify-center transition hover:text-secondary"
          >
            <span className="transition-transform duration-150 group-hover:-translate-y-0.5">
              For Shops
            </span>
            <span className="absolute bottom-1 h-1 w-1 rounded-full bg-[#F2765E] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
          </Link>

          <Link
            href="/pricing"
            className={`group relative flex flex-col items-center py-2 min-h-[48px] justify-center transition hover:text-secondary ${
              isPricing ? "text-primary font-bold" : ""
            }`}
          >
            <span className="transition-transform duration-150 group-hover:-translate-y-0.5">
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
            className="group relative flex flex-col items-center py-2 min-h-[48px] justify-center transition hover:text-secondary"
          >
            <span className="transition-transform duration-150 group-hover:-translate-y-0.5">
              FAQ
            </span>
            <span className="absolute bottom-1 h-1 w-1 rounded-full bg-[#F2765E] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
          </Link>

          <Link
            href="/about"
            className={`group relative flex flex-col items-center py-2 min-h-[48px] justify-center transition hover:text-secondary ${
              isAbout ? "text-primary font-bold" : ""
            }`}
          >
            <span className="transition-transform duration-150 group-hover:-translate-y-0.5">
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
            className={`group relative flex flex-col items-center py-2 min-h-[48px] justify-center transition hover:text-secondary ${
              isContact ? "text-primary font-bold" : ""
            }`}
          >
            <span className="transition-transform duration-150 group-hover:-translate-y-0.5">
              Contact
            </span>
            <span
              className={`absolute bottom-1 h-1 w-1 rounded-full bg-[#F2765E] transition-opacity duration-200 ${
                isContact ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}
            />
          </Link>
        </div>

        {/* Right Side: Visual Toggle Pill Group + CTAs */}
        <div className="hidden items-center gap-3 sm:flex">
          {/* View Switcher Pill Buttons */}
          <div className="flex items-center rounded-full border border-[#E5D9C8] bg-sand/60 p-1 text-xs">
            <Link
              href="/customer"
              className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-3.5 py-1 font-bold transition ${
                isCustomer
                  ? "bg-secondary text-white shadow-sm"
                  : "text-ink/75 hover:text-secondary"
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              Customer App
            </Link>
            <Link
              href="/owner"
              className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-3.5 py-1 font-bold transition ${
                isOwner
                  ? "bg-secondary text-white shadow-sm"
                  : "text-ink/75 hover:text-secondary"
              }`}
            >
              <Store className="h-3.5 w-3.5" />
              Owner Terminal
            </Link>
          </div>

          {/* Merchant Login */}
          <Link
            href="/auth/owner/login"
            className="inline-flex min-h-[42px] items-center justify-center rounded-full border border-secondary/25 bg-white px-4 text-xs font-bold text-secondary shadow-sm transition hover:bg-sand hover:border-secondary"
          >
            Login
          </Link>

          {/* Primary Action Button */}
          <Link
            href="/owner"
            className="inline-flex min-h-[42px] items-center justify-center rounded-full bg-primary px-5 text-xs font-bold text-white shadow-sm transition-all duration-200 hover:bg-primary/90 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
          >
            Open Shop Counter
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="grid h-11 w-11 place-items-center rounded-full text-ink hover:bg-black/5 lg:hidden"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-[#E5D9C8]/50 bg-white/95 px-6 py-5 shadow-float backdrop-blur-md lg:hidden">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E5D9C8]">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="text-xs font-mono font-bold text-emerald-700">
                Live Server Sync: Kesar Chai Corner
              </span>
            </div>

            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex min-h-[44px] items-center rounded-xl px-3 text-sm font-semibold text-ink hover:bg-sand"
            >
              Home
            </Link>
            <Link
              href="/customer"
              onClick={() => setMobileMenuOpen(false)}
              className="flex min-h-[44px] items-center gap-2 rounded-xl px-3 text-sm font-semibold text-secondary hover:bg-sand"
            >
              <Smartphone className="h-4 w-4" /> Customer Digital Card
            </Link>
            <Link
              href="/owner"
              onClick={() => setMobileMenuOpen(false)}
              className="flex min-h-[44px] items-center gap-2 rounded-xl px-3 text-sm font-semibold text-secondary hover:bg-sand"
            >
              <Store className="h-4 w-4" /> Shop Owner Terminal
            </Link>
            <Link
              href="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="flex min-h-[44px] items-center rounded-xl px-3 text-sm font-semibold text-ink hover:bg-sand"
            >
              Pricing (₹199/mo)
            </Link>
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="flex min-h-[44px] items-center rounded-xl px-3 text-sm font-semibold text-ink hover:bg-sand"
            >
              About StickTheBizz
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="flex min-h-[44px] items-center rounded-xl px-3 text-sm font-semibold text-ink hover:bg-sand"
            >
              Merchant Support &amp; WhatsApp
            </Link>

            <div className="my-2 border-t border-border pt-2">
              <Link
                href="/auth/owner/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-[44px] items-center gap-2 rounded-xl px-3 text-sm font-bold text-secondary hover:bg-sand"
              >
                <UserCheck className="h-4 w-4" /> Merchant Login
              </Link>
              <Link
                href="/auth/customer/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-[44px] items-center gap-2 rounded-xl px-3 text-sm font-bold text-ink/75 hover:bg-sand"
              >
                <Smartphone className="h-4 w-4" /> Customer OTP Login
              </Link>
            </div>

            <Link
              href="/auth/owner/register"
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
