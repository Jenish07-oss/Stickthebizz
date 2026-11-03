import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { Sparkles, Heart, Store, Shield, ArrowRight } from "lucide-react";

export const metadata = {
  title: "About Us — StickTheBizz",
  description: "Empowering India's unorganized retail sector without expensive hardware.",
};

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-sand overflow-x-hidden">
      <Navbar />

      <main className="flex-1 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {/* Badge & Title */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-white/70 px-4 py-1.5 font-mono text-xs font-bold text-secondary">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              OUR MISSION &amp; STORY
            </div>
            <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-secondary sm:text-5xl">
              Powering Bharat&apos;s Counters With Simple Habit Loops.
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-ink/75">
              We believe local tea stalls, bakeries, cafes, and corner kirana stores are the true heart of Indian commerce.
            </p>
          </div>

          {/* Story Narrative */}
          <div className="mt-12 space-y-8 rounded-[2.5rem] border border-border bg-white p-8 shadow-card sm:p-12 text-ink/80 leading-relaxed">
            <div>
              <h2 className="font-display text-2xl font-extrabold text-secondary">
                The Problem: Bloated Apps &amp; Expensive Hardware
              </h2>
              <p className="mt-3 text-base">
                For years, retail loyalty software was designed exclusively for luxury international chains with massive IT departments and ₹50,000 POS machines. When local Indian shops tried loyalty programs, they were told to force customers to download 80MB apps, enter long OTPs, or install complex tablet hardware.
              </p>
              <p className="mt-3 text-base">
                Result? <strong>Nobody used them.</strong> Customers walked away without downloading apps, and counters returned to lost paper punch cards.
              </p>
            </div>

            <div className="border-t border-border/80 pt-8">
              <h2 className="font-display text-2xl font-extrabold text-secondary">
                The StickTheBizz Breakthrough
              </h2>
              <p className="mt-3 text-base">
                StickTheBizz is built on one simple truth: <em>the best loyalty program is invisible until the customer wants to celebrate.</em>
              </p>
              <p className="mt-3 text-base">
                By pairing a simple counter QR code with browser-based digital stamp cards, customers scan in 2 seconds using their native camera. No apps, no passwords, no hassle.
              </p>
            </div>

            {/* Core Values */}
            <div className="border-t border-border/80 pt-8">
              <h2 className="font-display text-2xl font-extrabold text-secondary">
                Our 3 Unshakeable Guarantees
              </h2>

              <div className="mt-6 grid gap-6 sm:grid-cols-3">
                <div className="rounded-2xl bg-sand/40 p-5">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-white">
                    <Store className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-display text-base font-extrabold text-secondary">
                    Counter-First
                  </h3>
                  <p className="mt-2 text-xs text-ink/70">
                    Works on any phone or tabletop stand. Zero complex setup or extra hardware required.
                  </p>
                </div>

                <div className="rounded-2xl bg-sand/40 p-5">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-white">
                    <Shield className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-display text-base font-extrabold text-secondary">
                    Privacy Guaranteed
                  </h3>
                  <p className="mt-2 text-xs text-ink/70">
                    Strict adherence to India&apos;s DPDP Act. We never sell or share customer phone numbers.
                  </p>
                </div>

                <div className="rounded-2xl bg-sand/40 p-5">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-warning text-white">
                    <Heart className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-display text-base font-extrabold text-secondary">
                    Always Affordable
                  </h3>
                  <p className="mt-2 text-xs text-ink/70">
                    Free for the first 50 customers, then just ₹199/month. Accessible to every small business.
                  </p>
                </div>
              </div>
            </div>

            {/* CTA Box */}
            <div className="mt-8 rounded-2xl bg-secondary p-6 text-white sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="font-display text-xl font-extrabold">
                  Ready to test it at your counter?
                </h3>
                <p className="mt-1 text-xs text-white/80">
                  Launch in under 3 minutes with our free trial.
                </p>
              </div>
              <Link
                href="/owner"
                className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-white transition hover:bg-white hover:text-secondary shadow-sm"
              >
                Open Shop Terminal
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

