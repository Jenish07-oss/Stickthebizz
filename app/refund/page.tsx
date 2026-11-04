import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { RefreshCcw, ShieldCheck, CheckCircle2, HelpCircle } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Refund & Cancellation Policy — StickTheBizz",
  description: "Transparent 7-day money-back guarantee, acrylic standee replacement warranty, and subscription cancellation terms.",
};

export default function RefundPage() {
  return (
    <div className="flex min-h-screen flex-col bg-sand overflow-x-hidden">
      <Navbar />

      <main className="flex-1 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-white/80 px-4 py-1.5 font-mono text-xs font-bold text-primary shadow-sm">
              <RefreshCcw className="h-4 w-4" />
              FAIR PLAY GUARANTEE
            </div>
            <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-secondary sm:text-5xl">
              Refund &amp; Cancellation Policy
            </h1>
            <p className="mt-3 text-sm text-ink/70">
              Effective Date: November 2026 • StickTheBizz Technologies Pvt Ltd
            </p>
          </div>

          {/* Refund Content */}
          <div className="mt-12 space-y-8 rounded-[2.5rem] border border-border bg-white p-8 shadow-card sm:p-12 text-ink/80 leading-relaxed text-sm">
            {/* Guarantee Highlight */}
            <div className="rounded-2xl border border-secondary/20 bg-sand/40 p-6">
              <h2 className="font-display text-base font-extrabold text-secondary flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Our 7-Day Unconditional Money-Back Guarantee
              </h2>
              <p className="mt-2 text-xs font-medium text-ink/75 leading-relaxed">
                We want every chai stall, kirana shop, bakery, and cafe owner in Bharat to feel 100% confident.
                If you subscribe to the StickTheBizz <strong>₹499/month</strong> merchant plan and decide within your first 7 days that digital loyalty passes are not increasing your daily footfall, message our WhatsApp support for a <strong>100% full refund</strong> — no questions asked.
              </p>
            </div>

            {/* Section 1: Merchant SaaS Subscription */}
            <div>
              <h2 className="font-display text-xl font-extrabold text-secondary">
                1. Monthly Merchant SaaS Subscription (₹499/mo)
              </h2>
              <ul className="mt-3 space-y-2 text-xs">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  <span>
                    <strong>First 7 Days:</strong> Full refund upon request to <span className="font-mono text-secondary">support@stickthebizz.in</span> or via your registered merchant dashboard.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  <span>
                    <strong>After 7 Days:</strong> Subscriptions can be cancelled at any time before your next billing cycle. Once cancelled, your counter terminal and QR standee remain active until the end of your current paid month.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  <span>
                    <strong>No Lock-in Contracts:</strong> There are zero annual lock-ins, zero cancellation penalties, and zero surprise equipment return fees.
                  </span>
                </li>
              </ul>
            </div>

            {/* Section 2: Acrylic Counter Standee Replacement */}
            <div>
              <h2 className="font-display text-xl font-extrabold text-secondary">
                2. Counter Standee Hardware Warranty &amp; Replacement
              </h2>
              <p className="mt-2 text-xs">
                Your StickTheBizz counter standee is manufactured from durable 3mm laser-etched acrylic:
              </p>
              <ul className="mt-2 space-y-1.5 list-disc pl-5 text-xs text-ink/75">
                <li>
                  <strong>Transit Damage:</strong> If your acrylic standee arrives cracked, scratched, or illegible from postal courier delivery, send a photo to our WhatsApp line within <strong>14 days of delivery</strong> for an immediate free express replacement.
                </li>
                <li>
                  <strong>Counter Accidents:</strong> If chai, grease, or counter wear damages your standee after months of use, active subscribers can order a replacement standee at manufacturing cost (₹149 including shipping).
                </li>
              </ul>
            </div>

            {/* Section 3: Loyalty Rewards vs Platform Infrastructure */}
            <div>
              <h2 className="font-display text-xl font-extrabold text-secondary">
                3. Customer Loyalty Rewards &amp; Platform Role
              </h2>
              <p className="mt-2 text-xs leading-relaxed">
                StickTheBizz provides the digital tracking software and anti-fraud verification infrastructure. The physical rewards (e.g. Free Cutting Chai, ₹50 Kirana discount, Free Burger) are offered and fulfilled directly by the independent shop owner whose counter you visited.
              </p>
              <p className="mt-2 text-xs leading-relaxed">
                Because StickTheBizz does not collect retail purchase funds or sell food/beverage goods, reward disputes must be resolved with the respective merchant. Customers never pay any fee to use StickTheBizz digital passes.
              </p>
            </div>

            {/* Section 4: Refund Processing Timelines */}
            <div>
              <h2 className="font-display text-xl font-extrabold text-secondary">
                4. Processing Timelines &amp; Methods
              </h2>
              <p className="mt-2 text-xs leading-relaxed">
                Approved refunds are processed via original payment methods (UPI, Net Banking, or Debit Card) via RBI-compliant payment gateways within <strong>3 to 5 business days</strong>.
              </p>
            </div>

            {/* Support CTA */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl bg-sand/60 p-6 border border-border">
              <div>
                <h3 className="font-display font-bold text-secondary text-sm">Need help with a refund or billing question?</h3>
                <p className="text-xs text-ink/70">Our merchant care team responds within 2 hours on WhatsApp.</p>
              </div>
              <Link
                href="/contact"
                className="rounded-xl bg-secondary px-5 py-2.5 text-xs font-bold text-white transition hover:bg-secondary/90 shrink-0"
              >
                Contact Merchant Care
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
