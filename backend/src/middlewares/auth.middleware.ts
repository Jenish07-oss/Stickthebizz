import { FastifyRequest, FastifyReply } from "fastify";
import { verifyAccessToken, TokenPayload } from "../utils/jwt";

// Augment FastifyRequest to include authenticated user
declare module "fastify" {
  interface FastifyRequest {
    user?: TokenPayload;
  }
}

/**
 * Extracts and verifies JWT Access Token from Bearer header or HTTP-only cookies
 */
export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  let token: string | undefined;

  // 1. Check Authorization Header (Bearer <token>)
  const authHeader = request.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.slice(7).trim();
  }

  // 2. Check HTTP-only Cookie fallback
  if (!token && request.cookies) {
    token = request.cookies.access_token || request.cookies.token;
  }

  if (!token) {
    return reply.status(401).send({
      success: false,
      error: "UNAUTHORIZED",
      message: "Authentication required. Please sign in to continue.",
    });
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    return reply.status(401).send({
      success: false,
      error: "TOKEN_EXPIRED",
      message: "Session expired. Please refresh your token or log in again.",
    });
  }

  request.user = payload;
}

/**
 * Optional authentication: extracts user if token present, but does not block if absent
 */
export async function optionalAuthenticate(request: FastifyRequest, _reply: FastifyReply) {
  let token: string | undefined;

  const authHeader = request.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.slice(7).trim();
  }

  if (!token && request.cookies) {
    token = request.cookies.access_token || request.cookies.token || request.cookies.stb_access_token;
  }

  if (token) {
    const payload = verifyAccessToken(token);
    if (payload) {
      request.user = payload;
    }
  }
}

export type AllowedRole = "MERCHANT" | "CUSTOMER" | "ADMIN";

/**
 * Role-Based Access Control middleware factory
 */
export function requireRole(allowedRoles: AllowedRole[] | AllowedRole) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: "UNAUTHORIZED",
        message: "Authentication required.",
      });
    }

    if (!roles.includes(request.user.role as AllowedRole)) {
      return reply.status(403).send({
        success: false,
        error: "FORBIDDEN",
        message: "You do not have permission to access this resource.",
      });
    }
  };
}

