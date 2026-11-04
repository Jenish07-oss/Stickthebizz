"use client";

import React from "react";
import { Sparkles, CheckCircle2, Clock, Ticket } from "lucide-react";

export interface RewardTicketData {
  code: string;
  pin?: string;
  rewardName: string;
  expiryDate?: string;
  isRedeemed: boolean;
}

interface RewardTicketProps {
  ticket: RewardTicketData;
  onRedeem?: () => void;
  isOwnerView?: boolean;
}

export default function RewardTicket({
  ticket,
  onRedeem,
  isOwnerView = false,
}: RewardTicketProps) {
  const expiry = ticket.expiryDate || "Valid for 14 days";

  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-dashed border-primary bg-white p-6 shadow-float transition-all">
      {/* Ticket Side Cutout Notches */}
      <div className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border-r-2 border-dashed border-primary bg-sand" />
      <div className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border-l-2 border-dashed border-primary bg-sand" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/70 pb-4">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-coral/15 text-primary">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink/50">
              Verified Reward Voucher
            </p>
            <h3 className="font-display text-lg font-extrabold text-secondary">
              {ticket.rewardName}
            </h3>
          </div>
        </div>

        {/* Status Pill */}
        {ticket.isRedeemed ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-border px-3 py-1 font-mono text-xs font-bold text-ink/60">
            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
            REDEEMED
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-coral/15 px-3 py-1 font-mono text-xs font-bold text-primary animate-pulse">
            <span className="h-2 w-2 rounded-full bg-primary" />
            REWARD READY
          </span>
        )}
      </div>

      {/* Ticket Details */}
      <div className="my-5 grid grid-cols-2 gap-4 rounded-2xl bg-sand/40 p-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink/50">
            Voucher Code
          </p>
          <p className="mt-1 font-mono text-base sm:text-lg font-extrabold tracking-wider text-secondary select-all">
            {ticket.code}
          </p>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink/50">
            {isOwnerView && ticket.pin ? "Store PIN" : "Verification"}
          </p>
          <p className="mt-1 font-mono text-xs sm:text-sm font-extrabold tracking-wider text-primary">
            {isOwnerView && ticket.pin ? ticket.pin : "Cashier Terminal"}
          </p>
        </div>
      </div>

      {/* Expiry & Instructions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-ink/70">
        <div className="flex items-center gap-1.5 font-medium">
          <Clock className="h-4 w-4 text-secondary" />
          <span>{expiry}</span>
        </div>
        <p className="text-[11px] italic text-ink/55">
          Show this Voucher Code to the cashier at the counter to claim.
        </p>
      </div>

      {/* Action button if not redeemed yet */}
      {!ticket.isRedeemed && onRedeem && (
        <div className="mt-5 pt-4 border-t border-border/70">
          <button
            type="button"
            onClick={onRedeem}
            className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-secondary px-4 text-sm font-bold text-white transition hover:bg-primary shadow-sm"
          >
            {isOwnerView ? "Confirm & Mark Reward Given" : "Show Voucher to Cashier"}
          </button>
        </div>
      )}
    </div>
  );
}
