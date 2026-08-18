import { APIResponse } from '@playwright/test';
import { BaseClient } from './base.client';
import { ENDPOINTS } from '../config/endpoints';

export class DatabaseClient extends BaseClient {
  async cleanDB(): Promise<APIResponse> {
    return this.post(ENDPOINTS.CLEAN_DB);
  }

  async initializeDB(): Promise<APIResponse> {
    return this.post(ENDPOINTS.INITIALIZE_DB);
  }
}
