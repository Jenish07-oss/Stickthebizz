import React from "react";
import Link from "next/link";
import { Sparkles, ShieldCheck, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-ink/10 bg-sand px-5 py-12 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 md:grid-cols-4">
          {/* Brand Info */}
          <div className="md:col-span-1">
            <Link
              href="/"
              target="_self"
              className="inline-flex items-center gap-2 font-display text-xl font-extrabold tracking-tight text-secondary"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-white">
                <Sparkles className="h-4 w-4" />
              </span>
              StickTheBizz<span className="text-primary">.</span>
            </Link>
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
                  href="/customer"
                  target="_self"
                  className="flex min-h-[48px] items-center text-sm font-semibold text-ink/70 transition hover:text-secondary"
                >
                  Customer Stamp Card
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
                  href="/#how-it-works"
                  target="_self"
                  className="flex min-h-[48px] items-center text-sm font-semibold text-ink/70 transition hover:text-secondary"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  target="_self"
                  className="flex min-h-[48px] items-center text-sm font-semibold text-ink/70 transition hover:text-secondary"
                >
                  Pricing Plans (₹199/mo)
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
                <span className="flex min-h-[48px] items-center text-xs text-ink/60">
                  Zero Customer Data Resale Guarantee
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-ink/10 pt-8 text-xs text-ink/60 sm:flex-row">
          <p>© {new Date().getFullYear()} StickTheBizz Technologies Pvt Ltd. All rights reserved.</p>
          <p className="flex items-center gap-1.5 font-medium">
            Crafted with <Heart className="h-3.5 w-3.5 text-primary fill-primary" /> &amp; cutting chai for Bharat&apos;s counters.
          </p>
        </div>
      </div>
    </footer>
  );
}
