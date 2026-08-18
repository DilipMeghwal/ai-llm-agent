import { test, expect } from '../src/fixtures/api.fixture';

test.describe('JMS API Operations', () => {
  test('POST /startupJmsListener - should start JMS listener', async ({ jmsClient }) => {
    const response = await jmsClient.startupJmsListener();
    expect([200, 204]).toContain(response.status());
  });

  test('POST /shutdownJmsListener - should stop JMS listener', async ({ jmsClient }) => {
    const response = await jmsClient.shutdownJmsListener();
    expect([200, 204]).toContain(response.status());
  });
});
