import type { FastifyRequest, FastifyReply } from "fastify";
import {
  validatePromoCodeService,
  createSubscriptionOrderService,
  activateSubscriptionService,
  checkMerchantSubscriptionStatus,
} from "../services/subscription.service.js";

export async function validatePromoHandler(req: FastifyRequest, reply: FastifyReply) {
  const body = (req.body as any) || {};
  const code = body.code || body.promoCode;
  const planId = body.planId || "MONTHLY";

  if (!code) {
    return reply.status(400).send({ success: false, message: "Please provide a promo code" });
  }

  const result = await validatePromoCodeService({ code, planId });
  return reply.status(result.success ? 200 : 400).send(result);
}

export async function createOrderHandler(req: FastifyRequest, reply: FastifyReply) {
  const body = (req.body as any) || {};

  if (!body.shopName || !body.email || !body.mobile) {
    return reply.status(400).send({
      success: false,
      message: "shopName, email, and mobile are required.",
    });
  }

  const result = await createSubscriptionOrderService({
    planId: body.planId || "MONTHLY",
    promoCode: body.promoCode,
    shopName: body.shopName,
    email: body.email,
    mobile: body.mobile,
  });

  return reply.status(result.success ? 200 : 400).send(result);
}

export async function activateHandler(req: FastifyRequest, reply: FastifyReply) {
  if (!req.user) {
    return reply.status(401).send({ success: false, error: "UNAUTHORIZED" });
  }

  const body = (req.body as any) || {};

  try {
    const result = await activateSubscriptionService({
      orderId: body.orderId,
      paymentId: body.paymentId,
      signature: body.signature,
      planId: body.planId || "MONTHLY",
      promoCode: body.promoCode,
      shopName: body.shopName,
      ownerName: body.ownerName,
      category: body.category,
      mobile: body.mobile,
      email: body.email,
      ownerUserId: req.user.userId,
    });

    return reply.status(200).send(result);
  } catch (err: any) {
    return reply.status(400).send({ success: false, message: err.message });
  }
}

export async function checkStatusHandler(req: FastifyRequest, reply: FastifyReply) {
  const params = (req.params as any) || {};
  const query = (req.query as any) || {};
  const merchantId = params.merchantId || query.merchantId;

  if (!merchantId) {
    return reply.status(400).send({ success: false, error: "merchantId is required" });
  }

  const result = await checkMerchantSubscriptionStatus(merchantId);
  return reply.status(200).send(result);
}

