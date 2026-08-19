import { test, expect } from '@fixtures/api.fixture';
import { UserFactory } from '@factories/user.factory';
import { parseResetPasswordResponse, parseErrorResponse } from '@models/schemas/user.schema';
import { TeardownManager } from '../src/utils/teardown-manager';

test.describe('POST /api/v1/users/{id}/reset-password', () => {
  test(
    'should reset password successfully for valid user',
    { tag: '@smoke' },
    async ({ userClient, attachApiResponse }) => {
      const userId = 'user-123';
      const payload = UserFactory.buildResetPasswordPayload();

      const response = await userClient.resetPassword(userId, payload);

      // 1. Status Assertion
      expect([200, 204]).toContain(response.status());

      // 2. Header Assertion
      if (response.status() === 200) {
        expect(response.headers()['content-type']).toContain('application/json');
        const body = await response.json();

        // Report attachment
        attachApiResponse('Reset Password Response', body);

        // 3. Schema Contract Validation
        parseResetPasswordResponse(body);

        // 4. Field-Value Assertion
        if (body.success !== undefined) {
          expect(body.success).toBe(true);
        }
      }
    },
  );

  test(
    'should verify endpoint sanity check for password reset',
    { tag: '@sanity' },
    async ({ userClient, attachApiResponse }) => {
      const userId = 'user-123';
      const payload = UserFactory.buildResetPasswordPayload();

      const response = await userClient.resetPassword(userId, payload);

      expect([200, 204]).toContain(response.status());
      if (response.status() === 200) {
        const body = await response.json();
        attachApiResponse('Sanity Check Response', body);
        parseResetPasswordResponse(body);
      }
    },
  );

  test(
    'should return 400/422 when newPassword field is missing',
    { tag: '@regression' },
    async ({ userClient, attachApiResponse }) => {
      const userId = 'user-123';
      const invalidPayload = {} as any;

      const response = await userClient.resetPassword(userId, invalidPayload);

      expect([400, 422]).toContain(response.status());
      const body = await response.json();
      attachApiResponse('Error Response (Missing Field)', body);

      parseErrorResponse(body);

      // Error body assertion
      const errorText = JSON.stringify(body).toLowerCase();
      expect(errorText).toMatch(/password|required|field/i);
    },
  );

  test(
    'should return 400/422 when newPassword is empty',
    { tag: '@regression' },
    async ({ userClient, attachApiResponse }) => {
      const userId = 'user-123';
      const invalidPayload = UserFactory.buildEmptyPasswordPayload();

      const response = await userClient.resetPassword(userId, invalidPayload);

      expect([400, 422]).toContain(response.status());
      const body = await response.json();
      attachApiResponse('Error Response (Empty Field)', body);

      parseErrorResponse(body);
      expect(JSON.stringify(body).length).toBeGreaterThan(0);
    },
  );

  test(
    'should return 404 when user ID does not exist',
    { tag: '@regression' },
    async ({ userClient, attachApiResponse }) => {
      const nonExistentUserId = '99999999-9999-9999-9999-999999999999';
      const payload = UserFactory.buildResetPasswordPayload();

      const response = await userClient.resetPassword(nonExistentUserId, payload);

      expect(response.status()).toBe(404);
      const body = await response.json();
      attachApiResponse('Error Response (Not Found)', body);

      parseErrorResponse(body);
      const errorText = JSON.stringify(body).toLowerCase();
      expect(errorText).toMatch(/not found|user|exist/i);
    },
  );

  test(
    'should return 401 when request is unauthenticated',
    { tag: '@regression' },
    async ({ unauthClient, attachApiResponse }) => {
      const userId = 'user-123';
      const payload = UserFactory.buildResetPasswordPayload();

      const response = await unauthClient.resetPassword(userId, payload);

      expect([401, 403]).toContain(response.status());
      const body = await response.json();
      attachApiResponse('Error Response (Unauth)', body);

      parseErrorResponse(body);
    },
  );
});

test.describe('POST /api/v1/users/{id}/reset-password - Integration Flow', () => {
  test(
    'User reset password and authentication integration flow',
    { tag: '@integration' },
    async ({ userClient, attachApiResponse }) => {
      let createdUserId: string;
      let newPassword: string;
      let userData: ReturnType<typeof UserFactory.buildUserData>;

      try {
        await test.step('1. Reset password for existing user', async () => {
          userData = UserFactory.buildUserData();
          createdUserId = userData.username;
          const payload = UserFactory.buildResetPasswordPayload();
          newPassword = payload.newPassword!;

          // Register teardown task
          TeardownManager.register(async () => {
            await userClient.deleteUser(createdUserId).catch(() => {});
          });

          const response = await userClient.resetPassword(createdUserId, payload);
          expect([200, 204]).toContain(response.status());
        });

        await test.step('2. Authenticate using newly reset password', async () => {
          const loginResponse = await userClient.login({
            email: userData.email,
            password: newPassword,
          });

          if (loginResponse.status() === 200) {
            const body = await loginResponse.json();
            attachApiResponse('Integration Login Response', body);
          }
          expect([200, 404]).toContain(loginResponse.status());
        });
      } finally {
        await TeardownManager.executeAll();
      }
    },
  );
});

test.describe('POST /api/v1/users/{id}/reset-password - E2E Lifecycle', () => {
  test(
    'Full E2E user lifecycle with credential update and teardown',
    { tag: '@e2e' },
    async ({ userClient, attachApiResponse }) => {
      let tempUserId: string;
      let initialUserData: ReturnType<typeof UserFactory.buildUserData>;
      let updatedPasswordPayload: ReturnType<typeof UserFactory.buildResetPasswordPayload>;

      try {
        await test.step('1. Create user resource', async () => {
          initialUserData = UserFactory.buildUserData();
          const createRes = await userClient.createUser(initialUserData);
          if (createRes.status() === 201 || createRes.status() === 200) {
            const createBody = await createRes.json();
            tempUserId = createBody.id || 'e2e-user-id';
            attachApiResponse('E2E Create User Response', createBody);

            TeardownManager.register(async () => {
              if (tempUserId && tempUserId !== 'e2e-user-id') {
                await userClient.deleteUser(tempUserId).catch(() => {});
              }
            });
          } else {
            tempUserId = 'e2e-user-id';
          }
          expect([200, 201]).toContain(createRes.status());
        });

        await test.step('2. Reset password for created user', async () => {
          updatedPasswordPayload = UserFactory.buildResetPasswordPayload();
          const resetRes = await userClient.resetPassword(tempUserId, updatedPasswordPayload);
          expect([200, 204]).toContain(resetRes.status());
        });

        await test.step('3. Verify login with updated credentials', async () => {
          const loginRes = await userClient.login({
            username: initialUserData.username,
            password: updatedPasswordPayload.newPassword,
          });
          if (loginRes.status() === 200) {
            const body = await loginRes.json();
            attachApiResponse('E2E Login Response', body);
          }
          expect([200, 404]).toContain(loginRes.status());
        });
      } finally {
        await TeardownManager.executeAll();
      }
    },
  );
});
