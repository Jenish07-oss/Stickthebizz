"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mail, User, ArrowRight, CheckCircle2, RotateCcw, LogIn, UserPlus } from "lucide-react";
import Logo from "@/components/Logo";
import { api } from "@/lib/api/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";

export default function CustomerAuthPage() {
  const router = useRouter();
  const toast = useToast();
  const { user, loginCustomer } = useAuth();

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
  const [isResending, setIsResending] = useState(false);
  const [resendAttempts, setResendAttempts] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [otpSuccessMessage, setOtpSuccessMessage] = useState<string | null>(null);

  const otpInputs = useRef<(HTMLInputElement | null)[]>([]);

  // 60-Second Cooldown Timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const [checkingExistingSession, setCheckingExistingSession] = useState(true);

  // Auto-Login Check
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const isSwitch = params.get("switch") === "true";
    const redirectUrl = params.get("redirect");

    const savedPhone = localStorage.getItem("stb_customer_phone");
    const savedEmail = localStorage.getItem("stb_customer_email");

    if (!isSwitch && ((savedPhone && savedPhone.replace(/\D/g, "").length === 10) || savedEmail)) {
      router.replace(redirectUrl || "/customer/dashboard");
      return;
    }

    if (!isSwitch && user && user.role === "CUSTOMER") {
      router.replace(redirectUrl || "/customer/dashboard");
    } else {
      setCheckingExistingSession(false);
    }
  }, [router, user]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setErrorMessage("Please enter a valid email address to receive your 6-digit verification code.");
      return;
    }

    if (authMode === "signup" && !consent) {
      setErrorMessage("Please accept the DPDP privacy consent to create your pass.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (cleanEmail === "demo.customer@stickthebizz.in") {
        setOtpSuccessMessage("✓ Test account recognized! Use code: 123456");
        toast.success("Test Code: 123456");
        setStep("otp");
        setIsSubmitting(false);
        return;
      }

      const res = await api.auth.requestCustomerOtp(cleanEmail);
      if (res && res.success) {
        setOtpSuccessMessage(`Verification code sent to ${cleanEmail}! Check your inbox and Spam folder.`);
        toast.success("Verification code sent! Check your inbox.");
        setStep("otp");
      } else {
        setErrorMessage(res?.message || "Failed to dispatch verification email. Please try again.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Unable to send verification code. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    setErrorMessage(null);
    setOtpSuccessMessage(null);

    try {
      const cleanEmail = email.trim().toLowerCase();

      if (cleanEmail === "demo.customer@stickthebizz.in") {
        setOtpSuccessMessage("✓ Test code: 123456");
        toast.success("Test Code: 123456");
      } else {
        const res = await api.auth.requestCustomerOtp(cleanEmail);
        if (!res?.success) {
          setErrorMessage(res?.message || "Failed to resend code. Please try again.");
          setIsResending(false);
          return;
        }
        setOtpSuccessMessage(`✓ New verification code sent to ${cleanEmail}! Check inbox & Spam.`);
      }

      setOtp(["", "", "", "", "", ""]);
      otpInputs.current[0]?.focus();

      if (resendAttempts === 0) {
        setResendAttempts(1);
      } else {
        setResendAttempts((prev) => prev + 1);
        setResendCooldown(60);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Unable to resend verification code.");
    } finally {
      setIsResending(false);
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

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const digits = pasted.split("");
    const updated = [...otp];
    digits.forEach((d, i) => {
      if (i < 6) updated[i] = d;
    });
    setOtp(updated);
    const nextIndex = Math.min(digits.length, 5);
    otpInputs.current[nextIndex]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.replace(/\D/g, "");
    const token = otp.join("").trim();
    if (token.length < 6) {
      setErrorMessage("Please enter all 6 digits of the verification code.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await loginCustomer({
        email: cleanEmail,
        code: token,
        phone: cleanPhone || undefined,
        fullName: fullName.trim() || undefined,
      });

      if (!res.success) {
        setErrorMessage(res.message || "Invalid or expired verification code.");
        setIsSubmitting(false);
        return;
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("stb_customer_email", cleanEmail);
        if (cleanPhone) localStorage.setItem("stb_customer_phone", cleanPhone);
        if (fullName.trim()) localStorage.setItem("stb_customer_name", fullName.trim());
      }

      const redirectUrl =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("redirect")
          : null;
      toast.success("Login verified! Welcome to your Loyalty Pass.");
      router.replace(redirectUrl || "/customer/dashboard");
    } catch (err: any) {
      setErrorMessage(err.message || "Verification failed. Please retry.");
      setIsSubmitting(false);
    }
  };

  if (checkingExistingSession) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-sand px-4 py-12">
        <div className="flex flex-col items-center justify-center gap-3">
          <Logo href="/" size="lg" />
          <div className="mt-4 flex items-center gap-2 text-xs font-bold text-secondary">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span>Loading verified customer pass...</span>
          </div>
        </div>
      </div>
    );
  }

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
            {/* Mode Toggle: Sign In vs Sign Up */}
            <div className="mb-6 grid grid-cols-2 gap-1.5 rounded-2xl bg-sand/70 p-1.5 border border-border">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("login");
                  setErrorMessage(null);
                }}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition ${authMode === "login"
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
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition ${authMode === "signup"
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
                  ? "Enter your registered email to receive an instant 6-digit verification code."
                  : "Enter your email and pass profile details to create your digital loyalty wallet."}
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

              {/* Email Address Input */}
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

              {/* Mobile Phone (Optional profile field) */}
              {authMode === "signup" && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                    Mobile Number <span className="font-normal text-ink/40 lowercase">(optional for store pass)</span>
                  </label>
                  <div className="relative mt-1.5">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-xs font-mono font-bold text-secondary">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="98200 12345"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      className="w-full rounded-xl border border-border p-3 pl-14 font-mono text-sm font-bold text-secondary placeholder:text-ink/30 focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* DPDP Privacy Consent */}
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
                <span>{isSubmitting ? "Sending Code..." : authMode === "login" ? "Send Verification Code" : "Create Pass & Send Code"}</span>
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
                    onPaste={handleOtpPaste}
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

              <div className="flex flex-col items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={resendCooldown > 0 || isResending}
                  onClick={handleResendOtp}
                  className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:text-primary/80 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RotateCcw className={`h-3.5 w-3.5 ${isResending ? "animate-spin" : ""}`} />
                  <span>
                    {isResending
                      ? "Resending code..."
                      : resendCooldown > 0
                        ? `Resend code in ${resendCooldown}s`
                        : "Resend Verification Code"}
                  </span>
                </button>

                <p className="text-[11px] text-ink/60 text-center max-w-xs">
                  Didn&apos;t receive it? Please check your <strong>Spam / Junk</strong> folder.
                  Codes typically arrive within 5–15 seconds.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setStep("details");
                    setOtp(["", "", "", "", "", ""]);
                    setErrorMessage(null);
                    setOtpSuccessMessage(null);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink/50 hover:text-secondary transition"
                >
                  <span>← Change Email Address</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

