"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Store, User, Phone, Mail, Lock, ArrowRight, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { registerMerchantAction } from "@/app/actions/merchant";

const CATEGORIES = [
  "Cafe / Chai",
  "Bakery",
  "Kirana / Grocery",
  "Quick Service Restaurant",
  "Salon / Spa",
  "Other Retail",
];

export default function OwnerRegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [shopName, setShopName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [category, setCategory] = useState("Cafe / Chai");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        window.location.href = "/owner/dashboard";
      }
    });
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanPhone = mobile.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!password || password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Sign up merchant in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: ownerName.trim(),
            phone: cleanPhone,
            shop_name: shopName.trim(),
            role: "merchant",
          },
        },
      });

      if (authError) {
        // If user already exists or signup needs signin
        if (authError.message.includes("already registered")) {
          setErrorMessage("This email is already registered. Please login to your account.");
          setIsSubmitting(false);
          return;
        }
        console.warn("Auth signup error:", authError.message);
      }

      const ownerId = authData?.user?.id;

      // 2. Provision row in merchants table via Server Action
      const regRes = await registerMerchantAction({
        name: shopName.trim(),
        category,
        ownerId,
        phone: cleanPhone,
      });

      if (!regRes.success) {
        console.warn("Merchant provisioning note:", regRes.error);
      }

      // Auto-redirect to Owner Dashboard with full session reload
      window.location.href = "/owner/dashboard";
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to complete registration. Please try again.");
    } finally {
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
          Merchant Counter Registration
        </p>
      </div>

      {/* Floating White Card */}
      <div className="w-full max-w-lg rounded-[2.5rem] border border-border bg-white p-8 sm:p-10 shadow-float">
        <div className="text-center">
          <h1 className="font-display text-2xl font-extrabold text-secondary">
            Set Up Your Shop Counter
          </h1>
          <p className="mt-2 text-xs text-ink/70 leading-relaxed">
            Instant activation. Generate your counter standee QR and turn walk-in footfall into daily regulars.
          </p>
        </div>

        {errorMessage && (
          <div className="mt-4 rounded-xl bg-primary/10 border border-primary/20 p-3 text-xs font-bold text-primary text-center">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Shop Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
              Shop Name
            </label>
            <div className="relative mt-1.5">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-ink/40">
                <Store className="h-4 w-4" />
              </span>
              <input
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="e.g. Sharma Sweets & Dairy"
                className="w-full rounded-xl border border-border bg-white py-3 pl-10 pr-4 text-sm font-semibold text-secondary placeholder:text-ink/35 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Owner Full Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
              Owner Full Name
            </label>
            <div className="relative mt-1.5">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-ink/40">
                <User className="h-4 w-4" />
              </span>
              <input
                type="text"
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="e.g. Vikram Sharma"
                className="w-full rounded-xl border border-border bg-white py-3 pl-10 pr-4 text-sm font-semibold text-secondary placeholder:text-ink/35 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Business Category */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
              Business Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border bg-white py-3 px-3.5 text-sm font-semibold text-secondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Mobile (+91) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
              10-Digit Mobile Number
            </label>
            <div className="relative mt-1.5">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 font-mono text-xs font-bold text-ink/60">
                +91
              </span>
              <input
                type="tel"
                required
                maxLength={10}
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                placeholder="9820012345"
                className="w-full rounded-xl border border-border bg-white py-3 pl-12 pr-4 font-mono text-sm font-semibold text-secondary placeholder:text-ink/35 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
              Email Address (for Login)
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
                placeholder="sharma.dairy@example.com"
                className="w-full rounded-xl border border-border bg-white py-3 pl-10 pr-4 text-sm font-semibold text-secondary placeholder:text-ink/35 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Password (min 8 characters) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
              Password (Min. 8 Characters)
            </label>
            <div className="relative mt-1.5">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-ink/40">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type="password"
                required
                minLength={8}
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
              <span>{isSubmitting ? "Provisioning Terminal..." : "Create My Shop Counter"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>

        <div className="mt-6 border-t border-border pt-4 text-center">
          <p className="text-xs text-ink/70">
            Already registered?{" "}
            <Link
              href="/auth/owner/login"
              replace={false}
              className="font-bold text-primary hover:underline"
            >
              Login to Cashier Terminal
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
