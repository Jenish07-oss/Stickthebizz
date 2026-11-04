/**
 * Lightweight, dependency-free HTML/script sanitizer.
 * Strips tags, event handlers, javascript: URIs, encodes dangerous chars.
 */
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== "string") return "";
  
  return input
    // Remove script tags and content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    // Remove all HTML tags
    .replace(/<[^>]*>/g, "")
    // Remove event handlers (onclick, onload, etc.)
    .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, "")
    // Remove javascript: URIs
    .replace(/javascript\s*:/gi, "")
    // Encode dangerous characters
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/\//g, "&#x2F;")
    // Normalize whitespace
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Masks phone number for display: +91 98*** **12
 */
export function maskPhone(phone: string): string {
  const clean = phone.replace(/\D/g, "");
  if (clean.length !== 10) return phone; // Don't mask if not standard
  return `+91 ${clean.slice(0, 2)}*** **${clean.slice(8)}`;
}

/**
 * Sanitizes error messages for client consumption.
 * Removes SQL, internal codes, stack traces.
 */
export function sanitizeError(error: unknown): string {
  if (!error) return "Operation failed";
  
  const msg = error instanceof Error ? error.message : String(error);
  
  // Suppress specific Postgres/Supabase internals
  if (msg.includes("duplicate key") || msg.includes("23505")) return "This record already exists";
  if (msg.includes("foreign key") || msg.includes("23503")) return "Invalid reference";
  if (msg.includes("23514")) return "Invalid input value";
  if (msg.includes("JWT") || msg.includes("token") || msg.includes("JWKS")) return "Authentication failed";
  if (msg.includes("permission denied") || msg.includes("RLS")) return "Access denied";
  if (msg.includes("connection") || msg.includes("timeout") || msg.includes("ECONNREFUSED")) return "Service temporarily unavailable";
  
  // Generic fallback
  return "Operation failed. Please try again.";
}
