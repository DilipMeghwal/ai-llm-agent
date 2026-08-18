import { APIRequestContext, APIResponse } from '@playwright/test';
import { ENDPOINTS } from '../config/endpoints';

export class DatabaseClient {
  constructor(private readonly request: APIRequestContext) {}

  async cleanDB(): Promise<APIResponse> {
    return this.request.post(ENDPOINTS.CLEAN_DB, {
      headers: {
        'Accept': 'application/json',
      },
    });
  }

  async initializeDB(): Promise<APIResponse> {
    return this.request.post(ENDPOINTS.INITIALIZE_DB, {
      headers: {
        'Accept': 'application/json',
      },
    });
  }
}
