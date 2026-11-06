import type { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../config/db.js";
import { verifyRazorpayWebhookSignature } from "../config/razorpay.js";

/**
 * Handles incoming Razorpay webhook events using raw body verification.
 */
export async function razorpayWebhookHandler(req: FastifyRequest, reply: FastifyReply) {
  const signature = req.headers["x-razorpay-signature"] as string;

  // Use fastify-raw-body to get raw buffer / string
  const rawBody = (req as any).rawBody || JSON.stringify(req.body);

  if (signature) {
    const isValid = verifyRazorpayWebhookSignature(rawBody, signature);
    if (!isValid) {
      req.log.warn("❌ Invalid Razorpay webhook signature");
      return reply.status(400).send({ error: "Invalid signature" });
    }
  }

  try {
    const event = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    if (event.event === "payment.captured" || event.event === "order.paid") {
      const payment = event.payload?.payment?.entity;
      const orderNotes = payment?.notes || {};
      const plan = orderNotes.plan === "YEARLY" ? "YEARLY" : "MONTHLY";
      const email = orderNotes.email;

      if (email) {
        const durationDays = plan === "YEARLY" ? 365 : 30;
        const now = new Date();
        const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
        const graceEndsAt = new Date(expiresAt.getTime() + 1 * 24 * 60 * 60 * 1000);

        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          include: { merchants: true },
        });

        if (user && user.merchants.length > 0) {
          await prisma.merchant.update({
            where: { id: user.merchants[0].id },
            data: {
              subscriptionStatus: "ACTIVE",
              subscriptionPlan: plan,
              subscriptionStartedAt: now,
              subscriptionExpiresAt: expiresAt,
              gracePeriodEndsAt: graceEndsAt,
              razorpayPaymentId: payment.id,
              razorpayOrderId: payment.order_id,
            },
          });

          await prisma.auditLog.create({
            data: {
              actorType: "WEBHOOK_RAZORPAY",
              action: "SUBSCRIPTION_AUTO_EXTENDED",
              resourceId: user.merchants[0].id,
              details: { paymentId: payment.id, orderId: payment.order_id, plan },
            },
          });
        }
      }
    }

    return reply.status(200).send({ status: "ok" });
  } catch (err: any) {
    req.log.error("Webhook processing error:", err);
    return reply.status(500).send({ error: err.message });
  }
}

