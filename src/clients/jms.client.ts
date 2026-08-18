import { APIResponse } from '@playwright/test';
import { BaseClient } from './base.client';
import { ENDPOINTS } from '../config/endpoints';

export class JmsClient extends BaseClient {
  async startupJmsListener(): Promise<APIResponse> {
    return this.post(ENDPOINTS.STARTUP_JMS);
  }

  async shutdownJmsListener(): Promise<APIResponse> {
    return this.post(ENDPOINTS.SHUTDOWN_JMS);
  }
}
