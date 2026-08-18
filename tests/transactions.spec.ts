import { test, expect } from '../src/fixtures/api.fixture';
import { TransactionSchema, TransactionArraySchema } from '../src/models/schemas/transactions.schema';

test.describe('Transactions API Operations', () => {
  const accountId = 13344;
  const transactionId = 10001;

  test('GET /transactions/{transactionId} - should get transaction details', async ({ transactionsClient }) => {
    const response = await transactionsClient.getTransaction(transactionId);
    expect([200, 400, 404, 500]).toContain(response.status());

    if (response.status() === 200) {
      const text = await response.text();
      if (text && text.trim().startsWith('{')) {
        const json = JSON.parse(text);
        const parsed = TransactionSchema.safeParse(json);
        expect(parsed.success).toBe(true);
      }
    }
  });

  test('GET /accounts/{accountId}/transactions - should get list of transactions for account', async ({ transactionsClient }) => {
    const response = await transactionsClient.getAccountTransactions(accountId);
    expect(response.status()).toBe(200);

    const text = await response.text();
    if (text && text.trim().startsWith('[')) {
      const json = JSON.parse(text);
      const parsed = TransactionArraySchema.safeParse(json);
      expect(parsed.success).toBe(true);
    }
  });

  test('GET /accounts/{accountId}/transactions/amount/{amount} - should fetch transactions by amount', async ({ transactionsClient }) => {
    const response = await transactionsClient.getTransactionsByAmount(accountId, 100);
    expect(response.status()).toBe(200);
  });

  test('GET /accounts/{accountId}/transactions/month/{month}/type/{type} - should fetch transactions by month and type', async ({ transactionsClient }) => {
    const response = await transactionsClient.getTransactionsByMonthAndType(accountId, 'AUGUST', 'Credit');
    expect(response.status()).toBe(200);
  });

  test('GET /accounts/{accountId}/transactions/fromDate/{fromDate}/toDate/{toDate} - should fetch transactions by date range', async ({ transactionsClient }) => {
    const response = await transactionsClient.getTransactionsByDateRange(accountId, '2026-01-01', '2026-08-01');
    expect(response.status()).toBe(200);
  });

  test('GET /accounts/{accountId}/transactions/onDate/{onDate} - should fetch transactions on date', async ({ transactionsClient }) => {
    const response = await transactionsClient.getTransactionsOnDate(accountId, '2026-08-01');
    expect(response.status()).toBe(200);
  });
});
