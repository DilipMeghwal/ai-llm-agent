import { APIRequestContext, APIResponse } from '@playwright/test';

export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  data?: unknown;
  timeout?: number;
}

export interface RequestMetrics {
  durationMs: number;
  url: string;
  method: string;
  status: number;
  requestId: string;
}

export function createMockApiResponse(
  status: number,
  body: unknown,
  headers: Record<string, string> = { 'content-type': 'application/json' },
): APIResponse {
  return {
    status: () => status,
    statusText: () => (status >= 200 && status < 300 ? 'OK' : 'Error'),
    ok: () => status >= 200 && status < 300,
    url: () => 'http://localhost/api',
    headers: () => headers,
    headersArray: () => Object.entries(headers).map(([name, value]) => ({ name, value })),
    body: async () => Buffer.from(typeof body === 'string' ? body : JSON.stringify(body)),
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
    json: async () => (typeof body === 'string' ? JSON.parse(body) : body),
    dispose: async () => {},
  } as APIResponse;
}

export class BaseClient {
  constructor(protected requestContext: APIRequestContext) {}

  /**
   * Redacts sensitive authorization headers for logging
   */
  private sanitizeHeaders(headers?: Record<string, string>): Record<string, string> {
    const sanitized = { ...(headers || {}) };
    for (const key of Object.keys(sanitized)) {
      if (/auth|token|secret|key/i.test(key)) {
        sanitized[key] = '***REDACTED***';
      }
    }
    return sanitized;
  }

  /**
   * Executes HTTP request with exponential backoff and jitter for transient errors (429, 502, 503, 504)
   */
  protected async requestWithBackoff(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    url: string,
    options: RequestOptions = {},
    maxRetries = 3,
  ): Promise<APIResponse> {
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const headers = {
      'x-request-id': requestId,
      ...(options.headers || {}),
    };

    let response: APIResponse | null = null;
    let lastError: unknown = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const startTime = Date.now();
      try {
        switch (method) {
          case 'GET':
            response = await this.requestContext.get(url, {
              headers,
              params: options.params,
              timeout: options.timeout,
            });
            break;
          case 'POST':
            response = await this.requestContext.post(url, {
              headers,
              params: options.params,
              data: options.data,
              timeout: options.timeout,
            });
            break;
          case 'PUT':
            response = await this.requestContext.put(url, {
              headers,
              params: options.params,
              data: options.data,
              timeout: options.timeout,
            });
            break;
          case 'DELETE':
            response = await this.requestContext.delete(url, {
              headers,
              params: options.params,
              timeout: options.timeout,
            });
            break;
        }

        const duration = Date.now() - startTime;
        const status = response.status();

        // Retry only on transient errors: 429 Rate Limit or 502/503/504 Gateway errors
        if (status !== 429 && status !== 502 && status !== 503 && status !== 504) {
          return response;
        }

        if (attempt === maxRetries) {
          return response;
        }
      } catch (err) {
        lastError = err;
        if (attempt === maxRetries) throw err;
      }

      // Exponential backoff with jitter
      const backoffMs = Math.pow(2, attempt) * 250 + Math.random() * 100;
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }

    if (response) return response;
    throw lastError || new Error(`Request failed after ${maxRetries} retries`);
  }

  async post(url: string, options: RequestOptions = {}): Promise<APIResponse> {
    return this.requestWithBackoff('POST', url, options);
  }

  async get(url: string, options: RequestOptions = {}): Promise<APIResponse> {
    return this.requestWithBackoff('GET', url, options);
  }

  async put(url: string, options: RequestOptions = {}): Promise<APIResponse> {
    return this.requestWithBackoff('PUT', url, options);
  }

  async delete(url: string, options: RequestOptions = {}): Promise<APIResponse> {
    return this.requestWithBackoff('DELETE', url, options);
  }
}
