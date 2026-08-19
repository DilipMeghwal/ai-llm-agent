import { faker } from '@faker-js/faker';
import { ResetPasswordRequest } from '../models/types/user.type';

export class UserFactory {
  /**
   * Generates a valid reset password request payload
   */
  static buildResetPasswordPayload(overridePassword?: string): ResetPasswordRequest {
    return {
      newPassword: overridePassword ?? `${faker.internet.password({ length: 12 })}!Aa1`,
    };
  }

  /**
   * Generates an invalid reset password request payload with empty string
   */
  static buildEmptyPasswordPayload(): ResetPasswordRequest {
    return {
      newPassword: '',
    };
  }

  /**
   * Generates dynamic user registration/creation data
   */
  static buildUserData() {
    return {
      username: faker.internet.username(),
      email: faker.internet.email(),
      password: `${faker.internet.password({ length: 12 })}!Aa1`,
    };
  }
}
