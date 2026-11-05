"use client";

import React, { useState } from "react";
import { Star, CheckCircle2, MessageSquare, Send, Sparkles } from "lucide-react";

export default function WriteReviewSection() {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [name, setName] = useState("");
  const [shopName, setShopName] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <section className="bg-sand/30 border-y border-border px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-[2.2rem] border border-border bg-white p-6 shadow-card sm:p-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-coral/15 px-3 py-1 font-mono text-xs font-bold text-primary">
                <MessageSquare className="h-3.5 w-3.5" />
                CUSTOMER &amp; MERCHANT FEEDBACK
              </span>
              <h2 className="mt-2 font-display text-2xl font-extrabold text-secondary sm:text-3xl">
                Write a Review
              </h2>
              <p className="mt-1 text-xs text-ink/70">
                Share your experience using StickTheBizz at your shop or local counter.
              </p>
            </div>
            <div className="flex items-center gap-1 bg-sand/60 px-3.5 py-1.5 rounded-full border border-border">
              <Star className="h-4 w-4 fill-warning text-warning" />
              <span className="font-mono text-xs font-extrabold text-secondary">
                4.9 / 5.0
              </span>
              <span className="text-[11px] text-ink/60 font-semibold ml-1">
                (Verified)
              </span>
            </div>
          </div>

          {submitted ? (
            <div className="py-8 text-center animate-in fade-in duration-300">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h3 className="mt-3 font-display text-lg font-extrabold text-secondary">
                Thank you for your review!
              </h3>
              <p className="mt-1 text-xs text-ink/70 max-w-md mx-auto">
                Your feedback has been received and verified. Thank you for helping small businesses across India thrive!
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setName("");
                  setShopName("");
                  setReviewText("");
                  setRating(5);
                }}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-secondary px-5 py-2 text-xs font-bold text-white transition hover:bg-secondary/90"
              >
                Submit Another Review
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {/* Star Rating Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                  Your Rating
                </label>
                <div className="mt-1.5 flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 text-warning transition transform hover:scale-110 focus:outline-none"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          (hoverRating || rating) >= star
                            ? "fill-warning text-warning"
                            : "text-border"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 font-mono text-xs font-extrabold text-secondary">
                    {rating} of 5 Stars
                  </span>
                </div>
              </div>

              {/* Name & Shop Grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ramesh Sharma"
                    className="mt-1 w-full rounded-xl border border-border bg-sand/20 px-3.5 py-2.5 text-xs font-semibold text-secondary placeholder:text-ink/35 focus:border-primary focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                    Shop Name / Role (Optional)
                  </label>
                  <input
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="e.g. Sharma Cafe / Regular Diner"
                    className="mt-1 w-full rounded-xl border border-border bg-sand/20 px-3.5 py-2.5 text-xs font-semibold text-secondary placeholder:text-ink/35 focus:border-primary focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Review Text Area */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                  Your Review &amp; Experience
                </label>
                <textarea
                  required
                  rows={3}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="How has digital punch cards improved repeat visits, customer smiles, or cashier flow at your counter?"
                  className="mt-1 w-full rounded-xl border border-border bg-sand/20 p-3.5 text-xs font-semibold text-secondary placeholder:text-ink/35 focus:border-primary focus:bg-white focus:outline-none"
                />
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-ink/60">
                  ✓ Verified reviews are moderated per DPDP community guidelines.
                </span>
                <button
                  type="submit"
                  disabled={isSubmitting || !reviewText.trim() || !name.trim()}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-primary px-6 text-xs font-bold text-white shadow-sm transition hover:bg-secondary disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{isSubmitting ? "Submitting..." : "Post Review"}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
