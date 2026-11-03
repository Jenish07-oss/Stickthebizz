"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Smartphone, Store, Sparkles } from "lucide-react";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isCustomer = pathname === "/customer";
  const isOwner = pathname === "/owner";
  const isPricing = pathname === "/pricing";

  return (
    <header className="sticky top-0 z-40 px-4 pt-4 sm:px-6 lg:px-8">
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-ink/10 bg-sand/90 px-5 py-2.5 backdrop-blur-md shadow-card"
        aria-label="Main Navigation"
      >
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex min-h-[48px] items-center gap-2 font-display text-xl font-extrabold tracking-tight text-secondary transition hover:opacity-90"
          aria-label="StickTheBizz Home"
        >
          <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-white shadow-sm">
            <Sparkles className="h-5 w-5" />
          </span>
          <span>
            StickTheBizz<span className="text-primary">.</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden items-center gap-6 text-sm font-semibold text-ink/80 lg:flex">
          <Link
            href="/#how-it-works"
            className="min-h-[48px] inline-flex items-center transition hover:text-secondary"
          >
            How It Works
          </Link>
          <Link
            href="/#for-shops"
            className="min-h-[48px] inline-flex items-center transition hover:text-secondary"
          >
            For Shops
          </Link>
          <Link
            href="/pricing"
            className={`min-h-[48px] inline-flex items-center transition hover:text-secondary ${
              isPricing ? "text-primary font-bold" : ""
            }`}
          >
            Pricing (₹199/mo)
          </Link>
          <Link
            href="/#faq"
            className="min-h-[48px] inline-flex items-center transition hover:text-secondary"
          >
            FAQ
          </Link>
          <Link
            href="/about"
            className="min-h-[48px] inline-flex items-center transition hover:text-secondary"
          >
            About
          </Link>
          <Link
            href="/contact"
            className="min-h-[48px] inline-flex items-center transition hover:text-secondary"
          >
            Contact
          </Link>

          {/* View Switcher Pills */}
          <div className="flex items-center rounded-full border border-border bg-white/70 p-1 text-xs">
            <Link
              href="/customer"
              className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-3.5 py-1 font-bold transition ${
                isCustomer
                  ? "bg-secondary text-white shadow-sm"
                  : "text-ink/70 hover:text-secondary"
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              Customer View
            </Link>
            <Link
              href="/owner"
              className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-3.5 py-1 font-bold transition ${
                isOwner
                  ? "bg-secondary text-white shadow-sm"
                  : "text-ink/70 hover:text-secondary"
              }`}
            >
              <Store className="h-3.5 w-3.5" />
              Owner Terminal
            </Link>
          </div>
        </div>

        {/* Action Button (Desktop) */}
        <div className="hidden items-center gap-3 sm:flex">
          <Link
            href="/owner"
            className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-primary px-6 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Open Shop Counter
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="grid h-12 w-12 place-items-center rounded-full text-ink hover:bg-white/50 lg:hidden"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mt-2 rounded-3xl border border-ink/10 bg-white p-5 shadow-float lg:hidden">
          <div className="flex flex-col gap-2">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex min-h-[48px] items-center rounded-xl px-4 text-base font-semibold text-ink hover:bg-sand"
            >
              Home
            </Link>
            <Link
              href="/customer"
              onClick={() => setMobileMenuOpen(false)}
              className="flex min-h-[48px] items-center gap-2 rounded-xl px-4 text-base font-semibold text-secondary hover:bg-sand"
            >
              <Smartphone className="h-5 w-5" /> Customer Digital Card
            </Link>
            <Link
              href="/owner"
              onClick={() => setMobileMenuOpen(false)}
              className="flex min-h-[48px] items-center gap-2 rounded-xl px-4 text-base font-semibold text-secondary hover:bg-sand"
            >
              <Store className="h-5 w-5" /> Shop Owner Terminal
            </Link>
            <Link
              href="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="flex min-h-[48px] items-center rounded-xl px-4 text-base font-semibold text-ink hover:bg-sand"
            >
              Pricing (₹199/mo)
            </Link>
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="flex min-h-[48px] items-center rounded-xl px-4 text-base font-semibold text-ink hover:bg-sand"
            >
              About StickTheBizz
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="flex min-h-[48px] items-center rounded-xl px-4 text-base font-semibold text-ink hover:bg-sand"
            >
              Merchant Support &amp; WhatsApp
            </Link>
            <Link
              href="/privacy"
              onClick={() => setMobileMenuOpen(false)}
              className="flex min-h-[48px] items-center rounded-xl px-4 text-sm text-ink/70 hover:bg-sand"
            >
              Privacy Policy (DPDP Act)
            </Link>
            <Link
              href="/terms"
              onClick={() => setMobileMenuOpen(false)}
              className="flex min-h-[48px] items-center rounded-xl px-4 text-sm text-ink/70 hover:bg-sand"
            >
              Terms &amp; Conditions
            </Link>

            <Link
              href="/owner"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-3 flex min-h-[48px] w-full items-center justify-center rounded-full bg-primary text-center font-bold text-white shadow-sm"
            >
              Open Shop Counter
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
