"use client";

import React, { useState } from "react";
import { Check, X, RefreshCw, Volume2, ShieldCheck } from "lucide-react";
import { playApprovalBell } from "@/lib/audio";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api/client";

export interface PendingCheckinItem {
  id: string;
  customerName: string;
  customerMasked: string;
  amount: number;
  formattedTime: string;
  status: string;
}

interface CheckInQueueProps {
  shopId: string;
  shopName: string;
  initialQueue?: PendingCheckinItem[];
  connectionStatus?: "ONLINE" | "RECONNECTING" | "OFFLINE";
  onApprove?: (id: string) => Promise<void> | void;
  onReject?: (id: string) => Promise<void> | void;
}

export default function CheckInQueue({
  shopId,
  shopName,
  initialQueue = [],
  connectionStatus = "ONLINE",
  onApprove,
  onReject,
}: CheckInQueueProps) {
  const toast = useToast();
  const [queue, setQueue] = useState<PendingCheckinItem[]>(initialQueue);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Sync when initialQueue changes
  React.useEffect(() => {
    setQueue(initialQueue);
  }, [initialQueue]);

  const handleApprove = async (item: PendingCheckinItem) => {
    if (processingId) return;
    setProcessingId(item.id);
    playApprovalBell();

    // Optimistic removal
    setQueue((prev) => prev.filter((q) => q.id !== item.id));

    try {
      if (onApprove) {
        await onApprove(item.id);
      } else {
        await api.scans.approve(item.id);
      }
      toast.success(`Approved check-in for ${item.customerName}!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to approve check-in");
      setQueue((prev) => [item, ...prev]);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (item: PendingCheckinItem) => {
    if (processingId) return;
    setProcessingId(item.id);

    // Optimistic removal
    setQueue((prev) => prev.filter((q) => q.id !== item.id));

    try {
      if (onReject) {
        await onReject(item.id);
      } else {
        await api.scans.reject(item.id);
      }
      toast.info(`Rejected check-in for ${item.customerName}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to reject check-in");
      setQueue((prev) => [item, ...prev]);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="w-full rounded-[2rem] border border-border bg-white p-6 shadow-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border/70 gap-2">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-3 w-3">
            <span
              className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                connectionStatus === "ONLINE"
                  ? "bg-emerald-400"
                  : connectionStatus === "RECONNECTING"
                  ? "bg-amber-400"
                  : "bg-red-400"
              }`}
            />
            <span
              className={`relative inline-flex h-3 w-3 rounded-full ${
                connectionStatus === "ONLINE"
                  ? "bg-emerald-500"
                  : connectionStatus === "RECONNECTING"
                  ? "bg-amber-500"
                  : "bg-red-500"
              }`}
            />
          </span>
          <h3 className="font-display text-base font-extrabold text-secondary">
            Live Counter Queue
          </h3>
          <span
            className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-extrabold ${
              connectionStatus === "ONLINE"
                ? "bg-emerald-100 text-emerald-800"
                : connectionStatus === "RECONNECTING"
                ? "bg-amber-100 text-amber-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {connectionStatus === "ONLINE"
              ? "🟢 Terminal Online"
              : connectionStatus === "RECONNECTING"
              ? "🔴 Reconnecting..."
              : "⚪ Offline"}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-ink/65 font-medium">
          <Volume2 className="h-3.5 w-3.5 text-primary" />
          <span>Audio Chime Active</span>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {queue.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center bg-sand/20">
            <ShieldCheck className="h-8 w-8 text-emerald-600 mx-auto mb-2 opacity-80" />
            <p className="font-display text-sm font-bold text-secondary">
              0 Pending — No pending scans right now
            </p>
            <p className="mt-1 text-xs text-ink/60">
              When diners or kirana customers scan your standee, their 1-tap check-in appears here instantly.
            </p>
          </div>
        ) : (
          queue.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border bg-sand/30 p-4 transition-all hover:border-primary/40 hover:bg-white"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-sm font-bold text-secondary">
                    {item.customerName}
                  </span>
                  <span className="font-mono text-xs font-semibold text-ink/60">
                    {item.customerMasked}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-ink/65 font-mono">
                  <span>Min Bill: ₹{item.amount}</span>
                  <span>•</span>
                  <span>{item.formattedTime}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleApprove(item)}
                  disabled={processingId === item.id}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white shadow-brand-sm transition hover:bg-emerald-700 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {processingId === item.id ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  <span>1-Tap Approve</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleReject(item)}
                  disabled={processingId === item.id}
                  className="inline-flex min-h-[40px] items-center gap-1 rounded-xl border border-red-200 bg-white px-3 text-xs font-bold text-red-600 transition hover:bg-red-50 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

