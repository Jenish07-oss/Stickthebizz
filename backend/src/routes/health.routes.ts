import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { getTodayISTDateString } from "../utils/ist.js";

export async function healthRoutes(fastify: FastifyInstance) {
  const handler = async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.status(200).send({
      status: "ok",
      service: "stickthebizz-backend",
      version: "2.0.0",
      timezone: "Asia/Kolkata",
      todayIST: getTodayISTDateString(),
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    });
  };

  // Mount at both root and /health for prefix flexibility
  fastify.get("/", handler);
  fastify.get("/health", handler);
}
