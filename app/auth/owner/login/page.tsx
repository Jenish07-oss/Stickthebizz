"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Mail, Lock, ArrowRight, Store, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function OwnerLoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        setErrorMessage(error.message || "Invalid email or password. Please try again.");
        setIsSubmitting(false);
        return;
      }

      router.push("/owner/dashboard");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to log in.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-sand px-4 py-12 sm:px-6">
      {/* Brand Header */}
      <div className="mb-8 text-center">
        <Link
          href="/"
          replace={false}
          className="inline-flex items-center gap-2 font-display text-2xl font-extrabold tracking-tight text-secondary"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-white shadow-sm">
            <Sparkles className="h-5 w-5" />
          </span>
          <span>StickTheBizz</span>
        </Link>
        <p className="mt-2 text-xs font-bold uppercase tracking-wider text-secondary/70">
          Shop Owner Cashier Login
        </p>
      </div>

      {/* Floating White Card */}
      <div className="w-full max-w-md rounded-[2.5rem] border border-border bg-white p-8 sm:p-10 shadow-float">
        <div className="text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-secondary/10 text-secondary">
            <Store className="h-6 w-6" />
          </div>
          <h1 className="font-display text-2xl font-extrabold text-secondary">
            Access Counter Terminal
          </h1>
          <p className="mt-1.5 text-xs text-ink/65 leading-relaxed">
            Manage your live incoming customer check-in queue, redeem vouchers, and track repeat footfall.
          </p>
        </div>

        {errorMessage && (
          <div className="mt-4 rounded-xl bg-primary/10 border border-primary/20 p-3 text-xs font-bold text-primary text-center">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
              Email Address
            </label>
            <div className="relative mt-1.5">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-ink/40">
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@example.com"
                className="w-full rounded-xl border border-border bg-white py-3 pl-10 pr-4 text-sm font-semibold text-secondary placeholder:text-ink/35 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
              Password
            </label>
            <div className="relative mt-1.5">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-ink/40">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-border bg-white py-3 pl-10 pr-4 font-mono text-sm font-semibold text-secondary placeholder:text-ink/35 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Submit CTA */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-bold text-white shadow-card transition hover:bg-primary/90 disabled:opacity-50 active:scale-95"
            >
              <span>{isSubmitting ? "Opening Desk..." : "Open Cashier Desk"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>

        <div className="mt-6 border-t border-border pt-4 text-center">
          <p className="text-xs text-ink/70">
            Need a counter QR stand?{" "}
            <Link
              href="/auth/owner/register"
              replace={false}
              className="font-bold text-primary hover:underline"
            >
              Register your store here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
