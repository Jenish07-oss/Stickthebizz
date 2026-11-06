import type { FastifyInstance } from "fastify";
import { razorpayWebhookHandler } from "../controllers/webhook.controller.js";

export async function webhookRoutes(app: FastifyInstance) {
  // Mount Razorpay webhook listener with raw body parsing
  app.post("/razorpay", razorpayWebhookHandler);
}

