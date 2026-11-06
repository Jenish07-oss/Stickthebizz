import type { FastifyRequest, FastifyReply } from "fastify";
import {
  submitScan,
  approveVisit,
  rejectVisit,
  verifyRedemptionPin,
  getPendingVisits,
  getMerchantLedger,
  getCustomerMerchantStatus,
} from "../services/scan.service.js";

export async function submitScanHandler(req: FastifyRequest, reply: FastifyReply) {
  const body = (req.body as any) || {};
  const authUser = req.user;

  const result = await submitScan({
    customerPhone: body.customerPhone || body.phone,
    merchantId: body.merchantId,
    billAmount: body.billAmount ? Number(body.billAmount) : undefined,
    customerName: body.customerName || body.name,
    scannedQrToken: body.scannedQrToken || body.qrToken,
    idempotencyKey: body.idempotencyKey,
    authUserId: authUser?.userId,
    authUserEmail: authUser?.email,
  });

  if (!result.success && result.locked) {
    return reply.status(409).send(result);
  }

  if (!result.success) {
    return reply.status(400).send(result);
  }

  return reply.status(200).send(result);
}

export async function approveVisitHandler(req: FastifyRequest, reply: FastifyReply) {
  const params = (req.params as any) || {};
  const body = (req.body as any) || {};
  const visitId = params.id || body.visitId || body.checkinId;

  if (!visitId) {
    return reply.status(400).send({ success: false, error: "Missing visitId / checkinId" });
  }

  const result = await approveVisit(visitId, req.user?.userId);
  return reply.status(result.success ? 200 : 400).send(result);
}

export async function rejectVisitHandler(req: FastifyRequest, reply: FastifyReply) {
  const params = (req.params as any) || {};
  const body = (req.body as any) || {};
  const visitId = params.id || body.visitId || body.checkinId;

  if (!visitId) {
    return reply.status(400).send({ success: false, error: "Missing visitId / checkinId" });
  }

  const result = await rejectVisit(visitId, req.user?.userId);
  return reply.status(result.success ? 200 : 400).send(result);
}

export async function redeemVoucherHandler(req: FastifyRequest, reply: FastifyReply) {
  const body = (req.body as any) || {};
  const { merchantId, pin, customerPhone } = body;

  if (!merchantId || !pin) {
    return reply.status(400).send({
      success: false,
      message: "Both merchantId and 4-digit pin are required.",
    });
  }

  const result = await verifyRedemptionPin({
    merchantId,
    pin: String(pin),
    customerPhone: customerPhone ? String(customerPhone) : undefined,
    merchantOwnerUserId: req.user?.userId,
  });

  return reply.status(result.success ? 200 : 400).send(result);
}

export async function getStatusHandler(req: FastifyRequest, reply: FastifyReply) {
  const query = (req.query as any) || {};
  const merchantId = query.merchantId;

  if (!merchantId) {
    return reply.status(400).send({ success: false, error: "merchantId is required in query" });
  }

  const result = await getCustomerMerchantStatus({
    merchantId,
    customerPhone: query.customerPhone || query.phone,
    userId: req.user?.userId,
    email: req.user?.email,
  });

  return reply.status(200).send(result);
}

export async function getPendingVisitsHandler(req: FastifyRequest, reply: FastifyReply) {
  const query = (req.query as any) || {};
  const merchantId = query.merchantId;

  if (!merchantId) {
    return reply.status(400).send({ success: false, error: "merchantId is required" });
  }

  const result = await getPendingVisits(merchantId);
  return reply.status(200).send(result);
}

export async function getLedgerHandler(req: FastifyRequest, reply: FastifyReply) {
  const query = (req.query as any) || {};
  const merchantId = query.merchantId;

  if (!merchantId) {
    return reply.status(400).send({ success: false, error: "merchantId is required" });
  }

  const limit = query.limit ? parseInt(query.limit, 10) : 50;
  const result = await getMerchantLedger(merchantId, limit);
  return reply.status(200).send(result);
}

