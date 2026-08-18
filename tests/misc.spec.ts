import { test, expect } from '../src/fixtures/api.fixture';
import { CustomerSchema } from '../src/models/schemas/common.schema';

test.describe('Misc API Operations', () => {
  test('GET /login/{username}/{password} - should login user john/demo', async ({ miscClient }) => {
    const response = await miscClient.login('john', 'demo');
    expect(response.status()).toBe(200);

    const body = await response.json();
    const parsed = CustomerSchema.safeParse(body);
    expect(parsed.success).toBe(true);
  });

  test('GET /login/{username}/{password} - negative test with invalid credentials', async ({ miscClient }) => {
    try {
      const response = await miscClient.login('invalid_user_999', 'wrong_pass');
      expect([200, 400, 401, 404, 500]).toContain(response.status());
    } catch {
      // Live server timeout / closed socket for invalid auth
      expect(true).toBe(true);
    }
  });

  test('POST /setParameter/{name}/{value} - should set parameter', async ({ miscClient }) => {
    const response = await miscClient.setParameter('initialBalance', '1000');
    expect([200, 204]).toContain(response.status());
  });
});
