import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FileText, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Terms of Service — StickTheBizz",
  description: "Terms and conditions for shop owners and customers using StickTheBizz.in loyalty platform.",
};

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-sand overflow-x-hidden">
      <Navbar />

      <main className="flex-1 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-white/80 px-4 py-1.5 font-mono text-xs font-bold text-secondary shadow-sm">
              <FileText className="h-4 w-4 text-primary" />
              MERCHANT &amp; USER AGREEMENT
            </div>
            <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-secondary sm:text-5xl">
              Terms of Service
            </h1>
            <p className="mt-3 text-sm text-ink/70">
              Effective Date: November 2026
            </p>
          </div>

          {/* Terms Content */}
          <div className="mt-12 space-y-8 rounded-[2.5rem] border border-border bg-white p-8 shadow-card sm:p-12 text-ink/80 leading-relaxed text-sm">
            <div>
              <h2 className="font-display text-xl font-extrabold text-secondary">
                1. Acceptance of Terms
              </h2>
              <p className="mt-2">
                By accessing StickTheBizz.in, creating a merchant terminal, or collecting digital punch stamps, you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you must discontinue using our services.
              </p>
            </div>

            <div>
              <h2 className="font-display text-xl font-extrabold text-secondary">
                2. Shop Owner Responsibilities &amp; Fair Play
              </h2>
              <p className="mt-2">
                Shop owners agree to the following operational standards:
              </p>
              <ul className="mt-2 space-y-1.5 list-disc pl-5">
                <li>
                  <strong>Reward Honor Guarantee:</strong> When a customer legitimately earns and presents a verified 4-digit PIN reward ticket (`STB-7Q4K-XX`), the merchant must honor the stated reward without hidden conditions or surprise fees.
                </li>
                <li>
                  <strong>Fair Counter Placement:</strong> Counter QR codes must be placed where paying customers can legitimately scan them at the cashier desk.
                </li>
                <li>
                  <strong>Prohibition of Data Harvesting:</strong> Merchants may not attempt to extract, scrape, or resell masked customer directories.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="font-display text-xl font-extrabold text-secondary">
                3. Subscription Fees &amp; Cancellation Policy
              </h2>
              <p className="mt-2">
                StickTheBizz offers a free trial tier for the first 50 registered customer scans. Following the trial, our standard plan is billed at <strong>₹199 per month</strong> (inclusive of applicable GST).
              </p>
              <div className="mt-3 rounded-2xl bg-sand/40 p-4">
                <p className="flex items-center gap-2 font-bold text-secondary">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  No Long-Term Lock-In
                </p>
                <p className="mt-1 text-xs text-ink/70">
                  You can pause or cancel your subscription at any time with one click. Your counter QR code will remain active until the end of your current paid billing period.
                </p>
              </div>
            </div>

            <div>
              <h2 className="font-display text-xl font-extrabold text-secondary">
                4. Fraud Prevention &amp; Account Termination
              </h2>
              <p className="mt-2">
                We employ automated velocity checks (including our proprietary 12-hour midnight lock). Any merchant or customer found using bots, automated clicking scripts, or fraudulent OTP generators will have their account immediately suspended.
              </p>
            </div>

            <div>
              <h2 className="font-display text-xl font-extrabold text-secondary">
                5. Limitation of Liability &amp; Dispute Resolution
              </h2>
              <p className="mt-2">
                StickTheBizz provides the software platform connecting merchants and customers. Any direct disputes regarding merchandise quality, food hygiene, or customer service at individual physical shops are the sole responsibility of the merchant.
              </p>
              <p className="mt-2">
                All legal disputes are subject to the exclusive jurisdiction of the courts of Bengaluru, Karnataka, India.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
