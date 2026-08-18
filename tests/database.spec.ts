import { test, expect } from '../src/fixtures/api.fixture';

test.describe('Database API Operations', () => {
  test('POST /initializeDB - should initialize database successfully', async ({ databaseClient }) => {
    const response = await databaseClient.initializeDB();
    expect([200, 204]).toContain(response.status());
  });

  test('POST /cleanDB - should clean database successfully', async ({ databaseClient }) => {
    const response = await databaseClient.cleanDB();
    expect([200, 204]).toContain(response.status());
  });
});
