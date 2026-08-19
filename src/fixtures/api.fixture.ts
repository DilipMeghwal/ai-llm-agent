import { test as base } from '@playwright/test';
import { UserClient } from '../clients/user.client';

export type ApiFixtures = {
  userClient: UserClient;
  unauthClient: UserClient;
};

export const test = base.extend<ApiFixtures>({
  userClient: async ({ request }, use) => {
    // Inject client with default auth context if needed
    const client = new UserClient(request, false);
    await use(client);
  },

  unauthClient: async ({ playwright }, use) => {
    // Isolated unauthenticated request context
    const unauthContext = await playwright.request.newContext({
      extraHTTPHeaders: {},
    });
    const client = new UserClient(unauthContext, true);
    await use(client);
    await unauthContext.dispose();
  },
});

export { expect } from '@playwright/test';
