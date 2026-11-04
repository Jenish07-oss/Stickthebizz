"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Sparkles, Store, User } from "lucide-react";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isPricing = pathname === "/pricing";
  const isAbout = pathname === "/about";
  const isContact = pathname === "/contact";

  return (
    <header className="sticky top-0 z-50 h-16 w-full bg-white/95 sm:backdrop-blur-md border-b border-[#E5D9C8]/80 transition-colors">
      <nav
        className="mx-auto flex h-full max-w-7xl items-center justify-between px-6 lg:px-12"
        aria-label="Main Navigation"
      >
        {/* Left: Brand Identity */}
        <Link
          href="/"
          replace={false}
          className="flex items-center gap-2.5 font-display text-xl font-extrabold tracking-tight text-secondary transition hover:opacity-90 shrink-0"
          aria-label="StickTheBizz Home"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-white shadow-sm shrink-0">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="text-secondary font-display font-extrabold text-xl tracking-tight">
            StickTheBizz
          </span>
        </Link>

        {/* Center: Desktop Navigation Links */}
        <div className="hidden items-center gap-4 lg:gap-6 text-xs lg:text-sm font-semibold text-ink/80 xl:flex">
          <Link
            href="/#how-it-works"
            replace={false}
            className="whitespace-nowrap transition-colors hover:text-secondary"
          >
            How It Works
          </Link>

          <Link
            href="/#for-shops"
            replace={false}
            className="whitespace-nowrap transition-colors hover:text-secondary"
          >
            For Shops
          </Link>

          <Link
            href="/pricing"
            replace={false}
            className={`whitespace-nowrap transition-colors hover:text-secondary ${
              isPricing ? "text-primary font-bold" : ""
            }`}
          >
            Pricing
          </Link>

          <Link
            href="/#faq"
            replace={false}
            className="whitespace-nowrap transition-colors hover:text-secondary"
          >
            FAQ
          </Link>

          <Link
            href="/about"
            replace={false}
            className={`whitespace-nowrap transition-colors hover:text-secondary ${
              isAbout ? "text-primary font-bold" : ""
            }`}
          >
            About
          </Link>

          <Link
            href="/contact"
            replace={false}
            className={`whitespace-nowrap transition-colors hover:text-secondary ${
              isContact ? "text-primary font-bold" : ""
            }`}
          >
            Contact
          </Link>
        </div>

        {/* Right: Actions */}
        <div className="hidden items-center gap-2 sm:gap-3 xl:gap-4 md:flex shrink-0">
          <Link
            href="/auth/customer/login"
            replace={false}
            className="whitespace-nowrap text-xs lg:text-sm font-bold text-ink/75 hover:text-secondary transition px-2.5 py-2"
          >
            Customer Portal
          </Link>

          <Link
            href="/auth/owner/login"
            replace={false}
            className="whitespace-nowrap inline-flex items-center justify-center rounded-full bg-[#F2765E] hover:bg-[#F2765E]/90 text-white font-medium text-xs lg:text-sm px-4 lg:px-5 py-2 lg:py-2.5 transition shadow-sm active:scale-95"
          >
            Merchant Login
          </Link>
        </div>

        {/* Mobile Hamburger Toggle (Ultra-lightweight, zero touch delay) */}
        <div className="flex xl:hidden">
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

      {/* Mobile Drawer (Hardware-accelerated, zero-lag for older budget devices) */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-b border-border bg-white px-6 py-6 shadow-xl transform-gpu transition-opacity duration-150">
          <div className="flex flex-col space-y-4 text-base font-bold text-ink/85">
            <Link
              href="/#how-it-works"
              replace={false}
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-secondary"
            >
              How It Works
            </Link>
            <Link
              href="/#for-shops"
              replace={false}
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-secondary"
            >
              For Shops
            </Link>
            <Link
              href="/pricing"
              replace={false}
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-secondary"
            >
              Pricing
            </Link>
            <Link
              href="/#faq"
              replace={false}
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-secondary"
            >
              FAQ
            </Link>
            <Link
              href="/about"
              replace={false}
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-secondary"
            >
              About
            </Link>
            <Link
              href="/contact"
              replace={false}
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-secondary"
            >
              Contact
            </Link>

            <div className="pt-4 border-t border-border flex flex-col gap-3">
              <Link
                href="/auth/customer/login"
                replace={false}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl bg-sand py-3 text-sm font-bold text-secondary border border-border"
              >
                <User className="h-4 w-4" />
                <span>Customer Portal</span>
              </Link>
              <Link
                href="/auth/owner/login"
                replace={false}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#F2765E] py-3 text-sm font-bold text-white shadow-sm"
              >
                <Store className="h-4 w-4" />
                <span>Merchant Login</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
