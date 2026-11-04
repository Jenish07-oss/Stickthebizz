import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ShieldCheck, Mail, MapPin, Clock, FileCheck } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Grievance Redressal & DPDP Officer — StickTheBizz",
  description: "Statutory data protection grievance officer and contact details per India Digital Personal Data Protection Act 2023.",
};

export default function GrievancePage() {
  return (
    <div className="flex min-h-screen flex-col bg-sand overflow-x-hidden">
      <Navbar />

      <main className="flex-1 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-success/30 bg-white/80 px-4 py-1.5 font-mono text-xs font-bold text-success shadow-sm">
              <ShieldCheck className="h-4 w-4" />
              STATUTORY COMPLIANCE • SECTION 13 DPDP ACT 2023
            </div>
            <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-secondary sm:text-5xl">
              Grievance Redressal &amp; Data Protection
            </h1>
            <p className="mt-3 text-sm text-ink/70">
              Direct point of contact for customer rights, data concerns, and privacy inquiries.
            </p>
          </div>

          {/* Grievance Details Card */}
          <div className="mt-12 space-y-8 rounded-[2.5rem] border border-border bg-white p-8 shadow-card sm:p-12 text-ink/80 leading-relaxed text-sm">
            <div>
              <h2 className="font-display text-xl font-extrabold text-secondary">
                Data Protection Officer (DPO) &amp; Grievance Redressal
              </h2>
              <p className="mt-2 text-xs text-ink/75">
                In compliance with the <strong>Digital Personal Data Protection (DPDP) Act 2023</strong> and the <strong>Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules 2021</strong>, the details of our designated Grievance Officer are set forth below:
              </p>
            </div>

            {/* Officer Details Box */}
            <div className="grid gap-4 sm:grid-cols-2 rounded-2xl border border-secondary/20 bg-sand/40 p-6 text-xs">
              <div className="space-y-1">
                <span className="font-bold text-ink/50 uppercase tracking-wider text-[10px]">Appointed Officer</span>
                <p className="font-display text-base font-extrabold text-secondary">Jenish Patel</p>
                <p className="text-ink/70">Data Protection &amp; Compliance Lead</p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-ink/50 uppercase tracking-wider text-[10px]">Direct Electronic Contact</span>
                <p className="flex items-center gap-2 font-mono font-bold text-secondary text-sm">
                  <Mail className="h-4 w-4 text-primary" />
                  grievance@stickthebizz.in
                </p>
                <p className="text-ink/60">Monitored daily with priority escalation</p>
              </div>

              <div className="space-y-1 sm:col-span-2 pt-2 border-t border-border/60">
                <span className="font-bold text-ink/50 uppercase tracking-wider text-[10px]">Registered Postal Address</span>
                <p className="flex items-start gap-2 text-ink/80">
                  <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>StickTheBizz Technologies Pvt Ltd, 4th Floor, Tech Hub Tower, Ring Road, Surat, Gujarat 395002, India.</span>
                </p>
              </div>
            </div>

            {/* Resolution SLA */}
            <div>
              <h3 className="font-display text-base font-bold text-secondary flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Statutory Resolution SLA &amp; Timeline
              </h3>
              <ul className="mt-2 space-y-1.5 list-disc pl-5 text-xs text-ink/75">
                <li>
                  <strong>Acknowledgment:</strong> Within <strong>24 hours</strong> of receiving your electronic grievance.
                </li>
                <li>
                  <strong>Resolution:</strong> Formal redressal and resolution within <strong>15 business days</strong> (our internal operational target is <strong>48 hours</strong>).
                </li>
                <li>
                  <strong>Data Erasure Requests:</strong> If you requested deletion via email rather than the self-service dashboard, our team will process complete anonymization within <strong>48 hours</strong> and issue written confirmation.
                </li>
              </ul>
            </div>

            {/* Regulatory Recourse */}
            <div className="rounded-2xl border border-border bg-sand/20 p-5 text-xs text-ink/70">
              <h4 className="font-bold text-secondary flex items-center gap-1.5">
                <FileCheck className="h-4 w-4 text-success" />
                Regulatory Recourse
              </h4>
              <p className="mt-1 leading-relaxed">
                If your grievance regarding personal data handling is not resolved to your satisfaction through our internal redressal mechanism, you have the statutory right under Section 13 of the DPDP Act 2023 to submit a complaint directly to the <strong>Data Protection Board of India</strong>.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

