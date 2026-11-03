"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Store, User, Phone, Mail, Lock, ArrowRight, ShieldCheck } from "lucide-react";
import { useStore } from "@/context/StoreContext";

export default function OwnerRegisterPage() {
  const router = useRouter();
  const { updateRule } = useStore();

  const [shopName, setShopName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (shopName.trim()) {
      updateRule({
        name: shopName.trim(),
        slug: shopName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      });
    }

    setTimeout(() => {
      setIsSubmitting(false);
      router.push("/owner");
    }, 800);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-sand px-4 py-12 sm:px-6">
      {/* Brand Header */}
      <div className="mb-8 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-display text-2xl font-extrabold tracking-tight text-secondary"
        >
          <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-white shadow-sm">
            <Sparkles className="h-5 w-5" />
          </span>
          <span>
            StickTheBizz<span className="text-primary">.</span>
          </span>
        </Link>
        <p className="mt-2 text-xs font-bold uppercase tracking-wider text-secondary/70">
          Merchant Counter Registration
        </p>
      </div>

      {/* Floating White Card */}
      <div className="w-full max-w-md rounded-[2.5rem] border border-border bg-white p-8 sm:p-10 shadow-float">
        <div className="text-center">
          <h1 className="font-display text-2xl font-extrabold text-secondary">
            Register Your Counter
          </h1>
          <p className="mt-1.5 text-xs text-ink/65 leading-relaxed">
            Start issuing digital punch cards with your custom QR standee in under 2 minutes.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {/* Shop Name */}
          <div>
            <label
              htmlFor="shopName"
              className="block text-xs font-bold uppercase tracking-wider text-ink/70"
            >
              Shop / Business Name
            </label>
            <div className="relative mt-1.5">
              <Store className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink/40" />
              <input
                id="shopName"
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="e.g. Chai Shai Corner"
                className="h-12 w-full rounded-xl border border-border bg-white pl-11 pr-4 text-sm font-semibold text-ink placeholder:text-ink/40 transition focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
              />
            </div>
          </div>

          {/* Owner Name */}
          <div>
            <label
              htmlFor="ownerName"
              className="block text-xs font-bold uppercase tracking-wider text-ink/70"
            >
              Owner Name
            </label>
            <div className="relative mt-1.5">
              <User className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink/40" />
              <input
                id="ownerName"
                type="text"
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="e.g. Ramesh Patel"
                className="h-12 w-full rounded-xl border border-border bg-white pl-11 pr-4 text-sm font-semibold text-ink placeholder:text-ink/40 transition focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
              />
            </div>
          </div>

          {/* 10-Digit Mobile */}
          <div>
            <label
              htmlFor="mobile"
              className="block text-xs font-bold uppercase tracking-wider text-ink/70"
            >
              10-Digit Mobile Number
            </label>
            <div className="relative mt-1.5">
              <Phone className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink/40" />
              <input
                id="mobile"
                type="tel"
                required
                pattern="[0-9]{10}"
                maxLength={10}
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="e.g. 9820012345"
                className="h-12 w-full rounded-xl border border-border bg-white pl-11 pr-4 font-mono text-sm font-semibold text-ink placeholder:text-ink/40 transition focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-bold uppercase tracking-wider text-ink/70"
            >
              Email Address
            </label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink/40" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-12 w-full rounded-xl border border-border bg-white pl-11 pr-4 text-sm font-semibold text-ink placeholder:text-ink/40 transition focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-bold uppercase tracking-wider text-ink/70"
            >
              Password
            </label>
            <div className="relative mt-1.5">
              <Lock className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink/40" />
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-12 w-full rounded-xl border border-border bg-white pl-11 pr-4 text-sm font-semibold text-ink placeholder:text-ink/40 transition focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 flex h-12 min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white shadow-card transition hover:bg-secondary disabled:opacity-50"
          >
            <span>{isSubmitting ? "Setting Up Counter..." : "Create Shop Account"}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* DPDP Compliance Notice */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-center text-[11px] text-ink/50">
          <ShieldCheck className="h-3.5 w-3.5 text-success shrink-0" />
          <span>DPDP Act 2023 Compliant • Bank-Grade TLS 1.3</span>
        </div>

        {/* Existing Account Link */}
        <div className="mt-6 border-t border-border/70 pt-4 text-center">
          <p className="text-xs text-ink/70">
            Already have a merchant account?{" "}
            <Link
              href="/auth/owner/login"
              className="font-bold text-secondary underline hover:text-primary"
            >
              Log in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
