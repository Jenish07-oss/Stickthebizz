import type { FastifyInstance } from "fastify";
import {
  getMeHandler,
  getBySlugHandler,
  updateRulesHandler,
  rotateQrHandler,
  updatePinHandler,
} from "../controllers/merchant.controller.js";
import { authenticate, requireRole } from "../middlewares/auth.middleware.js";

export async function merchantRoutes(app: FastifyInstance) {
  // Public route for standee scan pass page: /s/:slug
  app.get("/slug/:slug", getBySlugHandler);

  // Authenticated shop owner terminal routes
  app.get("/me", { preHandler: [authenticate, requireRole(["MERCHANT", "ADMIN"])] }, getMeHandler);
  app.patch("/rules", { preHandler: [authenticate, requireRole(["MERCHANT", "ADMIN"])] }, updateRulesHandler);
  app.post("/rotate-qr", { preHandler: [authenticate, requireRole(["MERCHANT", "ADMIN"])] }, rotateQrHandler);
  app.patch("/terminal-pin", { preHandler: [authenticate, requireRole(["MERCHANT", "ADMIN"])] }, updatePinHandler);
}

