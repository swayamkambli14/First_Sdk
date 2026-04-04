/**
 * HTTP client with retry + exponential backoff.
 * No external dependencies — uses native fetch.
 */
import { ChainLoyaltyError } from './types.js';

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

interface ErrorBody {
  error?: string;
  message?: string;
  errorCode?: string;
  statusCode?: number;
}

export async function request<T>(
  url: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    method = 'GET',
    body,
    headers = {},
    timeout = 10_000,
    retries = 3,
  } = options;

  let lastError: ChainLoyaltyError | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      // Exponential backoff: 500ms, 1000ms, 2000ms
      await sleep(500 * Math.pow(2, attempt - 1));
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
        credentials: 'include',
      });

      clearTimeout(timer);

      if (!response.ok) {
        let errorBody: ErrorBody = {};
        try {
          errorBody = await response.json() as ErrorBody;
        } catch { /* ignore parse errors */ }

        const err = new ChainLoyaltyError(
          errorBody.message ?? `HTTP ${response.status}`,
          errorBody.errorCode ?? errorBody.error ?? 'API_ERROR',
          response.status,
          errorBody,
        );

        // Don't retry 4xx errors (client errors)
        if (response.status >= 400 && response.status < 500) {
          throw err;
        }

        lastError = err;
        continue; // retry 5xx
      }

      return await response.json() as T;
    } catch (err) {
      if (err instanceof ChainLoyaltyError) throw err;

      const isAbort = err instanceof Error && err.name === 'AbortError';
      lastError = new ChainLoyaltyError(
        isAbort ? `Request timed out after ${timeout}ms` : (err instanceof Error ? err.message : 'Network error'),
        isAbort ? 'TIMEOUT' : 'NETWORK_ERROR',
        0,
      );
    }
  }

  throw lastError ?? new ChainLoyaltyError('Request failed after retries', 'MAX_RETRIES', 0);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
