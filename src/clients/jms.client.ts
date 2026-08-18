import { APIRequestContext, APIResponse } from '@playwright/test';
import { ENDPOINTS } from '../config/endpoints';

export class JmsClient {
  constructor(private readonly request: APIRequestContext) {}

  async startupJmsListener(): Promise<APIResponse> {
    return this.request.post(ENDPOINTS.STARTUP_JMS, {
      headers: {
        'Accept': 'application/json',
      },
    });
  }

  async shutdownJmsListener(): Promise<APIResponse> {
    return this.request.post(ENDPOINTS.SHUTDOWN_JMS, {
      headers: {
        'Accept': 'application/json',
      },
    });
  }
}
