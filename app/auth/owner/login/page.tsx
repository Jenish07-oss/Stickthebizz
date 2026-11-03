"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Mail, Lock, ArrowRight, Store } from "lucide-react";

export default function OwnerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      router.push("/owner");
    }, 700);
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
            Access Your Counter Terminal
          </h1>
          <p className="mt-1.5 text-xs text-ink/65 leading-relaxed">
            Manage your incoming customer check-in queue, redeem vouchers, and view live footfall metrics.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-bold uppercase tracking-wider text-ink/70"
            >
              Registered Email
            </label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink/40" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@kesarchai.in"
                className="h-12 w-full rounded-xl border border-border bg-white pl-11 pr-4 text-sm font-semibold text-ink placeholder:text-ink/40 transition focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-xs font-bold uppercase tracking-wider text-ink/70"
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => alert("Password reset link sent to your registered email!")}
                className="text-[11px] font-semibold text-secondary hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative mt-1.5">
              <Lock className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink/40" />
              <input
                id="password"
                type="password"
                required
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
            <span>{isSubmitting ? "Logging in..." : "Log in to Shop Terminal"}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* Create Account Link */}
        <div className="mt-8 border-t border-border/70 pt-5 text-center">
          <p className="text-xs text-ink/70">
            Don&apos;t have a merchant account yet?{" "}
            <Link
              href="/auth/owner/register"
              className="font-bold text-secondary underline hover:text-primary"
            >
              Create free shop account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
