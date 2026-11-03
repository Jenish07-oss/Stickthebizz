"use client";

import React from "react";
import { Sparkles, CheckCircle2, Clock } from "lucide-react";
import { RewardTicketData } from "@/context/StoreContext";

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
  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-dashed border-primary bg-white p-6 shadow-float transition-all">
      {/* Ticket Side Notches */}
      <div className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border-r-2 border-dashed border-primary bg-sand" />
      <div className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border-l-2 border-dashed border-primary bg-sand" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/70 pb-4">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink/50">
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
          <span className="inline-flex items-center gap-1 rounded-full bg-coral/15 px-3 py-1 font-mono text-xs font-bold text-primary">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            REWARD READY
          </span>
        )}
      </div>

      {/* Ticket Details */}
      <div className="my-5 grid grid-cols-2 gap-4 rounded-2xl bg-sand/40 p-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink/50">
            Redemption Code
          </p>
          <p className="mt-1 font-mono text-base font-extrabold tracking-wider text-secondary">
            {ticket.code}
          </p>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink/50">
            Counter 4-Digit PIN
          </p>
          <p className="mt-1 font-mono text-xl font-extrabold tracking-widest text-primary">
            {ticket.pin}
          </p>
        </div>
      </div>

      {/* Expiry & Instructions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-ink/70">
        <div className="flex items-center gap-1.5 font-medium">
          <Clock className="h-4 w-4 text-secondary" />
          Valid until: <span className="font-mono font-bold text-ink">{ticket.expiryDate}</span>
        </div>
        <p className="text-[11px] italic text-ink/55">
          Show this screen to the counter attendant to claim.
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
            {isOwnerView ? "Confirm & Mark Reward Given" : "Mark as Redeemed at Counter"}
          </button>
        </div>
      )}
    </div>
  );
}
