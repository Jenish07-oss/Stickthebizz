import type { FastifyInstance } from "fastify";
import {
  getWalletHandler,
  updateProfileHandler,
  syncAccountHandler,
  exportDataHandler,
  deleteAccountHandler,
} from "../controllers/customer.controller.js";
import { authenticate, optionalAuthenticate } from "../middlewares/auth.middleware.js";

export async function customerRoutes(app: FastifyInstance) {
  // Wallet: view store passes and stamps (supports optional auth or query fallback)
  app.get("/wallet", { preHandler: [optionalAuthenticate] }, getWalletHandler);

  // Profile update (name and phone)
  app.patch("/profile", { preHandler: [authenticate] }, updateProfileHandler);

  // Link accounts
  app.post("/sync", { preHandler: [authenticate] }, syncAccountHandler);

  // DPDP Act 2023 Compliance
  app.get("/export", { preHandler: [authenticate] }, exportDataHandler);
  app.delete("/profile", { preHandler: [authenticate] }, deleteAccountHandler);
}

