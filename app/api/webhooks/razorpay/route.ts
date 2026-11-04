import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers.get("x-razorpay-signature");

    const rawBody = await req.text();

    // Verify webhook signature if secret configured
    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      if (expectedSignature !== signature) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
      }
    }

    const event = JSON.parse(rawBody);

    if (event.event === "payment.captured" || event.event === "order.paid") {
      const payment = event.payload?.payment?.entity;
      const orderNotes = payment?.notes || {};
      const plan = orderNotes.plan || "MONTHLY";
      const email = orderNotes.email;

      if (email) {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const durationDays = plan === "YEARLY" ? 365 : 30;
        const now = new Date();
        const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
        const graceEndsAt = new Date(expiresAt.getTime() + 1 * 24 * 60 * 60 * 1000);

        // Update merchant
        await supabase
          .from("merchants")
          .update({
            subscription_status: "ACTIVE",
            subscription_plan: plan,
            subscription_started_at: now.toISOString(),
            subscription_expires_at: expiresAt.toISOString(),
            grace_period_ends_at: graceEndsAt.toISOString(),
            razorpay_payment_id: payment.id,
            razorpay_order_id: payment.order_id,
          })
          .eq("billing_email", email);
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (err: any) {
    console.error("Razorpay webhook error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
