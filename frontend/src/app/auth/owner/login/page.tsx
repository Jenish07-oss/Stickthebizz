"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight, Store, Eye, EyeOff } from "lucide-react";
import Logo from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api/client";

export default function OwnerLoginPage() {
  const router = useRouter();
  const { user, loginMerchant } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role === "MERCHANT") {
      router.replace("/owner/dashboard");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await api.auth.ownerLogin({ email: email.trim().toLowerCase(), password });
      if (res && res.token && res.user) {
        loginMerchant(res.token, res.user, res.merchant);
        window.location.href = "/owner/dashboard";
      } else {
        setErrorMessage(res?.message || "Invalid email or password. Please try again.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to log in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-sand px-4 py-12 sm:px-6">
      {/* Brand Header */}
      <div className="mb-8 text-center">
        <Logo href="/" size="lg" />
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
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-border bg-white py-3 pl-10 pr-11 font-mono text-sm font-semibold text-secondary placeholder:text-ink/35 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-ink/40 hover:text-secondary"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-white shadow-card transition-all hover:bg-primary/90 hover:shadow-lg disabled:opacity-50"
          >
            <span>{isSubmitting ? "Signing in..." : "Open Cashier Terminal"}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-6 border-t border-border pt-4 text-center">
          <p className="text-xs text-ink/65">
            New shop owner?{" "}
            <Link
              href="/auth/owner/register"
              className="font-bold text-primary hover:underline"
            >
              Register Counter (2 Mins)
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

