"use client";

import React, { useState } from "react";
import { Star, X, CheckCircle, MessageSquare } from "lucide-react";
import { useStore } from "@/context/StoreContext";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReviewModal({ isOpen, onClose }: ReviewModalProps) {
  const { customer, submitReview } = useStore();
  const [rating, setRating] = useState(customer.rating || 5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState(customer.comment || "");
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const isEligible = customer.visits >= 1;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEligible) return;
    submitReview(rating, comment);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl border border-border bg-white p-6 shadow-float">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full text-ink/60 transition hover:bg-sand"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {submitted ? (
          <div className="py-8 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-success" />
            <h3 className="mt-4 font-display text-xl font-extrabold text-secondary">
              Thank You!
            </h3>
            <p className="mt-2 text-sm text-ink/70">
              Your verified review helps this local shop thrive.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary">
                <MessageSquare className="h-4 w-4" />
              </span>
              <div>
                <h3 className="font-display text-lg font-extrabold text-secondary">
                  Rate Your Experience
                </h3>
                <p className="text-xs text-ink/60">
                  Verified customer review • Unlocked after Visit #1
                </p>
              </div>
            </div>

            {!isEligible ? (
              <div className="mt-6 rounded-2xl bg-sand/60 p-5 text-center">
                <p className="text-sm font-semibold text-secondary">
                  Reviews unlock strictly after your 1st verified counter visit!
                </p>
                <p className="mt-2 text-xs text-ink/65">
                  Scan the counter QR on your first purchase to share your rating.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-4 inline-flex min-h-[48px] items-center rounded-full bg-secondary px-6 text-sm font-bold text-white hover:bg-primary"
                >
                  Got It
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                {/* Star Selector */}
                <div className="flex flex-col items-center justify-center rounded-2xl bg-sand/40 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-ink/60">
                    Tap to rate
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="grid h-12 w-12 place-items-center rounded-xl transition hover:scale-110 focus:outline-none"
                        aria-label={`Rate ${star} stars`}
                      >
                        <Star
                          className={`h-7 w-7 transition ${
                            (hoverRating || rating) >= star
                              ? "fill-warning text-warning"
                              : "text-border"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="mt-1 font-mono text-xs font-bold text-secondary">
                    {rating === 5
                      ? "5.0 - Outstanding!"
                      : rating === 4
                      ? "4.0 - Really Good"
                      : rating === 3
                      ? "3.0 - Average"
                      : `${rating}.0 - Could be better`}
                  </span>
                </div>

                {/* Comment textarea */}
                <div>
                  <label
                    htmlFor="comment"
                    className="block text-xs font-bold uppercase tracking-wider text-ink/70"
                  >
                    Quick feedback (Optional, max 160 chars)
                  </label>
                  <textarea
                    id="comment"
                    rows={3}
                    maxLength={160}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="e.g. Loved the special ginger chai! Very friendly counter staff."
                    className="mt-1.5 w-full rounded-2xl border border-border bg-white p-3 text-sm text-ink placeholder:text-ink/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <div className="mt-1 text-right font-mono text-[11px] text-ink/50">
                    {comment.length}/160
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="flex min-h-[48px] w-full items-center justify-center rounded-full bg-primary font-bold text-white shadow-sm transition hover:bg-secondary"
                >
                  Submit Verified Review
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
