import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";

export function errorHandler(
  error: FastifyError,
  req: FastifyRequest,
  reply: FastifyReply
) {
  req.log.error(error);

  // Handle Zod schema errors
  if (error instanceof ZodError) {
    return reply.status(400).send({
      success: false,
      error: error.issues[0]?.message || "Validation failed",
      issues: error.issues,
    });
  }

  // Handle Prisma unique constraint violation (P2002)
  if ((error as any).code === "P2002") {
    const target = (error as any).meta?.target;
    if (Array.isArray(target) && target.includes("visit_date_ist")) {
      return reply.status(409).send({
        success: false,
        locked: true,
        message: "Today's visit verified! Next stamp unlocks strictly at 12:00:00 AM IST.",
      });
    }
    return reply.status(409).send({
      success: false,
      error: "A record with this unique field already exists.",
    });
  }

  // Fastify standard error code
  const statusCode = error.statusCode || 500;
  return reply.status(statusCode).send({
    success: false,
    error: error.message || "Internal server error",
  });
}

