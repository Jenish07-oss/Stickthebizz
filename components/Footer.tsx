"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShieldCheck, Heart, Share2, X, ExternalLink } from "lucide-react";
import Logo from "@/components/Logo";

export default function Footer() {
  const [socialsOpen, setSocialsOpen] = useState(false);

  const socials = [
    {
      name: "Instagram",
      handle: "@stickthebizz",
      url: "https://www.instagram.com/stickthebizz?dlrf=MW02Ynhub2YwbTlidg==",
      color: "from-purple-500 via-pink-500 to-amber-500",
      description: "Daily counter highlights, new shop launches, and customer stories.",
    },
    {
      name: "Reddit",
      handle: "u/sadcozsomethinhbad",
      url: "https://www.reddit.com/u/sadcozsomethinhbad/s/CogUjQdDLq",
      color: "from-orange-500 to-red-600",
      description: "Founder updates, retail loyalty discussions, and community Q&A.",
    },
    {
      name: "X (formerly Twitter)",
      handle: "@StickTheBizz",
      url: "https://x.com/StickTheBizz",
      color: "from-slate-900 to-slate-800",
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
                  className="flex min-h-[48px] items-center text-sm font-semibold text-ink/70 transition hover:text-secondary"
                >
                  Customer Pass Wallet
                </Link>
              </li>
              <li>
                <Link
                  href="/owner"
                  target="_self"
                  className="flex min-h-[48px] items-center text-sm font-semibold text-ink/70 transition hover:text-secondary"
                >
                  Shop Owner Terminal
                </Link>
              </li>
              <li>
                <Link
                  href="/how-it-works"
                  target="_self"
                  className="flex min-h-[48px] items-center text-sm font-semibold text-ink/70 transition hover:text-secondary"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  href="/#pricing"
                  target="_self"
                  className="flex min-h-[48px] items-center text-sm font-semibold text-ink/70 transition hover:text-secondary"
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
                  className="flex min-h-[48px] items-center text-sm font-semibold text-ink/70 transition hover:text-secondary"
                >
                  About Our Mission
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  target="_self"
                  className="flex min-h-[48px] items-center text-sm font-semibold text-ink/70 transition hover:text-secondary"
                >
                  Merchant Support &amp; WhatsApp
                </Link>
              </li>
              <li>
                <Link
                  href="/#faq"
                  target="_self"
                  className="flex min-h-[48px] items-center text-sm font-semibold text-ink/70 transition hover:text-secondary"
                >
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setSocialsOpen(true)}
                  className="flex min-h-[48px] items-center gap-1.5 text-sm font-semibold text-primary transition hover:text-secondary text-left group"
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
                  className="flex min-h-[48px] items-center text-sm font-semibold text-ink/70 transition hover:text-secondary"
                >
                  Privacy Policy (DPDP)
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  target="_self"
                  className="flex min-h-[48px] items-center text-sm font-semibold text-ink/70 transition hover:text-secondary"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/refund"
                  target="_self"
                  className="flex min-h-[48px] items-center text-sm font-semibold text-ink/70 transition hover:text-secondary"
                >
                  Refund Policy (7-Day Guarantee)
                </Link>
              </li>
              <li>
                <Link
                  href="/grievance"
                  target="_self"
                  className="flex min-h-[48px] items-center text-sm font-semibold text-ink/70 transition hover:text-secondary"
                >
                  DPDP Grievance Redressal
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Legal Credit */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-ink/10 pt-8 sm:flex-row">
          <p className="text-xs text-ink/60">
            &copy; 2026 StickTheBizz Technologies Pvt Ltd. Made with{" "}
            <Heart className="inline h-3.5 w-3.5 fill-primary text-primary" /> in Surat &amp; Bengaluru, Bharat.
          </p>
          <div className="flex items-center gap-4 text-xs font-semibold text-ink/60">
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
                    Follow StickTheBizz official channels
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
