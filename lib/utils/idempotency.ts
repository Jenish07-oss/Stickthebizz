import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

export interface IdempotencyCheckResult {
  isDuplicate: boolean;
  conflict?: boolean;
  cachedResponse?: any;
}

/**
 * Generates an SHA-256 hash of a payload object.
 */
function hashPayload(payload: any): string {
  const serialized = typeof payload === "string" ? payload : JSON.stringify(payload || {});
  return crypto.createHash("sha256").update(serialized).digest("hex");
}

/**
 * Checks if an idempotency key has already been executed for this endpoint.
 */
export async function checkIdempotency(
  key: string | undefined,
  endpoint: string,
  payload: any
): Promise<IdempotencyCheckResult> {
  if (!key) {
    return { isDuplicate: false };
  }

  try {
    const supabase = await createClient();
    const reqHash = hashPayload(payload);

    const { data, error } = await supabase
      .from("idempotency_keys")
      .select("request_hash, response_status, response_body, expires_at")
      .eq("key", key)
      .eq("endpoint", endpoint)
      .maybeSingle();

    if (error || !data) {
      return { isDuplicate: false };
    }

    // Check expiration (24h window)
    if (new Date(data.expires_at).getTime() < Date.now()) {
      return { isDuplicate: false };
    }

    if (data.request_hash !== reqHash) {
      return { isDuplicate: true, conflict: true };
    }

    return {
      isDuplicate: true,
      conflict: false,
      cachedResponse: data.response_body,
    };
  } catch (err) {
    console.error("Idempotency lookup error:", err);
    return { isDuplicate: false };
  }
}

/**
 * Saves the response of an executed operation under the idempotency key.
 */
export async function saveIdempotency(
  key: string | undefined,
  endpoint: string,
  payload: any,
  status: number,
  responseBody: any,
  userId?: string
): Promise<void> {
  if (!key) return;

  try {
    const supabase = await createClient();
    const reqHash = hashPayload(payload);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h

    await supabase.from("idempotency_keys").upsert({
      key,
      endpoint,
      user_id: userId || null,
      request_hash: reqHash,
      response_status: status,
      response_body: responseBody,
      expires_at: expiresAt,
    });
  } catch (err) {
    console.error("Idempotency save error:", err);
  }
}

