import { prisma } from "../config/db.js";

export interface AuthorizeMerchantResult {
  authorized: boolean;
  statusCode: number;
  error?: string;
  message?: string;
  merchant?: {
    id: string;
    ownerId: string | null;
    name?: string;
  };
}

/**
 * Validates that an authenticated user has legitimate access to a specific merchant counter.
 * Enforces strict multi-tenant isolation:
 * - Missing merchantId -> 400 Bad Request
 * - Missing/unauthenticated user -> 401 Unauthorized
 * - Unknown merchantId -> 404 Not Found
 * - ADMIN role -> 200 Authorized
 * - MERCHANT role matching merchant.ownerId -> 200 Authorized
 * - Any cross-tenant attempt (user is not owner) -> 403 Forbidden
 */
export async function authorizeMerchantAccess(
  merchantId: string | undefined | null,
  user: { userId?: string; role?: string } | undefined | null
): Promise<AuthorizeMerchantResult> {
  if (!merchantId || typeof merchantId !== "string" || !merchantId.trim()) {
    return {
      authorized: false,
      statusCode: 400,
      error: "merchantId is required",
      message: "merchantId is required",
    };
  }

  const cleanMerchantId = merchantId.trim();

  if (!user || !user.userId) {
    return {
      authorized: false,
      statusCode: 401,
      error: "UNAUTHORIZED",
      message: "Authentication required.",
    };
  }

  const merchant = await prisma.merchant.findUnique({
    where: { id: cleanMerchantId },
    select: {
      id: true,
      ownerId: true,
      name: true,
    },
  });

  if (!merchant) {
    return {
      authorized: false,
      statusCode: 404,
      error: "MERCHANT_NOT_FOUND",
      message: "Merchant store not found.",
    };
  }

  // Administrators have full visibility across counters
  if (user.role === "ADMIN") {
    return {
      authorized: true,
      statusCode: 200,
      merchant,
    };
  }

  // Merchant owners can strictly access their own counter
  if (user.role === "MERCHANT" && merchant.ownerId === user.userId) {
    return {
      authorized: true,
      statusCode: 200,
      merchant,
    };
  }

  // Any other scenario is a cross-tenant unauthorized access attempt
  return {
    authorized: false,
    statusCode: 403,
    error: "FORBIDDEN",
    message: "Unauthorized: you do not own this merchant counter.",
  };
}
