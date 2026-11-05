"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShieldCheck, Share2, X, ExternalLink } from "lucide-react";
import Logo from "@/components/Logo";

export default function Footer() {
  const [socialsOpen, setSocialsOpen] = useState(false);

  const socials = [
    {
      name: "Instagram",
      handle: "@stickthebizz",
      url: "https://www.instagram.com/stickthebizz?dlrf=MW02Ynhub2YwbTlidg==",
      description: "Daily counter highlights, new shop launches, and customer stories.",
    },
    {
      name: "Reddit",
      handle: "u/sadcozsomethinhbad",
      url: "https://www.reddit.com/u/sadcozsomethinhbad/s/CogUjQdDLq",
      description: "Founder updates, retail loyalty discussions, and community Q&A.",
    },
    {
      name: "X (formerly Twitter)",
      handle: "@StickTheBizz",
      url: "https://x.com/StickTheBizz",
      description: "Product updates, feature drops, and live SaaS metrics.",
    },
  ];

  return (
    <footer className="mt-20 border-t border-ink/10 bg-sand px-5 py-12 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 md:grid-cols-4">
          {/* Brand Info */}
          <div className="md:col-span-1">
            <Logo href="/" size="md" />
            <p className="mt-4 text-sm leading-relaxed text-ink/75">
              Empowering India&apos;s chai stalls, bakeries, cafes, and local stores with simple digital punch cards. No customer app downloads required.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-secondary">
              <ShieldCheck className="h-4 w-4 text-success" />
              DPDP Act 2023 Compliant
            </div>
          </div>

          {/* Product Navigation */}
          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-secondary">
              Product
            </h3>
            <ul className="mt-4 space-y-1">
              <li>
                <Link
                  href="/customer/dashboard"
                  target="_self"
                  className="flex min-h-[44px] items-center text-sm font-semibold text-ink/70 transition hover:text-secondary"
                >
                  Customer Pass Wallet
                </Link>
              </li>
              <li>
                <Link
                  href="/owner"
                  target="_self"
                  className="flex min-h-[44px] items-center text-sm font-semibold text-ink/70 transition hover:text-secondary"
                >
                  Shop Owner Terminal
                </Link>
              </li>
              <li>
                <Link
                  href="/how-it-works"
                  target="_self"
                  className="flex min-h-[44px] items-center text-sm font-semibold text-ink/70 transition hover:text-secondary"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  href="/#pricing"
                  target="_self"
                  className="flex min-h-[44px] items-center text-sm font-semibold text-ink/70 transition hover:text-secondary"
                >
                  Pricing Plan (₹749/mo)
                </Link>
              </li>
            </ul>
          </div>

          {/* Company & Support */}
          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-secondary">
              Company
            </h3>
            <ul className="mt-4 space-y-1">
              <li>
                <Link
                  href="/about"
                  target="_self"
                  className="flex min-h-[44px] items-center text-sm font-semibold text-ink/70 transition hover:text-secondary"
                >
                  About Our Mission
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  target="_self"
                  className="flex min-h-[44px] items-center text-sm font-semibold text-ink/70 transition hover:text-secondary"
                >
                  Merchant Support Desk
                </Link>
              </li>
              <li>
                <Link
                  href="/#faq"
                  target="_self"
                  className="flex min-h-[44px] items-center text-sm font-semibold text-ink/70 transition hover:text-secondary"
                >
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setSocialsOpen(true)}
                  className="flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-primary transition hover:text-secondary text-left group"
                >
                  <span>Our Socials</span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary group-hover:bg-primary group-hover:text-white transition">
                    Connect
                  </span>
                </button>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-secondary">
              Legal &amp; Trust
            </h3>
            <ul className="mt-4 space-y-1">
              <li>
                <Link
                  href="/privacy"
                  target="_self"
                  className="flex min-h-[44px] items-center text-sm font-semibold text-ink/70 transition hover:text-secondary"
                >
                  Privacy Policy (DPDP)
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  target="_self"
                  className="flex min-h-[44px] items-center text-sm font-semibold text-ink/70 transition hover:text-secondary"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/grievance"
                  target="_self"
                  className="flex min-h-[44px] items-center text-sm font-semibold text-ink/70 transition hover:text-secondary"
                >
                  DPDP Grievance Redressal
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Elegant Bottom Bar with Direct Social Media Symbols */}
        <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-ink/10 pt-8">
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <p className="text-xs font-semibold text-ink/75">
              &copy; {new Date().getFullYear()} StickTheBizz Pvt Ltd. All rights reserved.
            </p>
            <span className="hidden sm:inline text-ink/30">•</span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-secondary">
              <ShieldCheck className="h-3.5 w-3.5 text-success" />
              <span>DPDP Act 2023 Compliant</span>
            </div>
          </div>

          {/* Direct Social Media Clickable Symbols */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink/50 mr-0.5">
              Follow Us:
            </span>

            {/* Instagram Symbol */}
            <a
              href="https://www.instagram.com/stickthebizz?dlrf=MW02Ynhub2YwbTlidg=="
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow StickTheBizz on Instagram"
              className="grid h-9 w-9 place-items-center rounded-xl bg-white border border-border text-ink/70 shadow-xs transition hover:text-pink-600 hover:border-pink-300 hover:scale-110 active:scale-95"
              title="Instagram: @stickthebizz"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>

            {/* Reddit Symbol */}
            <a
              href="https://www.reddit.com/u/sadcozsomethinhbad/s/CogUjQdDLq"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Join StickTheBizz community on Reddit"
              className="grid h-9 w-9 place-items-center rounded-xl bg-white border border-border text-ink/70 shadow-xs transition hover:text-orange-600 hover:border-orange-300 hover:scale-110 active:scale-95"
              title="Reddit: u/sadcozsomethinhbad"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.702zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.197-2.512-.73a.326.326 0 0 0-.232-.095z" />
              </svg>
            </a>

            {/* X (formerly Twitter) Symbol */}
            <a
              href="https://x.com/StickTheBizz"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow StickTheBizz on X"
              className="grid h-9 w-9 place-items-center rounded-xl bg-white border border-border text-ink/70 shadow-xs transition hover:text-black hover:border-black/50 hover:scale-110 active:scale-95"
              title="X: @StickTheBizz"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold text-ink/60">
            <span>ISO/IEC 27001 Ready</span>
            <span>&bull;</span>
            <span>100% Data Stored in India</span>
          </div>
        </div>
      </div>

      {/* Socials Modal / Dialog */}
      {socialsOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setSocialsOpen(false)}
        >
          <div
            className="relative w-full max-w-md rounded-3xl border border-border bg-white p-6 shadow-2xl sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Share2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-extrabold text-secondary">
                    Our Socials
                  </h3>
                  <p className="text-xs text-ink/65">
                    Official verified channels for StickTheBizz
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSocialsOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full text-ink/50 hover:bg-sand hover:text-ink transition"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {socials.map((item) => (
                <a
                  key={item.name}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between rounded-2xl border border-border bg-sand/30 p-4 transition-all hover:border-primary/50 hover:bg-sand/60 hover:shadow-sm"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-sm font-bold text-secondary group-hover:text-primary transition-colors">
                        {item.name}
                      </span>
                      <span className="font-mono text-[11px] font-semibold text-ink/60">
                        {item.handle}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-ink/70 leading-snug">
                      {item.description}
                    </p>
                  </div>
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white border border-border text-ink/60 group-hover:bg-primary group-hover:text-white transition-all shadow-2xs">
                    <ExternalLink className="h-4 w-4" />
                  </div>
                </a>
              ))}
            </div>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setSocialsOpen(false)}
                className="w-full rounded-xl bg-secondary py-2.5 text-xs font-bold text-white transition hover:bg-secondary/90"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
