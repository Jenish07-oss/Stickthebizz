import type { FastifyInstance } from "fastify";
import {
  validatePromoHandler,
  createOrderHandler,
  activateHandler,
  checkStatusHandler,
} from "../controllers/subscription.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

export async function subscriptionRoutes(app: FastifyInstance) {
  // Promo code validation (public / pre-auth)
  app.post("/validate-promo", validatePromoHandler);

  // Razorpay order creation (public / pre-auth)
  app.post("/create-order", createOrderHandler);

  // Activate plan (authenticated merchant)
  app.post("/activate", { preHandler: [authenticate] }, activateHandler);

  // Live subscription status & grace period check
  app.get("/status/:merchantId", checkStatusHandler);
  app.get("/status", checkStatusHandler);
}

