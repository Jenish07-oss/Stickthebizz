import type { FastifyInstance } from "fastify";
import { healthRoutes } from "./health.routes.js";
import { authRoutes } from "./auth.routes.js";
import { scanRoutes } from "./scan.routes.js";
import { customerRoutes } from "./customer.routes.js";
import { merchantRoutes } from "./merchant.routes.js";
import { subscriptionRoutes } from "./subscription.routes.js";
import { webhookRoutes } from "./webhook.routes.js";
import { cronRoutes } from "./cron.routes.js";

/**
 * Registers all REST API v1 endpoints under `/api/v1`.
 */
export async function registerApiRoutes(app: FastifyInstance) {
  await app.register(healthRoutes, { prefix: "/api/v1/health" });
  await app.register(authRoutes, { prefix: "/api/v1/auth" });
  await app.register(scanRoutes, { prefix: "/api/v1/scans" });
  await app.register(customerRoutes, { prefix: "/api/v1/customers" });
  await app.register(merchantRoutes, { prefix: "/api/v1/merchant" });
  await app.register(subscriptionRoutes, { prefix: "/api/v1/subscriptions" });
  await app.register(webhookRoutes, { prefix: "/api/v1/webhooks" });
  await app.register(cronRoutes, { prefix: "/api/v1/cron" });
}

