import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { executeDailyReset } from "../cron/daily-reset.cron.js";
import { env } from "../config/env.js";

export async function cronRoutes(app: FastifyInstance) {
  // Protected endpoint to invoke daily reset externally (e.g. Render Cron, Vercel Cron, GitHub Actions)
  app.get("/daily-reset", async (req: FastifyRequest, reply: FastifyReply) => {
    const cronSecret =
      (req.headers["x-cron-secret"] as string) ||
      (req.headers.authorization ? req.headers.authorization.replace(/^Bearer\s+/i, "") : "");

    if (cronSecret !== env.CRON_SECRET && env.NODE_ENV === "production") {
      return reply.status(401).send({ error: "Unauthorized: Invalid CRON_SECRET" });
    }

    try {
      const result = await executeDailyReset();
      return reply.status(200).send(result);
    } catch (err: any) {
      req.log.error(err);
      return reply.status(500).send({ success: false, error: err.message });
    }
  });
}

