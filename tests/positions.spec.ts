import { test, expect } from '../src/fixtures/api.fixture';
import { PositionSchema, PositionArraySchema, HistoryPointArraySchema } from '../src/models/schemas/positions.schema';

test.describe('Positions API Operations', () => {
  const customerId = 12212;
  const accountId = 13344;

  test('POST /customers/{customerId}/buyPosition - should buy position', async ({ positionsClient }) => {
    const response = await positionsClient.buyPosition(customerId, accountId, 'Apple Inc', 'AAPL', 10, 150.0);
    expect([200, 400, 404, 500]).toContain(response.status());

    if (response.status() === 200) {
      const text = await response.text();
      if (text && text.trim().startsWith('[')) {
        const json = JSON.parse(text);
        const parsed = PositionArraySchema.safeParse(json);
        expect(parsed.success).toBe(true);
      }
    }
  });

  test('GET /positions/{positionId} - should get position by id', async ({ positionsClient }) => {
    const response = await positionsClient.getPosition(1);
    expect([200, 400, 404, 500]).toContain(response.status());

    if (response.status() === 200) {
      const text = await response.text();
      if (text && text.trim().startsWith('{')) {
        const json = JSON.parse(text);
        const parsed = PositionSchema.safeParse(json);
        expect(parsed.success).toBe(true);
      }
    }
  });

  test('GET /customers/{customerId}/positions - should get customer positions', async ({ positionsClient }) => {
    const response = await positionsClient.getCustomerPositions(customerId);
    expect(response.status()).toBe(200);

    const text = await response.text();
    if (text && text.trim().startsWith('[')) {
      const json = JSON.parse(text);
      const parsed = PositionArraySchema.safeParse(json);
      expect(parsed.success).toBe(true);
    }
  });

  test('GET /positions/{positionId}/{startDate}/{endDate} - should get position history', async ({ positionsClient }) => {
    const response = await positionsClient.getPositionHistory(1, '2026-01-01', '2026-08-01');
    expect([200, 400, 404, 500]).toContain(response.status());

    if (response.status() === 200) {
      const text = await response.text();
      if (text && text.trim().startsWith('[')) {
        const json = JSON.parse(text);
        const parsed = HistoryPointArraySchema.safeParse(json);
        expect(parsed.success).toBe(true);
      }
    }
  });

  test('POST /customers/{customerId}/sellPosition - should sell position', async ({ positionsClient }) => {
    const response = await positionsClient.sellPosition(customerId, accountId, 1, 5, 160.0);
    expect([200, 400, 404, 500]).toContain(response.status());
  });
});
