"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { MessageSquare, Mail, Phone, Send, CheckCircle2, Store, Clock } from "lucide-react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [shopName, setShopName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="flex min-h-screen flex-col bg-sand overflow-x-hidden">
      <Navbar />

      <main className="flex-1 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-white/80 px-4 py-1.5 font-mono text-xs font-bold text-secondary shadow-sm">
              <MessageSquare className="h-4 w-4 text-primary" />
              MERCHANT SUPPORT &amp; ONBOARDING
            </div>
            <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-secondary sm:text-5xl">
              We&apos;re Here to Help Your Counter Grow.
            </h1>
            <p className="mt-3 text-base text-ink/75">
              Need assistance printing your QR stand or setting up custom visit rules? Connect directly with our team.
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-12">
            {/* Direct Contact Cards (5 cols) */}
            <div className="space-y-4 md:col-span-5">
              {/* Direct Email Card */}
              <div className="rounded-3xl border border-border bg-white p-6 shadow-card">
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <Mail className="h-6 w-6" />
                  </span>
                  <div>
                    <h2 className="font-display text-base font-extrabold text-secondary">
                      Email Merchant Support
                    </h2>
                    <p className="text-xs text-ink/65">Direct response within 2 hours</p>
                  </div>
                </div>
                <p className="mt-4 text-xs text-ink/75 leading-relaxed">
                  Have questions about your counter setup, QR standee delivery, or billing? Message our priority merchant desk.
                </p>
                <a
                  href="mailto:support@stickthebizz.in"
                  className="mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white shadow-sm transition hover:bg-secondary"
                >
                  <Mail className="h-4 w-4" />
                  support@stickthebizz.in
                </a>
              </div>

              {/* Operating Info Card */}
              <div className="rounded-3xl border border-border bg-white p-6 shadow-card space-y-3">
                <div className="flex items-center gap-2 text-secondary font-display font-bold text-sm">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>Support Desk Hours</span>
                </div>
                <p className="text-xs text-ink/70 leading-relaxed">
                  Monday &ndash; Saturday • 9:00 AM &ndash; 8:00 PM IST
                </p>
                <div className="pt-2 border-t border-border/60 text-xs text-ink/65">
                  <p className="font-bold text-secondary">StickTheBizz Pvt Ltd</p>
                  <p className="mt-0.5">Empowering Bharat&apos;s retail counters with simple digital passes.</p>
                </div>
              </div>
            </div>

            {/* Quick Inquiry Form (7 cols) */}
            <div className="rounded-[2.5rem] border border-border bg-white p-8 shadow-card md:col-span-7">
              <div className="flex items-center gap-2 border-b border-border/70 pb-4">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-sand text-secondary">
                  <Store className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-display text-xl font-extrabold text-secondary">
                    Request Free Counter QR Kit
                  </h2>
                  <p className="text-xs text-ink/65">
                    We will send you a pre-printed QR stand within 3 business days.
                  </p>
                </div>
              </div>

              {submitted ? (
                <div className="py-12 text-center">
                  <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
                  <h3 className="mt-4 font-display text-2xl font-extrabold text-secondary">
                    Request Received!
                  </h3>
                  <p className="mt-2 text-sm text-ink/75">
                    Thank you, {name}! Our merchant onboarding manager will reach out directly to <span className="font-mono font-bold text-secondary">{phone}</span> to confirm your shop details.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setName("");
                      setShopName("");
                      setPhone("");
                      setMessage("");
                    }}
                    className="mt-6 inline-flex min-h-[48px] items-center rounded-full bg-secondary px-6 text-sm font-bold text-white hover:bg-primary"
                  >
                    Submit Another Inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div>
                    <label
                      htmlFor="ownerName"
                      className="block text-xs font-bold uppercase tracking-wider text-ink/70"
                    >
                      Your Name
                    </label>
                    <input
                      id="ownerName"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ramesh Patel"
                      className="mt-1.5 w-full rounded-xl border border-border p-3 text-sm font-medium text-ink focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="shop"
                        className="block text-xs font-bold uppercase tracking-wider text-ink/70"
                      >
                        Shop / Business Name
                      </label>
                      <input
                        id="shop"
                        type="text"
                        required
                        value={shopName}
                        onChange={(e) => setShopName(e.target.value)}
                        placeholder="e.g. Chai Shai Corner"
                        className="mt-1.5 w-full rounded-xl border border-border p-3 text-sm font-medium text-ink focus:border-primary focus:outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="mobile"
                        className="block text-xs font-bold uppercase tracking-wider text-ink/70"
                      >
                        10-Digit Mobile Number
                      </label>
                      <input
                        id="mobile"
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. 9820012345"
                        className="mt-1.5 w-full rounded-xl border border-border p-3 text-sm font-medium text-ink focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="note"
                      className="block text-xs font-bold uppercase tracking-wider text-ink/70"
                    >
                      Business Type or Question (Optional)
                    </label>
                    <textarea
                      id="note"
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="e.g. We run a bakery in Ahmedabad and want 2 counter QR stands."
                      className="mt-1.5 w-full rounded-xl border border-border p-3 text-sm font-medium text-ink focus:border-primary focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white shadow-sm transition hover:bg-secondary"
                  >
                    <Send className="h-4 w-4" />
                    Send Free Kit Request
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
