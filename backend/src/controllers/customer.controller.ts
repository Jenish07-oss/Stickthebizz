import type { FastifyRequest, FastifyReply } from "fastify";
import {
  getCustomerWallet,
  updateCustomerProfile,
  syncCustomerAccount,
  exportCustomerData,
  deleteCustomerAccount,
} from "../services/customer.service.js";

export async function getWalletHandler(req: FastifyRequest, reply: FastifyReply) {
  const query = (req.query as any) || {};
  const authUser = req.user;

  const result = await getCustomerWallet({
    userId: authUser?.userId,
    email: authUser?.email || query.email,
    phone: query.phone,
  });

  return reply.status(200).send(result);
}

export async function updateProfileHandler(req: FastifyRequest, reply: FastifyReply) {
  if (!req.user) {
    return reply.status(401).send({ success: false, error: "UNAUTHORIZED" });
  }

  const body = (req.body as any) || {};
  if (!body.fullName || !body.phone) {
    return reply.status(400).send({
      success: false,
      error: "Both fullName and phone are required.",
    });
  }

  try {
    const result = await updateCustomerProfile({
      userId: req.user.userId,
      fullName: body.fullName,
      phone: body.phone,
    });
    return reply.status(200).send(result);
  } catch (err: any) {
    return reply.status(400).send({ success: false, error: err.message });
  }
}

export async function syncAccountHandler(req: FastifyRequest, reply: FastifyReply) {
  if (!req.user) {
    return reply.status(401).send({ success: false, error: "UNAUTHORIZED" });
  }

  const body = (req.body as any) || {};
  try {
    const result = await syncCustomerAccount({
      userId: req.user.userId,
      phone: body.phone,
      email: body.email,
      fullName: body.fullName,
    });
    return reply.status(200).send(result);
  } catch (err: any) {
    return reply.status(400).send({ success: false, error: err.message });
  }
}

export async function exportDataHandler(req: FastifyRequest, reply: FastifyReply) {
  if (!req.user) {
    return reply.status(401).send({ success: false, error: "UNAUTHORIZED" });
  }

  try {
    const data = await exportCustomerData(req.user.userId);
    return reply.status(200).send({ success: true, data });
  } catch (err: any) {
    return reply.status(400).send({ success: false, error: err.message });
  }
}

export async function deleteAccountHandler(req: FastifyRequest, reply: FastifyReply) {
  if (!req.user) {
    return reply.status(401).send({ success: false, error: "UNAUTHORIZED" });
  }

  try {
    const result = await deleteCustomerAccount(req.user.userId);
    // Clear cookies
    reply.clearCookie("stb_access_token", { path: "/" });
    reply.clearCookie("stb_refresh_token", { path: "/" });
    return reply.status(200).send(result);
  } catch (err: any) {
    return reply.status(400).send({ success: false, error: err.message });
  }
}

