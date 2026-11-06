import type { FastifyInstance } from "fastify";
import {
  submitScanHandler,
  approveVisitHandler,
  rejectVisitHandler,
  redeemVoucherHandler,
  getStatusHandler,
  getPendingVisitsHandler,
  getLedgerHandler,
} from "../controllers/scan.controller.js";
import { authenticate, optionalAuthenticate, requireRole } from "../middlewares/auth.middleware.js";
import { rateLimit } from "../middlewares/ratelimit.middleware.js";

export async function scanRoutes(app: FastifyInstance) {
  // Public counter punch route with rate limiting & optional customer auth
  app.post(
    "/punch",
    {
      preHandler: [
        rateLimit({ windowMs: 60 * 1000, maxRequests: 20, message: "Too many scan attempts. Please wait." }),
        optionalAuthenticate,
      ],
    },
    submitScanHandler
  );

  // Cashier approval & rejection routes (Merchant authenticated)
  app.post(
    "/approve",
    { preHandler: [authenticate, requireRole(["MERCHANT", "ADMIN"])] },
    approveVisitHandler
  );
  app.post(
    "/:id/approve",
    { preHandler: [authenticate, requireRole(["MERCHANT", "ADMIN"])] },
    approveVisitHandler
  );

  app.post(
    "/reject",
    { preHandler: [authenticate, requireRole(["MERCHANT", "ADMIN"])] },
    rejectVisitHandler
  );
  app.post(
    "/:id/reject",
    { preHandler: [authenticate, requireRole(["MERCHANT", "ADMIN"])] },
    rejectVisitHandler
  );

  // 4-digit PIN voucher redemption
  app.post(
    "/redeem",
    { preHandler: [authenticate, requireRole(["MERCHANT", "ADMIN"])] },
    redeemVoucherHandler
  );

  // Check customer lock status
  app.get("/status", { preHandler: [optionalAuthenticate] }, getStatusHandler);

  // Merchant queue & ledger
  app.get(
    "/pending",
    { preHandler: [authenticate, requireRole(["MERCHANT", "ADMIN"])] },
    getPendingVisitsHandler
  );
  app.get(
    "/ledger",
    { preHandler: [authenticate, requireRole(["MERCHANT", "ADMIN"])] },
    getLedgerHandler
  );
}

