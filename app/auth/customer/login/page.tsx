"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Phone, Mail, User, ArrowRight, ShieldCheck, CheckCircle2, RotateCcw, LogIn, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { syncCustomerAccountAction } from "@/app/actions/customer";

export default function CustomerAuthPage() {
  const router = useRouter();
  const supabase = createClient();

  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
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

  // 1. Auto-Login Check: If customer has an active session, redirect straight to dashboard
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
        setErrorMessage("Please enter a valid 10-digit mobile number.");
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
      // Real Supabase Auth OTP verification
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
          Customer Digital Pass Wallet
        </p>
      </div>

      {/* Mobile-First Card */}
      <div className="w-full max-w-[440px] rounded-[2.5rem] border border-border bg-white p-7 sm:p-9 shadow-float">
        {step === "details" ? (
          <div>
            {/* Mode Toggle: Sign In vs Sign Up */}
            <div className="mb-6 grid grid-cols-2 gap-1.5 rounded-2xl bg-sand/70 p-1.5 border border-border">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("login");
                  setErrorMessage(null);
                }}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition ${
                  authMode === "login"
                    ? "bg-secondary text-white shadow-sm"
                    : "text-ink/65 hover:text-secondary"
                }`}
              >
                <LogIn className="h-4 w-4" />
                <span>Returning Customer</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMode("signup");
                  setErrorMessage(null);
                }}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition ${
                  authMode === "signup"
                    ? "bg-secondary text-white shadow-sm"
                    : "text-ink/65 hover:text-secondary"
                }`}
              >
                <UserPlus className="h-4 w-4" />
                <span>New Pass Sign Up</span>
              </button>
            </div>

            <div className="text-center mb-6">
              <h1 className="font-display text-2xl font-extrabold text-secondary">
                {authMode === "login" ? "Sign In to Your Pass" : "Create Your Pass"}
              </h1>
              <p className="mt-1 text-xs text-ink/65 leading-relaxed">
                {authMode === "login"
                  ? "Enter your registered email to receive an instant 6-digit login code."
                  : "Zero passwords. Enter your details to start collecting loyalty stamps."}
              </p>
            </div>

            {errorMessage && (
              <div className="mb-4 rounded-xl bg-primary/10 border border-primary/20 p-3 text-xs font-bold text-primary text-center">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleRequestOtp} className="space-y-4">
              {/* Full Name (Sign Up only) */}
              {authMode === "signup" && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                    Your Full Name
                  </label>
                  <div className="relative mt-1.5">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-ink/40">
                      <User className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      required={authMode === "signup"}
                      placeholder="e.g. Ramesh Patel"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full rounded-xl border border-border p-3 pl-10 text-sm font-semibold text-secondary placeholder:text-ink/30 focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Mobile Phone (Sign Up only) */}
              {authMode === "signup" && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                    10-Digit Mobile Number
                  </label>
                  <div className="relative mt-1.5">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-xs font-mono font-bold text-secondary">
                      +91
                    </span>
                    <input
                      type="tel"
                      required={authMode === "signup"}
                      maxLength={10}
                      placeholder="98200 12345"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      className="w-full rounded-xl border border-border p-3 pl-14 font-mono text-sm font-bold text-secondary placeholder:text-ink/30 focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Email Address (Both modes) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                  Email Address (For Verification Code)
                </label>
                <div className="relative mt-1.5">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-ink/40">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="you@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-border p-3 pl-10 text-sm font-semibold text-secondary placeholder:text-ink/30 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* DPDP Privacy Consent (Sign Up only) */}
              {authMode === "signup" && (
                <div className="flex items-start gap-2.5 pt-1">
                  <input
                    type="checkbox"
                    id="dpdpConsent"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <label htmlFor="dpdpConsent" className="text-[11px] leading-tight text-ink/70">
                    I agree to receive transactional visit stamp alerts under DPDP guidelines. No marketing spam.
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-white shadow-card transition-all hover:bg-primary/90 disabled:opacity-50"
              >
                <span>{isSubmitting ? "Sending Code..." : "Send Verification Code"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        ) : (
          <div>
            {/* Step 2: 6-Digit OTP Entry */}
            <div className="text-center">
              <span className="inline-block rounded-full bg-emerald-100 p-2.5 text-emerald-800 mb-3">
                <CheckCircle2 className="h-6 w-6" />
              </span>
              <h2 className="font-display text-2xl font-extrabold text-secondary">
                Enter Verification Code
              </h2>
              <p className="mt-1 text-xs text-ink/65">
                We sent a 6-digit code to{" "}
                <span className="font-bold text-secondary">{email}</span>
              </p>
            </div>

            {otpSuccessMessage && (
              <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-[11px] font-bold text-emerald-800 text-center">
                {otpSuccessMessage}
              </div>
            )}

            {errorMessage && (
              <div className="mt-4 rounded-xl bg-primary/10 border border-primary/20 p-2.5 text-xs font-bold text-primary text-center">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="mt-6 space-y-5">
              {/* 6 Individual Code Inputs */}
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
                    className="h-12 w-11 sm:h-14 sm:w-12 rounded-xl border border-border text-center font-mono text-xl font-extrabold text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || otp.join("").length < 6}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-white shadow-card transition-all hover:bg-primary/90 disabled:opacity-50"
              >
                <span>{isSubmitting ? "Verifying..." : "Verify & Open Wallet"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep("details");
                    setOtp(["", "", "", "", "", ""]);
                    setErrorMessage(null);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-ink/65 hover:text-secondary transition"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Change Email / Resend Code</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
