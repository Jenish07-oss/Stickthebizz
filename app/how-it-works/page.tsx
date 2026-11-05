import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import {
  QrCode,
  Smartphone,
  CheckCircle2,
  Gift,
  ArrowRight,
  ShieldCheck,
  Zap,
  Clock,
  Sparkles,
  Store,
} from "lucide-react";

export const metadata = {
  title: "How It Works — StickTheBizz Digital Loyalty Pass",
  description: "See how StickTheBizz turns one-time walk-in diners and shoppers into loyal daily repeat regulars without app downloads.",
};

export default function HowItWorksPage() {
  const steps = [
    {
      step: "01",
      title: "Place Your Standee on the Counter",
      subtitle: "Takes 30 seconds. Zero hardware or POS integration needed.",
      desc: "Every shop receives a counter QR standee with an anti-fraud dynamic token. Simply set it beside your cashier counter or UPI scanner where customers pay their bill.",
      icon: Store,
      badge: "For Shop Owners",
      color: "bg-primary/10 text-primary border-primary/20",
    },
    {
      step: "02",
      title: "Customer Scans with Phone Camera",
      subtitle: "Instant pass opens in default browser. Zero app downloads.",
      desc: "Your diner or customer points their phone camera at the standee. Their digital loyalty pass opens instantly. If they already have an account, their visit is automatically recognized.",
      icon: Smartphone,
      badge: "For Customers",
      color: "bg-secondary/10 text-secondary border-secondary/20",
    },
    {
      step: "03",
      title: "1-Tap Cashier Terminal Approval",
      subtitle: "Live audio chime stream prevents fake or duplicate scans.",
      desc: "When a customer punches their visit, the merchant terminal chimes with a soft acoustic notification. The cashier taps '1-Tap Approve'. Our anti-fraud lock enforces strictly 1 stamp per day until midnight IST.",
      icon: CheckCircle2,
      badge: "Anti-Fraud Protocol",
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    {
      step: "04",
      title: "Collect Reward with 4-Digit Voucher PIN",
      subtitle: "Milestone streak reached = Free item claimed at counter.",
      desc: "After completing required visits (e.g., 5 or 10 visits), the customer unlocks a verified reward ticket. The cashier enters their 4-digit PIN on the terminal to mark the reward redeemed.",
      icon: Gift,
      badge: "Repeat Revenue",
      color: "bg-amber-50 text-amber-800 border-amber-200",
    },
  ];

  const comparison = [
    { feature: "Customer app download", paper: "None", apps: "Mandatory (50MB+)", stb: "Zero App Download (Web Pass)" },
    { feature: "Lost cards & discarded stamps", paper: "High (80% lost)", apps: "None", stb: "Saved in Cloud & Mobile Wallet" },
    { feature: "Fake / Self-stamp fraud", paper: "Common", apps: "Low", stb: "12-Hour Midnight IST Lock" },
    { feature: "Monthly cost for shop owner", paper: "₹300+ printing", apps: "₹3,000–₹10,000/mo", stb: "Flat ₹749/mo (Zero Commission)" },
    { feature: "Setup time", paper: "1-2 weeks", apps: "Days / POS API", stb: "Live in Under 3 Minutes" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-sand overflow-x-hidden">
      <Navbar />

      <main className="flex-1 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          {/* Hero */}
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-white/90 px-4 py-1.5 font-mono text-xs font-bold text-primary shadow-xs">
              <Sparkles className="h-3.5 w-3.5" />
              SIMPLE • ZERO APP DOWNLOAD • FRAUD-PROOF
            </span>
            <h1 className="mt-5 font-display text-4xl font-extrabold tracking-tight text-secondary sm:text-5xl lg:text-6xl">
              How StickTheBizz Works
            </h1>
            <p className="mt-4 text-base text-ink/75 leading-relaxed">
              Replace discarded paper stamp cards with a friction-free digital streak pass. Customers scan your counter standee with their phone camera, you 1-tap approve, and they return daily.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/owner"
                className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-white shadow-sm transition hover:bg-secondary active:scale-95"
              >
                Launch at Your Shop
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/customer/dashboard"
                className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-border bg-white px-6 text-sm font-bold text-secondary shadow-xs transition hover:bg-sand/40"
              >
                View Customer Passes
              </Link>
            </div>
          </div>

          {/* 4 Steps Grid */}
          <div className="mt-20">
            <div className="text-center mb-12">
              <h2 className="font-display text-2xl font-extrabold text-secondary sm:text-3xl">
                4 Effortless Steps from Walk-in to Regular
              </h2>
              <p className="mt-2 text-xs text-ink/70">
                Designed specifically for high-velocity Indian retail counters.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {steps.map((s) => {
                const IconComponent = s.icon;
                return (
                  <div
                    key={s.step}
                    className="flex flex-col justify-between rounded-3xl border border-border bg-white p-7 shadow-card transition-all hover:shadow-md hover:border-primary/40"
                  >
                    <div>
                      <div className="flex items-center justify-between border-b border-border/70 pb-4">
                        <div className="flex items-center gap-3">
                          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-sand text-secondary font-mono text-base font-extrabold">
                            {s.step}
                          </span>
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-bold ${s.color}`}>
                            {s.badge}
                          </span>
                        </div>
                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-sand/60 text-secondary">
                          <IconComponent className="h-5 w-5" />
                        </div>
                      </div>

                      <h3 className="mt-5 font-display text-lg font-extrabold text-secondary">
                        {s.title}
                      </h3>
                      <p className="mt-1 text-xs font-bold text-primary">
                        {s.subtitle}
                      </p>
                      <p className="mt-3 text-xs text-ink/75 leading-relaxed">
                        {s.desc}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-border/50 flex items-center gap-2 text-[11px] font-semibold text-secondary">
                      <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                      <span>Zero customer friction • Instant feedback</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Comparison Table */}
          <div className="mt-20 rounded-[2.5rem] border border-border bg-white p-8 shadow-card sm:p-12">
            <div className="text-center max-w-xl mx-auto">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sand px-3 py-1 font-mono text-xs font-bold text-secondary">
                WHY IT WINS
              </span>
              <h2 className="mt-3 font-display text-2xl font-extrabold text-secondary sm:text-3xl">
                Paper Cards vs Heavy Apps vs StickTheBizz
              </h2>
              <p className="mt-2 text-xs text-ink/70">
                Why 95% of retail loyalty apps fail, and why lightweight digital passes succeed.
              </p>
            </div>

            <div className="mt-8 overflow-x-auto">
              <table className="w-full text-left text-xs text-ink/80">
                <thead className="border-b border-border bg-sand/40 text-[11px] font-bold uppercase tracking-wider text-secondary">
                  <tr>
                    <th className="px-5 py-3.5">Metric</th>
                    <th className="px-5 py-3.5 text-ink/60">Paper Stamp Cards</th>
                    <th className="px-5 py-3.5 text-ink/60">Complex Loyalty Apps</th>
                    <th className="px-5 py-3.5 text-primary bg-primary/5">StickTheBizz Digital Pass</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 font-semibold">
                  {comparison.map((row) => (
                    <tr key={row.feature} className="hover:bg-sand/20 transition-colors">
                      <td className="px-5 py-3.5 font-display font-bold text-secondary">
                        {row.feature}
                      </td>
                      <td className="px-5 py-3.5 text-ink/60">{row.paper}</td>
                      <td className="px-5 py-3.5 text-ink/60">{row.apps}</td>
                      <td className="px-5 py-3.5 font-bold text-primary bg-primary/5">
                        ✓ {row.stb}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom CTA Banner */}
          <div className="mt-16 rounded-3xl bg-secondary p-8 text-white text-center sm:p-12 shadow-card">
            <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              Ready to Upgrade Your Shop Counter?
            </h2>
            <p className="mt-3 text-sm text-white/80 max-w-xl mx-auto">
              Start building repeat footfall today at flat ₹749/month with zero commission and free acrylic standee delivery.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/owner"
                className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-primary px-8 text-sm font-bold text-white shadow-sm transition hover:bg-white hover:text-secondary active:scale-95"
              >
                Open Shop Terminal
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-white/30 bg-white/10 px-8 text-sm font-bold text-white transition hover:bg-white/20"
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
