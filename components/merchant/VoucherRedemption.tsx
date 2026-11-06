"use client";

import React, { useState } from "react";
import { KeyRound, Phone, CheckCircle2, ShieldAlert } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { playMilestoneFanfare } from "@/lib/audio";

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
      const res = await fetch("/api/owner/redeem-voucher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId,
          pin: cleanPin,
          customerPhone: customerPhone.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
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
        toast.error(data.message || "Invalid PIN. Please check terminal PIN.");
        setResultMessage({
          success: false,
          text: `✗ ${data.message || "Invalid PIN"}`,
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Network error verifying voucher");
      setResultMessage({ success: false, text: "Error verifying PIN." });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="w-full rounded-[2rem] border border-border bg-white p-6 shadow-card">
      <div className="flex items-center gap-2 pb-3 border-b border-border/70">
        <KeyRound className="h-4 w-4 text-primary" />
        <h3 className="font-display text-sm font-extrabold text-secondary uppercase tracking-wider">
          Voucher PIN Redemption
        </h3>
      </div>
      <p className="mt-1 text-xs text-ink/65 leading-relaxed">
        When a customer unlocks a reward voucher, enter your 4-digit counter PIN to mark the reward as redeemed.
      </p>

      <form onSubmit={handleRedeem} className="mt-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-bold text-ink/75 block mb-1">
              Store PIN (4 Digits)
            </label>
            <div className="relative">
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                placeholder="e.g. 2468"
                className="w-full rounded-xl border border-border bg-sand/30 px-3 py-2 text-sm font-mono font-bold text-secondary tracking-widest outline-none focus:border-primary"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-ink/75 block mb-1">
              Customer Mobile (Optional)
            </label>
            <div className="relative">
              <input
                type="tel"
                maxLength={10}
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ""))}
                placeholder="10-digit mobile"
                className="w-full rounded-xl border border-border bg-sand/30 px-3 py-2 text-sm font-mono text-secondary outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isValidating || pin.length !== 4}
          className="w-full inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-secondary px-4 text-xs font-bold text-white transition hover:bg-primary active:scale-95 disabled:opacity-50 cursor-pointer shadow-brand-sm"
        >
          {isValidating ? (
            <span>Verifying PIN...</span>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              <span>Validate PIN &amp; Mark Redeemed</span>
            </>
          )}
        </button>

        {resultMessage && (
          <p
            className={`text-center text-xs font-bold ${
              resultMessage.success ? "text-emerald-700" : "text-red-600"
            }`}
          >
            {resultMessage.text}
          </p>
        )}
      </form>
    </div>
  );
}
