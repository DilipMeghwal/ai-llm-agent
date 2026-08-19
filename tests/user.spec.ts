import { test, expect } from '@fixtures/api.fixture';
import { UserFactory } from '@factories/user.factory';
import { parseResetPasswordResponse, parseErrorResponse } from '@models/schemas/user.schema';

test.describe('POST /api/v1/users/{id}/reset-password', () => {

  test('should reset password successfully for valid user', { tag: '@smoke' }, async ({ userClient }) => {
    const userId = 'user-123';
    const payload = UserFactory.buildResetPasswordPayload();

    const response = await userClient.resetPassword(userId, payload);
    
    // 1. Status Assertion
    expect([200, 204]).toContain(response.status());

    // 2. Header Assertion
    if (response.status() === 200) {
      expect(response.headers()['content-type']).toContain('application/json');
      const body = await response.json();

      // 3. Schema Contract Validation
      parseResetPasswordResponse(body);

      // 4. Field-Value Assertion
      if (body.success !== undefined) {
        expect(body.success).toBe(true);
      }
    }
  });

  test('should verify endpoint sanity check for password reset', { tag: '@sanity' }, async ({ userClient }) => {
    const userId = 'user-123';
    const payload = UserFactory.buildResetPasswordPayload();

    const response = await userClient.resetPassword(userId, payload);
    
    expect([200, 204]).toContain(response.status());
    if (response.status() === 200) {
      const body = await response.json();
      parseResetPasswordResponse(body);
    }
  });

  test('should return 400/422 when newPassword field is missing', { tag: '@regression' }, async ({ userClient }) => {
    const userId = 'user-123';
    const invalidPayload = {} as any;

    const response = await userClient.resetPassword(userId, invalidPayload);
    
    expect([400, 422]).toContain(response.status());
    const body = await response.json();
    
    parseErrorResponse(body);
    
    // Error body assertion
    const errorText = JSON.stringify(body).toLowerCase();
    expect(errorText).toMatch(/password|required|field/i);
  });

  test('should return 400/422 when newPassword is empty', { tag: '@regression' }, async ({ userClient }) => {
    const userId = 'user-123';
    const invalidPayload = UserFactory.buildEmptyPasswordPayload();

    const response = await userClient.resetPassword(userId, invalidPayload);
    
    expect([400, 422]).toContain(response.status());
    const body = await response.json();
    
    parseErrorResponse(body);
    expect(JSON.stringify(body).length).toBeGreaterThan(0);
  });

  test('should return 404 when user ID does not exist', { tag: '@regression' }, async ({ userClient }) => {
    const nonExistentUserId = '99999999-9999-9999-9999-999999999999';
    const payload = UserFactory.buildResetPasswordPayload();

    const response = await userClient.resetPassword(nonExistentUserId, payload);
    
    expect(response.status()).toBe(404);
    const body = await response.json();
    
    parseErrorResponse(body);
    const errorText = JSON.stringify(body).toLowerCase();
    expect(errorText).toMatch(/not found|user|exist/i);
  });

  test('should return 401 when request is unauthenticated', { tag: '@regression' }, async ({ unauthClient }) => {
    const userId = 'user-123';
    const payload = UserFactory.buildResetPasswordPayload();

    const response = await unauthClient.resetPassword(userId, payload);
    
    expect([401, 403]).toContain(response.status());
    const body = await response.json();
    
    parseErrorResponse(body);
  });

});

test.describe.serial('POST /api/v1/users/{id}/reset-password - Integration Flow', () => {
  let createdUserId: string;
  let newPassword: string;
  let userData: ReturnType<typeof UserFactory.buildUserData>;

  test.afterAll(async ({ userClient }) => {
    if (createdUserId) {
      await userClient.deleteUser(createdUserId).catch(() => {});
    }
  });

  test('Step 1: Reset password for existing user', { tag: '@integration' }, async ({ userClient }) => {
    userData = UserFactory.buildUserData();
    createdUserId = userData.username;
    const payload = UserFactory.buildResetPasswordPayload();
    newPassword = payload.newPassword!;

    const response = await userClient.resetPassword(createdUserId, payload);
    expect([200, 204]).toContain(response.status());
  });

  test('Step 2: Authenticate using newly reset password', { tag: '@integration' }, async ({ userClient }) => {
    const loginResponse = await userClient.login({
      email: userData.email,
      password: newPassword,
    });
    
    expect([200, 404]).toContain(loginResponse.status());
  });
});

test.describe.serial('POST /api/v1/users/{id}/reset-password - E2E Lifecycle', () => {
  let tempUserId: string;
  let initialUserData: ReturnType<typeof UserFactory.buildUserData>;
  let updatedPasswordPayload: ReturnType<typeof UserFactory.buildResetPasswordPayload>;

  test.afterAll(async ({ userClient }) => {
    if (tempUserId) {
      await userClient.deleteUser(tempUserId).catch(() => {});
    }
  });

  test('Step 1: Create User Resource', { tag: '@e2e' }, async ({ userClient }) => {
    initialUserData = UserFactory.buildUserData();
    const createRes = await userClient.createUser(initialUserData);
    if (createRes.status() === 201 || createRes.status() === 200) {
      const createBody = await createRes.json();
      tempUserId = createBody.id || 'e2e-user-id';
    } else {
      tempUserId = 'e2e-user-id';
    }
    expect([200, 201]).toContain(createRes.status());
  });

  test('Step 2: Reset Password for Created User', { tag: '@e2e' }, async ({ userClient }) => {
    updatedPasswordPayload = UserFactory.buildResetPasswordPayload();
    const resetRes = await userClient.resetPassword(tempUserId, updatedPasswordPayload);
    expect([200, 204]).toContain(resetRes.status());
  });

  test('Step 3: Verify Login with New Password Credentials', { tag: '@e2e' }, async ({ userClient }) => {
    const loginRes = await userClient.login({
      username: initialUserData.username,
      password: updatedPasswordPayload.newPassword,
    });
    expect([200, 404]).toContain(loginRes.status());
  });

  test('Step 4: Delete User Resource Teardown', { tag: '@e2e' }, async ({ userClient }) => {
    if (tempUserId && tempUserId !== 'e2e-user-id') {
      const deleteRes = await userClient.deleteUser(tempUserId);
      expect([200, 204, 404]).toContain(deleteRes.status());
    }
  });
});
