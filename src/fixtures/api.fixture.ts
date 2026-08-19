import { test as base } from '@playwright/test';
import { UserClient } from '../clients/user.client';
import { ENV_CONFIG } from '../config/env.config';

export type ApiFixtures = {
  userClient: UserClient;
  adminClient: UserClient;
  customerClient: UserClient;
  unauthClient: UserClient;
  attachApiResponse: (title: string, data: unknown) => void;
};

// In-memory JWT token cache for role sessions
const tokenCache = new Map<string, string>();

export const test = base.extend<ApiFixtures>({
  userClient: async ({ request }, use) => {
    const client = new UserClient(request, false);
    await use(client);
  },

  adminClient: async ({ playwright }, use) => {
    let token = tokenCache.get('admin');
    if (!token) {
      token = `mock-admin-token-${Date.now()}`;
      tokenCache.set('admin', token);
    }
    const adminContext = await playwright.request.newContext({
      baseURL: ENV_CONFIG.BASE_URL,
      extraHTTPHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    const client = new UserClient(adminContext, false);
    await use(client);
    await adminContext.dispose();
  },

  customerClient: async ({ playwright }, use) => {
    let token = tokenCache.get('customer');
    if (!token) {
      token = `mock-customer-token-${Date.now()}`;
      tokenCache.set('customer', token);
    }
    const customerContext = await playwright.request.newContext({
      baseURL: ENV_CONFIG.BASE_URL,
      extraHTTPHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    const client = new UserClient(customerContext, false);
    await use(client);
    await customerContext.dispose();
  },

  unauthClient: async ({ playwright }, use) => {
    const unauthContext = await playwright.request.newContext({
      baseURL: ENV_CONFIG.BASE_URL,
      extraHTTPHeaders: {},
    });
    const client = new UserClient(unauthContext, true);
    await use(client);
    await unauthContext.dispose();
  },

  attachApiResponse: async ({}, use, testInfo) => {
    const attachFn = (title: string, data: unknown) => {
      testInfo.attachments.push({
        name: title,
        contentType: 'application/json',
        body: Buffer.from(typeof data === 'string' ? data : JSON.stringify(data, null, 2)),
      });
    };
    await use(attachFn);
  },
});

export { expect } from '@playwright/test';
