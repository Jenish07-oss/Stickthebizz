/**
 * Resilient API Client for Indian Retail Networks (Jio / 2G / 3G / 4G)
 * Features:
 * - 10-second request timeout
 * - 3x exponential backoff retry on transient failure
 * - Slow network detection & custom notification triggers
 */

export interface FetchOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
  backoffMs?: number;
  onSlowConnection?: () => void;
}

export async function resilientFetch<T = any>(
  url: string,
  options: FetchOptions = {}
): Promise<{ data: T | null; error: Error | null; status: number }> {
  const {
    timeoutMs = 10000,
    retries = 3,
    backoffMs = 800,
    onSlowConnection,
    ...fetchInit
  } = options;

  let attempt = 0;
  let lastError: Error | null = null;
  let lastStatus = 0;

  while (attempt < retries) {
    attempt++;
    const controller = new AbortController();
    const slowTimer = setTimeout(() => {
      if (onSlowConnection) onSlowConnection();
    }, 2500);

    const timeoutTimer = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    try {
      const res = await fetch(url, {
        ...fetchInit,
        signal: controller.signal,
      });

      clearTimeout(slowTimer);
      clearTimeout(timeoutTimer);
      lastStatus = res.status;

      if (!res.ok && res.status >= 500 && attempt < retries) {
        // Retry server 5xx errors
        await new Promise((r) => setTimeout(r, backoffMs * Math.pow(2, attempt - 1)));
        continue;
      }

      let data: T | null = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      return { data, error: null, status: res.status };
    } catch (err: any) {
      clearTimeout(slowTimer);
      clearTimeout(timeoutTimer);
      lastError = err;

      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, backoffMs * Math.pow(2, attempt - 1)));
      }
    }
  }

  return {
    data: null,
    error: lastError || new Error("Request failed after retries"),
    status: lastStatus || 504,
  };
}
