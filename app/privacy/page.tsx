import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ShieldCheck, Lock, CheckCircle, Trash2 } from "lucide-react";

export const metadata = {
  title: "Privacy Policy & DPDP Compliance — StickTheBizz",
  description: "Plain-English privacy policy adhering strictly to India's Digital Personal Data Protection (DPDP) Act 2023.",
};

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-sand overflow-x-hidden">
      <Navbar />

      <main className="flex-1 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-success/30 bg-white/80 px-4 py-1.5 font-mono text-xs font-bold text-success shadow-sm">
              <ShieldCheck className="h-4 w-4" />
              DPDP ACT 2023 COMPLIANT
            </div>
            <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-secondary sm:text-5xl">
              Privacy Policy &amp; Customer Rights
            </h1>
            <p className="mt-3 text-sm text-ink/70">
              Last updated: November 2026 • Effective for all StickTheBizz.in users
            </p>
          </div>

          {/* Privacy Document Content */}
          <div className="mt-12 space-y-8 rounded-[2.5rem] border border-border bg-white p-8 shadow-card sm:p-12 text-ink/80 leading-relaxed text-sm">
            {/* Quick Summary Pill Box */}
            <div className="rounded-2xl border border-secondary/20 bg-sand/40 p-6">
              <h2 className="font-display text-base font-extrabold text-secondary flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                The StickTheBizz Privacy Promise in Plain English
              </h2>
              <ul className="mt-3 space-y-2 text-xs font-medium text-ink/75">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  We <strong>never sell, rent, or trade</strong> your phone number or email address.
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  Your phone number is strictly used to track stamps for the specific store you scanned.
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  Store owners only see masked numbers (e.g. <span className="font-mono">98***12</span>) in their dashboard.
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  You have the legal right to delete all your visit history at any time.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="font-display text-xl font-extrabold text-secondary">
                1. Data We Collect &amp; Why
              </h2>
              <p className="mt-2">
                To issue digital stamps and verify rewards, we collect the following minimal data:
              </p>
              <ul className="mt-2 list-disc pl-5 space-y-1">
                <li>
                  <strong>Phone Number or Email Address:</strong> Provided by you upon initial punch card creation to associate your stamps.
                </li>
                <li>
                  <strong>Visit Timestamps:</strong> The exact date and time you scan a counter QR code, used for the 12-hour anti-fraud lock and streak tracking.
                </li>
                <li>
                  <strong>Customer Feedback:</strong> Voluntary star ratings and brief comments you choose to leave for the shop owner.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="font-display text-xl font-extrabold text-secondary">
                2. Consent-First Processing
              </h2>
              <p className="mt-2">
                Under the Indian Digital Personal Data Protection (DPDP) Act 2023, data processing must be explicitly consented to. When you first enter your mobile number or email, you give specific consent to allow that designated merchant to record your visit frequency. You may revoke this consent at any time.
              </p>
            </div>

            <div>
              <h2 className="font-display text-xl font-extrabold text-secondary">
                3. Anti-Spam &amp; Rate Limiting Architecture
              </h2>
              <p className="mt-2">
                To protect our users and infrastructure:
              </p>
              <ul className="mt-2 list-disc pl-5 space-y-1">
                <li>One-Time Passwords (OTPs) are limited to 3 requests per 5 minutes per IP or phone number.</li>
                <li>We do not send unsolicited marketing SMS or commercial broadcast messages.</li>
                <li>All network communications are encrypted in transit using industry-standard TLS 1.3.</li>
              </ul>
            </div>

            <div>
              <h2 className="font-display text-xl font-extrabold text-secondary">
                4. Your Right to Account Deletion (Right to be Forgotten)
              </h2>
              <p className="mt-2">
                You hold complete ownership of your personal data. If you wish to permanently delete your phone number, stamp history, and reward tickets from StickTheBizz, you can request an instant erasure:
              </p>

              <div className="mt-4 rounded-2xl border border-coral/30 bg-coral/5 p-5">
                <div className="flex items-start gap-3">
                  <Trash2 className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-bold text-secondary">
                      Request Instant Data Deletion
                    </h3>
                    <p className="mt-1 text-xs text-ink/70">
                      Send an email with the subject <em>&ldquo;DPDP Data Deletion Request&rdquo;</em> to{" "}
                      <a
                        href="mailto:privacy@stickthebizz.in"
                        className="font-bold text-primary underline"
                      >
                        privacy@stickthebizz.in
                      </a>{" "}
                      or contact our Data Grievance Officer directly via WhatsApp. Your record will be wiped within 48 business hours.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="font-display text-xl font-extrabold text-secondary">
                5. Contacting Our Data Protection Officer
              </h2>
              <p className="mt-2">
                For questions regarding DPDP compliance or data safety:
              </p>
              <p className="mt-1 font-mono text-xs text-secondary">
                Data Grievance Officer, StickTheBizz Technologies Pvt Ltd<br />
                Email: privacy@stickthebizz.in<br />
                Address: Bengaluru, Karnataka, India
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
