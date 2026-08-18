import { APIRequestContext, APIResponse } from '@playwright/test';

/**
 * Base API Client
 * Provides common HTTP request wrapper methods with standard JSON headers.
 */
export abstract class BaseClient {
  constructor(protected readonly request: APIRequestContext) {}

  protected async get(path: string, headers?: Record<string, string>): Promise<APIResponse> {
    return this.request.get(path, {
      headers: {
        'Accept': 'application/json',
        ...headers,
      },
    });
  }

  protected async post(path: string, data?: unknown, headers?: Record<string, string>): Promise<APIResponse> {
    return this.request.post(path, {
      headers: {
        'Accept': 'application/json',
        ...headers,
      },
      ...(data !== undefined ? { data } : {}),
    });
  }
}
