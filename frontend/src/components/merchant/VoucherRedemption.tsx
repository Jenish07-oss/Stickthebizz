"use client";

import React, { useState } from "react";
import { KeyRound, Phone, CheckCircle2, ShieldAlert } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { playMilestoneFanfare } from "@/lib/audio";
import { api } from "@/lib/api/client";

interface VoucherRedemptionProps {
  shopId: string;
  shopName: string;
  onRedeemSuccess?: () => void;
}

export default function VoucherRedemption({
  shopId,
  shopName,
  onRedeemSuccess,
}: VoucherRedemptionProps) {
  const toast = useToast();
  const [pin, setPin] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [resultMessage, setResultMessage] = useState<{ success: boolean; text: string } | null>(null);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pin.trim();
    if (!cleanPin || cleanPin.length !== 4) {
      toast.error("Please enter a valid 4-digit store PIN");
      return;
    }

    setIsValidating(true);
    setResultMessage(null);

    try {
      const data = await api.scans.redeem(shopId, cleanPin, customerPhone.trim());
      if (data && data.success) {
        playMilestoneFanfare();
        toast.success(data.message || "Voucher Verified — Reward Marked Redeemed!");
        setResultMessage({
          success: true,
          text: `✓ ${data.message || "Voucher Verified & Redeemed!"}`,
        });
        setPin("");
        setCustomerPhone("");
        if (onRedeemSuccess) onRedeemSuccess();
      } else {
        toast.error(data?.message || "Invalid PIN. Please check terminal PIN.");
        setResultMessage({
          success: false,
          text: data?.message || "Invalid 4-digit PIN. Please verify.",
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Redemption request failed");
      setResultMessage({
        success: false,
        text: err.message || "Redemption error. Please check customer phone.",
      });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="w-full rounded-[2rem] border border-border bg-white p-6 shadow-card">
      <div className="flex items-center gap-2.5 pb-4 border-b border-border/70">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">
          <KeyRound className="h-4 w-4" />
        </span>
        <div>
          <h3 className="font-display text-base font-extrabold text-secondary">
            Burn Reward Voucher
          </h3>
          <p className="text-[11px] text-ink/65">
            Enter customer phone &amp; your 4-digit PIN to mark milestone reward given
          </p>
        </div>
      </div>

      <form onSubmit={handleRedeem} className="mt-5 space-y-4">
        <div>
          <label className="block text-xs font-bold text-secondary mb-1">
            Customer Phone (10 Digits)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40">
              <Phone className="h-4 w-4" />
            </span>
            <input
              type="tel"
              placeholder="e.g. 9876543210"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full rounded-xl border border-border pl-10 pr-4 py-2.5 text-xs font-mono font-bold text-secondary focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-secondary mb-1">
            4-Digit Cashier Terminal PIN
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40">
              <KeyRound className="h-4 w-4" />
            </span>
            <input
              type="password"
              maxLength={4}
              placeholder="4-digit PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              className="w-full rounded-xl border border-border pl-10 pr-4 py-2.5 text-xs font-mono font-bold text-secondary tracking-widest focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isValidating || !pin}
          className="w-full inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-xs font-bold text-white shadow-brand-sm transition hover:bg-primary active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          {isValidating ? (
            <span>Verifying Voucher PIN...</span>
          ) : (
            <span>Verify &amp; Burn Voucher</span>
          )}
        </button>

        {resultMessage && (
          <div
            className={`flex items-start gap-2 rounded-xl p-3 text-xs font-semibold ${
              resultMessage.success
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-coral/10 text-primary border border-coral/20"
            }`}
          >
            {resultMessage.success ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
            ) : (
              <ShieldAlert className="h-4 w-4 shrink-0 text-primary mt-0.5" />
            )}
            <p className="leading-snug">{resultMessage.text}</p>
          </div>
        )}
      </form>
    </div>
  );
}

