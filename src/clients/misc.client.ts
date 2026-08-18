import { APIResponse } from '@playwright/test';
import { BaseClient } from './base.client';
import { ENDPOINTS } from '../config/endpoints';

export class MiscClient extends BaseClient {
  async login(username: string, password: string): Promise<APIResponse> {
    return this.get(ENDPOINTS.LOGIN(username, password));
  }

  async setParameter(name: string, value: string): Promise<APIResponse> {
    return this.post(ENDPOINTS.SET_PARAMETER(name, value));
  }
}
