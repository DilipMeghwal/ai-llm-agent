import { test, expect } from '@fixtures/api.fixture';
import { parseCustomerResponse, parseErrorResponse } from '@models/schemas';

test.describe('GET /login/{username}/{password}', () => {
  test(
    'should authenticate successfully with valid credentials',
    { tag: '@smoke' },
    async ({ userClient, attachApiResponse }) => {
      const username = 'john';
      const password = 'demo';

      const response = await userClient.loginViaPath(username, password);

      // 1. Status Assertion
      expect(response.status()).toBe(200);

      // 2. Header & Schema Assertion
      const body = await response.json();
      attachApiResponse('Login Response (Smoke)', body);
      parseCustomerResponse(body);

      // 3. Field-Value Assertions
      expect(body.firstName).toBe('John');
      expect(body.id).toBeDefined();
    },
  );

  test(
    'should verify login endpoint sanity availability',
    { tag: '@sanity' },
    async ({ userClient, attachApiResponse }) => {
      const response = await userClient.loginViaPath('john', 'demo');

      expect(response.status()).toBe(200);
      const body = await response.json();
      attachApiResponse('Login Response (Sanity)', body);
      parseCustomerResponse(body);
    },
  );

  test(
    'should reject login attempt with invalid password',
    { tag: '@regression' },
    async ({ userClient, attachApiResponse }) => {
      const response = await userClient.loginViaPath('john', 'wrong_password');

      // Assert status
      expect([400, 401, 404]).toContain(response.status());

      const body = await response.json();
      attachApiResponse('Invalid Password Response', body);
      parseErrorResponse(body);

      // Error message assertion
      if (body.message) {
        expect(body.message.toLowerCase()).toContain('invalid');
      }
    },
  );

  test(
    'should return error when logging in with non-existent username',
    { tag: '@regression' },
    async ({ userClient, attachApiResponse }) => {
      const response = await userClient.loginViaPath('non_existent_user_999', 'demo');

      expect([400, 401, 404]).toContain(response.status());

      const body = await response.json();
      attachApiResponse('Non-existent User Response', body);
      parseErrorResponse(body);
    },
  );

  test(
    'should safely handle SQL injection payload in username path parameter',
    { tag: '@security' },
    async ({ userClient, attachApiResponse }) => {
      const sqlPayload = "' OR '1'='1";
      const response = await userClient.loginViaPath(sqlPayload, 'demo');

      // Security boundary check: MUST NOT throw 500 or leak unhandled exceptions
      expect(response.status()).toBeLessThan(500);
      expect([400, 401, 403, 404, 422]).toContain(response.status());

      const contentType = response.headers()['content-type'] || '';
      let body: unknown;
      if (contentType.includes('application/json')) {
        body = await response.json();
        parseErrorResponse(body);
      } else {
        body = { message: await response.text() };
      }
      attachApiResponse('SQL Injection Attempt Response', body);
    },
  );

  test(
    'should perform login and verify customer account details flow',
    { tag: '@integration' },
    async ({ userClient, attachApiResponse }) => {
      let customerId: number | undefined;

      await test.step('1. Log in via path parameters', async () => {
        const response = await userClient.loginViaPath('john', 'demo');
        expect(response.status()).toBe(200);

        const body = await response.json();
        attachApiResponse('Integration - Step 1 Login', body);
        parseCustomerResponse(body);

        customerId = body.id;
        expect(customerId).toBeDefined();
      });

      await test.step('2. Verify retrieved customer profile details', async () => {
        expect(customerId).toBe(12212);
      });
    },
  );
});
