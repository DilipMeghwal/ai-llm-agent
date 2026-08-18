import { test, expect } from '../src/fixtures/api.fixture';
import { LoanResponseSchema } from '../src/models/schemas/loans.schema';

test.describe('Loans API Operations', () => {
  const customerId = 12212;
  const fromAccountId = 13344;

  test('POST /requestLoan - should request a loan successfully', async ({ loansClient }) => {
    const response = await loansClient.requestLoan(customerId, 1000, 100, fromAccountId);
    expect(response.status()).toBe(200);

    const text = await response.text();
    if (text && text.trim().startsWith('{')) {
      const json = JSON.parse(text);
      const parsed = LoanResponseSchema.safeParse(json);
      expect(parsed.success).toBe(true);
    }
  });
});
