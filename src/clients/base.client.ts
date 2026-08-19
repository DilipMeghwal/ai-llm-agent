import { APIRequestContext, APIResponse } from '@playwright/test';

export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  data?: unknown;
}

export function createMockApiResponse(
  status: number,
  body: unknown,
  headers: Record<string, string> = { 'content-type': 'application/json' }
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

  async post(url: string, options: RequestOptions = {}): Promise<APIResponse> {
    return this.requestContext.post(url, {
      headers: options.headers,
      params: options.params,
      data: options.data,
    });
  }

  async get(url: string, options: RequestOptions = {}): Promise<APIResponse> {
    return this.requestContext.get(url, {
      headers: options.headers,
      params: options.params,
    });
  }

  async put(url: string, options: RequestOptions = {}): Promise<APIResponse> {
    return this.requestContext.put(url, {
      headers: options.headers,
      params: options.params,
      data: options.data,
    });
  }

  async delete(url: string, options: RequestOptions = {}): Promise<APIResponse> {
    return this.requestContext.delete(url, {
      headers: options.headers,
      params: options.params,
    });
  }
}
