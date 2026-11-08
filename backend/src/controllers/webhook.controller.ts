import type { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../config/db.js";
import { verifyRazorpayWebhookSignature } from "../config/razorpay.js";

/**
 * Handles incoming Razorpay webhook events using raw body verification.
 */
export async function razorpayWebhookHandler(req: FastifyRequest, reply: FastifyReply) {
  const signature = req.headers["x-razorpay-signature"];

  // 1. Mandatory signature header presence check (VULN-01 fail-closed)
  if (!signature || typeof signature !== "string" || !signature.trim()) {
    req.log.warn("❌ Rejected Razorpay webhook: missing or empty 'x-razorpay-signature' header");
    return reply.status(400).send({ error: "Missing or invalid webhook signature" });
  }

  // 2. Raw request body retrieval (fastify-raw-body plugin field)
  const rawBody = (req as any).rawBody;
  if (!rawBody || (typeof rawBody !== "string" && !Buffer.isBuffer(rawBody))) {
    req.log.error("❌ Rejected Razorpay webhook: raw body unavailable for signature verification");
    return reply.status(400).send({ error: "Missing raw request body for signature verification" });
  }

  // 3. HMAC-SHA256 signature verification against dedicated RAZORPAY_WEBHOOK_SECRET
  const isValid = verifyRazorpayWebhookSignature(rawBody, signature.trim());
  if (!isValid) {
    req.log.warn("❌ Rejected Razorpay webhook: invalid signature or unconfigured webhook secret");
    return reply.status(400).send({ error: "Invalid signature" });
  }

  try {
    let event: any;
    if (typeof req.body === "string") {
      event = JSON.parse(req.body);
    } else if (req.body && typeof req.body === "object") {
      event = req.body;
    } else if (typeof rawBody === "string") {
      event = JSON.parse(rawBody);
    } else if (Buffer.isBuffer(rawBody)) {
      event = JSON.parse(rawBody.toString("utf8"));
    }

    if (!event || !event.event) {
      return reply.status(400).send({ error: "Invalid webhook payload structure" });
    }

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

