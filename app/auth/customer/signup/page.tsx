"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Phone, Mail, User, ArrowRight, ShieldCheck, CheckCircle2, RotateCcw, LogIn, UserPlus } from "lucide-react";
import Logo from "@/components/Logo";
import { createClient } from "@/lib/supabase/client";
import { syncCustomerAccountAction } from "@/app/actions/customer";

export default function CustomerSignUpPage() {
  const router = useRouter();
  const supabase = createClient();

  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [step, setStep] = useState<"details" | "otp">("details");

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(true);

  // 6-digit OTP
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [otpSuccessMessage, setOtpSuccessMessage] = useState<string | null>(null);

  const otpInputs = useRef<(HTMLInputElement | null)[]>([]);

  // 1. Auto-Login Check: If customer already has an active session, redirect straight to dashboard
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        window.location.href = "/customer/dashboard";
      }
    });
  }, [supabase]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMessage("Please enter a valid email address to receive your 6-digit OTP.");
      return;
    }

    if (authMode === "signup") {
      const cleanPhone = phone.replace(/\D/g, "");
      if (cleanPhone.length < 10) {
        setErrorMessage("Please enter a valid 10-digit mobile number (+91).");
        return;
      }
      if (!consent) {
        setErrorMessage("Please accept the DPDP privacy consent to create your pass.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const cleanPhone = phone.replace(/\D/g, "");
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          data: {
            full_name: fullName.trim() || (authMode === "login" ? "Retail Regular" : "New Customer"),
            phone: cleanPhone || undefined,
          },
        },
      });

      if (error) {
        console.error("Supabase OTP dispatch error:", error);
        setErrorMessage(error.message || "Failed to dispatch verification email. Please check your email and try again.");
        setIsSubmitting(false);
        return;
      }

      setOtpSuccessMessage(`Verification code sent to ${cleanEmail}! Check your inbox.`);
      setStep("otp");
    } catch (err: any) {
      setErrorMessage(err.message || "Unable to send verification code. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    const digit = val.slice(-1);
    const updated = [...otp];
    updated[index] = digit;
    setOtp(updated);

    if (digit && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const token = otp.join("").trim();
    if (token.length < 6) {
      setErrorMessage("Please enter all 6 digits of the OTP code.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token,
        type: "email",
      });

      if (error || !data.user) {
        setErrorMessage(error?.message || "Invalid or expired verification code. Please check your email.");
        setIsSubmitting(false);
        return;
      }

      // Sync customer profile with database
      const cleanPhone = phone.replace(/\D/g, "");
      await syncCustomerAccountAction({
        fullName: fullName.trim() || undefined,
        phone: cleanPhone || undefined,
        email: email.trim().toLowerCase(),
      });

      // Save phone to localStorage for instant counter recognition
      if (typeof window !== "undefined") {
        if (cleanPhone) localStorage.setItem("stb_customer_phone", cleanPhone);
        if (fullName.trim()) localStorage.setItem("stb_customer_name", fullName.trim());
      }

      // Session established -> Full reload into customer dashboard
      window.location.href = "/customer/dashboard";
    } catch (err: any) {
      setErrorMessage(err.message || "Verification failed. Please retry.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-sand px-4 py-12 sm:px-6">
      {/* Brand Header */}
      <div className="mb-8 text-center">
        <Logo href="/" size="lg" />
        <p className="mt-2 text-xs font-bold uppercase tracking-wider text-secondary/70">
          Customer Digital Pass Wallet
        </p>
      </div>

      {/* Mobile-First Card */}
      <div className="w-full max-w-[440px] rounded-[2.5rem] border border-border bg-white p-7 sm:p-9 shadow-float">
        {step === "details" ? (
          <div>
            {/* Mode Toggle */}
            <div className="mb-6 grid grid-cols-2 gap-1.5 rounded-2xl bg-sand/70 p-1.5 border border-border">
              <Link
                href="/auth/customer/login"
                className="flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-extrabold transition text-ink/70 hover:text-secondary"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Sign In</span>
              </Link>
              <button
                type="button"
                className="flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-extrabold transition bg-white text-secondary shadow-xs"
              >
                <UserPlus className="h-3.5 w-3.5 text-primary" />
                <span>Create Pass</span>
              </button>
            </div>

            <div className="mb-6">
              <h1 className="font-display text-2xl font-extrabold text-secondary">
                Create Your Digital Pass
              </h1>
              <p className="mt-1 text-xs text-ink/65 leading-relaxed">
                Join StickTheBizz to earn rewards, free chai, and store perks across your favorite local shops.
              </p>
            </div>

            {errorMessage && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                  Full Name
                </label>
                <div className="relative mt-1.5">
                  <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full rounded-xl border border-border bg-sand/30 py-2.5 pl-10 pr-3.5 text-xs font-bold text-secondary outline-none focus:border-primary focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                  Mobile Number (+91)
                </label>
                <div className="relative mt-1.5">
                  <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="e.g. 9820012345"
                    className="w-full rounded-xl border border-border bg-sand/30 py-2.5 pl-10 pr-3.5 font-mono text-xs font-bold text-secondary outline-none focus:border-primary focus:bg-white"
                  />
                </div>
                <p className="mt-1 text-[11px] text-ink/50">Used at shop counters to credit stamps.</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                  Email Address (For Free OTP)
                </label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@gmail.com"
                    className="w-full rounded-xl border border-border bg-sand/30 py-2.5 pl-10 pr-3.5 text-xs font-bold text-secondary outline-none focus:border-primary focus:bg-white"
                  />
                </div>
                <p className="mt-1 text-[11px] text-ink/50">We will send a 6-digit login code here.</p>
              </div>

              <div className="rounded-xl border border-border/80 bg-sand/40 p-3">
                <label className="flex items-start gap-2.5 text-xs text-ink/80 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="leading-tight text-[11px]">
                    I agree to DPDP Act privacy guidelines and consent to store visit verification.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-extrabold uppercase tracking-wider text-white shadow-card transition hover:bg-primary/90 disabled:opacity-50"
              >
                <span>{isSubmitting ? "Sending OTP..." : "Get 6-Digit OTP Code"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        ) : (
          <div>
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h2 className="font-display text-xl font-extrabold text-secondary">
                Enter Verification Code
              </h2>
              <p className="mt-1 text-xs text-ink/65">
                {otpSuccessMessage || `We sent a 6-digit code to ${email}.`}
              </p>
            </div>

            {errorMessage && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="flex justify-center gap-2 sm:gap-2.5">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      otpInputs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="h-12 w-11 sm:h-14 sm:w-12 rounded-xl border-2 border-border text-center font-mono text-xl font-extrabold text-secondary outline-none focus:border-primary focus:bg-sand/30"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || otp.join("").length < 6}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-secondary px-4 text-xs font-extrabold uppercase tracking-wider text-white shadow-card transition hover:bg-primary disabled:opacity-50"
              >
                <span>{isSubmitting ? "Verifying..." : "Verify & Open Wallet"}</span>
                <CheckCircle2 className="h-4 w-4" />
              </button>

              <div className="flex items-center justify-between text-xs text-ink/60 pt-2">
                <button
                  type="button"
                  onClick={() => setStep("details")}
                  className="hover:text-secondary underline"
                >
                  Change Email / Details
                </button>
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={isSubmitting}
                  className="flex items-center gap-1 font-bold text-primary hover:underline"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Resend Code</span>
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="mt-8 border-t border-border pt-4 text-center">
          <Link
            href="/"
            className="text-[11px] font-semibold text-ink/60 hover:text-secondary hover:underline"
          >
            ← Back to StickTheBizz Home
          </Link>
        </div>
      </div>
    </div>
  );
}
