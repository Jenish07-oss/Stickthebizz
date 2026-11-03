"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Phone, ArrowRight, ShieldCheck, CheckCircle2, RotateCcw } from "lucide-react";
import { useStore } from "@/context/StoreContext";

export default function CustomerOtpLoginPage() {
  const router = useRouter();
  const { rule, loginCustomer } = useStore();

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(true);
  const [otp, setOtp] = useState(["8", "4", "9", "2"]); // Pre-filled demonstration OTP
  const [isVerifying, setIsVerifying] = useState(false);

  const otpInputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length === 10 && consent) {
      setStep("otp");
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    const digit = val.slice(-1);
    const updated = [...otp];
    updated[index] = digit;
    setOtp(updated);

    if (digit && index < 3) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);

    const fullCode = otp.join("");
    if (fullCode.length === 4) {
      loginCustomer(phone || "9820012345");
      setTimeout(() => {
        setIsVerifying(false);
        router.push("/customer");
      }, 600);
    } else {
      setIsVerifying(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-sand px-4 py-8">
      {/* Brand Header */}
      <div className="mb-6 text-center">
        <Link
          href="/" target="_self"
          className="inline-flex items-center gap-2 font-display text-2xl font-extrabold tracking-tight text-secondary"
        >
          <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-white shadow-sm">
            <Sparkles className="h-5 w-5" />
          </span>
          <span>
            StickTheBizz<span className="text-primary">.</span>
          </span>
        </Link>
        <p className="mt-1.5 text-xs font-bold uppercase tracking-wider text-secondary/70">
          Customer Digital Pass Login
        </p>
      </div>

      {/* Mobile-first centered card (<420px max-width) */}
      <div className="w-full max-w-[420px] rounded-[2.5rem] border border-border bg-white p-7 sm:p-9 shadow-float">
        <div className="text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="font-display text-2xl font-extrabold text-secondary">
            {step === "phone" ? "Enter Your Mobile Number" : "Verify With SMS Code"}
          </h1>
          <p className="mt-1.5 text-xs text-ink/65 leading-relaxed">
            {step === "phone"
              ? `Collect digital punch stamps and free treats at ${rule.name}. Zero app downloads required.`
              : `Enter the 4-digit verification code sent to +91 ${phone || "9820012345"}.`}
          </p>
        </div>

        {step === "phone" ? (
          <form onSubmit={handleSendCode} className="mt-7 space-y-4">
            <div>
              <label
                htmlFor="mobile"
                className="block text-xs font-bold uppercase tracking-wider text-ink/70"
              >
                10-Digit Mobile Number
              </label>
              <div className="relative mt-2">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm font-bold text-ink/60">
                  +91
                </span>
                <input
                  id="mobile"
                  type="tel"
                  required
                  pattern="[0-9]{10}"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="9820012345"
                  className="h-12 w-full rounded-xl border border-border bg-white pl-14 pr-4 font-mono text-base font-bold text-ink placeholder:text-ink/35 transition focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
                />
              </div>
            </div>

            {/* Mandatory Consent Checkbox */}
            <div className="flex items-start gap-2.5 rounded-xl bg-sand/40 p-3.5">
              <input
                id="consent"
                type="checkbox"
                required
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="consent" className="text-[11px] leading-relaxed text-ink/75">
                By continuing, you agree to let <strong>{rule.name}</strong> track your visits. Your phone number is masked and protected under India&apos;s DPDP Act 2023.
              </label>
            </div>

            <button
              type="submit"
              disabled={phone.length !== 10 || !consent}
              className="mt-4 flex h-12 min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white shadow-card transition hover:bg-secondary disabled:opacity-50"
            >
              <span>Send Login Code</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="mt-7 space-y-5">
            {/* 4-Box OTP Input */}
            <div>
              <label className="block text-center text-xs font-bold uppercase tracking-wider text-ink/70 mb-3">
                Enter 4-Digit Verification Code
              </label>
              <div className="flex justify-center gap-3">
                {[0, 1, 2, 3].map((idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      otpInputs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={otp[idx]}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="h-14 w-12 rounded-xl border-2 border-border bg-white text-center font-mono text-2xl font-extrabold text-secondary shadow-sm transition focus:border-secondary focus:ring-2 focus:ring-secondary focus:outline-none"
                  />
                ))}
              </div>
              <p className="mt-2.5 text-center font-mono text-[11px] text-ink/50">
                Simulation code: <strong>8492</strong> (Pre-filled)
              </p>
            </div>

            <button
              type="submit"
              disabled={isVerifying || otp.join("").length !== 4}
              className="flex h-12 min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white shadow-card transition hover:bg-secondary disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{isVerifying ? "Verifying..." : "Verify & Open Digital Card"}</span>
            </button>

            <button
              type="button"
              onClick={() => setStep("phone")}
              className="flex items-center justify-center gap-1.5 w-full text-xs font-semibold text-secondary hover:underline"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Change Phone Number
            </button>
          </form>
        )}

        {/* Footer Guarantee */}
        <div className="mt-6 flex items-center justify-center gap-1 text-[11px] text-ink/50 border-t border-border/70 pt-4">
          <ShieldCheck className="h-3.5 w-3.5 text-success shrink-0" />
          <span>Zero passwords • No app store download needed</span>
        </div>
      </div>
    </div>
  );
}
