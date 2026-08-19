import { APIResponse } from '@playwright/test';
import { BaseClient, RequestOptions } from './base.client';
import { ENDPOINTS } from '../config/endpoints';
import { ResetPasswordRequest, LoginRequest } from '../models/types/user.type';

export class UserClient extends BaseClient {
  /**
   * Resets password for a given user ID
   * POST /api/v1/users/{id}/reset-password
   */
  async resetPassword(
    id: string | number,
    data?: ResetPasswordRequest,
    options: RequestOptions = {}
  ): Promise<APIResponse> {
    return this.post(ENDPOINTS.USERS.RESET_PASSWORD(id), {
      ...options,
      data,
    });
  }

  /**
   * Authenticates user with username/email and password
   * POST /api/v1/auth/login
   */
  async login(data: LoginRequest, options: RequestOptions = {}): Promise<APIResponse> {
    return this.post(ENDPOINTS.AUTH.LOGIN, {
      ...options,
      data,
    });
  }

  /**
   * Creates a new user resource
   * POST /api/v1/users
   */
  async createUser(data: Record<string, unknown>, options: RequestOptions = {}): Promise<APIResponse> {
    return this.post(ENDPOINTS.USERS.BASE, {
      ...options,
      data,
    });
  }

  /**
   * Deletes a user resource by ID
   * DELETE /api/v1/users/{id}
   */
  async deleteUser(id: string | number, options: RequestOptions = {}): Promise<APIResponse> {
    return this.delete(ENDPOINTS.USERS.BY_ID(id), {
      ...options,
    });
  }
}
