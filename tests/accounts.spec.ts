import { test, expect } from '../src/fixtures/api.fixture';
import { AccountSchema, AccountArraySchema, BillPayResultSchema } from '../src/models/schemas/accounts.schema';
import { PayeeFactory } from '../src/factories/payee.factory';

test.describe('Accounts API Operations', () => {
  const defaultAccountId = 13344;
  const targetAccountId = 13344;
  const defaultCustomerId = 12212;

  test('GET /accounts/{accountId} - should fetch account details', async ({ accountsClient }) => {
    const response = await accountsClient.getAccount(defaultAccountId);
    expect(response.status()).toBe(200);

    const body = await response.json();
    const parsed = AccountSchema.safeParse(body);
    expect(parsed.success).toBe(true);
  });

  test('GET /customers/{customerId}/accounts - should fetch customer accounts', async ({ accountsClient }) => {
    const response = await accountsClient.getCustomerAccounts(defaultCustomerId);
    expect(response.status()).toBe(200);

    const body = await response.json();
    const parsed = AccountArraySchema.safeParse(body);
    expect(parsed.success).toBe(true);
  });

  test('POST /deposit - should deposit funds into account', async ({ accountsClient }) => {
    const response = await accountsClient.deposit(defaultAccountId, 100);
    expect(response.status()).toBe(200);
  });

  test('POST /withdraw - should withdraw funds from account', async ({ accountsClient }) => {
    const response = await accountsClient.withdraw(defaultAccountId, 50);
    expect(response.status()).toBe(200);
  });

  test('POST /transfer - should transfer funds between accounts', async ({ accountsClient }) => {
    const response = await accountsClient.transfer(defaultAccountId, targetAccountId, 25);
    expect(response.status()).toBe(200);
  });

  test('POST /billpay - should pay bill for account', async ({ accountsClient }) => {
    const payee = PayeeFactory.createValidPayee();
    const response = await accountsClient.billPay(defaultAccountId, 75, payee);
    expect(response.status()).toBe(200);

    const text = await response.text();
    if (text && text.trim().startsWith('{')) {
      const json = JSON.parse(text);
      const parsed = BillPayResultSchema.safeParse(json);
      expect(parsed.success).toBe(true);
    }
  });
});
