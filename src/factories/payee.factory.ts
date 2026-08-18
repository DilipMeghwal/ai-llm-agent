import { faker } from '@faker-js/faker';
import { Payee } from '../models/types';

export class PayeeFactory {
  static createValidPayee(overrides?: Partial<Payee>): Payee {
    return {
      name: faker.person.fullName(),
      address: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        zipCode: faker.location.zipCode(),
      },
      phoneNumber: faker.phone.number(),
      accountNumber: faker.number.int({ min: 10000, max: 99999 }),
      ...overrides,
    };
  }

  static createInvalidPayee(): Record<string, unknown> {
    return {
      name: '',
      accountNumber: 'invalid_account_number',
    };
  }
}
