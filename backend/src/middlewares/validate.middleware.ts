import type { FastifyRequest, FastifyReply } from "fastify";
import type { ZodSchema } from "zod";

/**
 * Validates request body with a Zod schema.
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issue = result.error.issues[0];
      const message = issue ? `${issue.path.join(".")}: ${issue.message}` : "Validation failed";
      return reply.status(400).send({
        success: false,
        error: message,
        issues: result.error.issues,
      });
    }
    req.body = result.data;
  };
}

/**
 * Validates request query with a Zod schema.
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const issue = result.error.issues[0];
      const message = issue ? `${issue.path.join(".")}: ${issue.message}` : "Validation failed";
      return reply.status(400).send({
        success: false,
        error: message,
        issues: result.error.issues,
      });
    }
    req.query = result.data as any;
  };
}

