import { APIRequestContext, APIResponse } from '@playwright/test';
import { ENDPOINTS } from '../config/endpoints';

export class MiscClient {
  constructor(private readonly request: APIRequestContext) {}

  async login(username: string, password: string): Promise<APIResponse> {
    return this.request.get(ENDPOINTS.LOGIN(username, password), {
      headers: {
        'Accept': 'application/json',
      },
    });
  }

  async setParameter(name: string, value: string): Promise<APIResponse> {
    return this.request.post(ENDPOINTS.SET_PARAMETER(name, value), {
      headers: {
        'Accept': 'application/json',
      },
    });
  }
}
