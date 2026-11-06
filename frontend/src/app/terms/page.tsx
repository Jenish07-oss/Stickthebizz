import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FileText } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Terms of Service — StickTheBizz",
  description: "Terms and conditions for merchants and customers using StickTheBizz digital loyalty passes.",
};

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-sand overflow-x-hidden">
      <Navbar />

      <main className="flex-1 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-white/80 px-4 py-1.5 font-mono text-xs font-bold text-primary shadow-sm">
              <FileText className="h-4 w-4" />
              BINDING AGREEMENT
            </div>
            <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-secondary sm:text-5xl">
              Terms of Service
            </h1>
            <p className="mt-3 text-sm text-ink/70">
              Last Updated: November 2026 • StickTheBizz Pvt Ltd
            </p>
          </div>

          {/* Terms Content */}
          <div className="mt-12 space-y-8 rounded-[2.5rem] border border-border bg-white p-8 shadow-card sm:p-12 text-ink/80 leading-relaxed text-sm">
            <div>
              <h2 className="font-display text-xl font-extrabold text-secondary">
                1. Acceptance of Terms
              </h2>
              <p className="mt-2">
                By generating a digital loyalty pass, scanning a counter QR code, or registering as a merchant on StickTheBizz, you agree to comply with and be bound by these Terms of Service. If you do not agree, please do not access or use our services.
              </p>
            </div>

            <div>
              <h2 className="font-display text-xl font-extrabold text-secondary">
                2. Merchant Commitments
              </h2>
              <p className="mt-2">
                Shop owners registering their counter terminal must adhere to fair business practices:
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
                3. Fraud Prevention &amp; Account Termination
              </h2>
              <p className="mt-2">
                We employ automated velocity checks (including our proprietary 12-hour midnight lock). Any merchant or customer found using bots, automated clicking scripts, or fraudulent OTP generators will have their account immediately suspended.
              </p>
            </div>

            <div>
              <h2 className="font-display text-xl font-extrabold text-secondary">
                4. Limitation of Liability &amp; Dispute Resolution
              </h2>
              <p className="mt-2">
                StickTheBizz provides the software platform connecting merchants and customers. Any direct disputes regarding merchandise quality, food hygiene, or customer service at individual physical shops are the sole responsibility of the merchant.
              </p>
              <p className="mt-2">
                All legal disputes are subject to the exclusive jurisdiction of the competent courts of India.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
