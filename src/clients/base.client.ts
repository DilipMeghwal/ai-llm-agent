import { APIRequestContext, APIResponse } from '@playwright/test';

export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  data?: unknown;
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
