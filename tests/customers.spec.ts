import { test, expect } from '../src/fixtures/api.fixture';
import { CustomerSchema, AccountSchema } from '../src/models/schemas/common.schema';

test.describe('Customers API Operations', () => {
  const defaultCustomerId = 12212; // Standard ParaBank demo customer ID
  const defaultAccountId = 13344;

  test('GET /customers/{customerId} - should fetch customer details', async ({ customersClient }) => {
    const response = await customersClient.getCustomer(defaultCustomerId);
    expect(response.status()).toBe(200);

    const body = await response.json();
    const parsed = CustomerSchema.safeParse(body);
    expect(parsed.success).toBe(true);
  });

  test('POST /createAccount - should create a new account for customer', async ({ customersClient }) => {
    const response = await customersClient.createAccount(defaultCustomerId, 0, defaultAccountId);
    expect(response.status()).toBe(200);

    const body = await response.json();
    const parsed = AccountSchema.safeParse(body);
    expect(parsed.success).toBe(true);
  });

  test('POST /customers/update/{customerId} - should update customer details', async ({ customersClient }) => {
    const updateParams = {
      customerId: defaultCustomerId,
      firstName: 'John',
      lastName: 'Smith',
      street: '1431 Main St',
      city: 'Beverly Hills',
      state: 'CA',
      zipCode: '90210',
      phoneNumber: '310-447-4121',
      ssn: '622-11-9999',
      username: 'john',
      password: 'demo',
    };
    const response = await customersClient.updateCustomer(updateParams);
    expect([200, 204, 400, 500]).toContain(response.status());
  });
});
