import { faker } from '@faker-js/faker';
import { UpdateCustomerParams } from '../models/types';

export class CustomerFactory {
  static createValidUpdateCustomerParams(customerId: number, overrides?: Partial<UpdateCustomerParams>): UpdateCustomerParams {
    return {
      customerId,
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      zipCode: faker.location.zipCode(),
      phoneNumber: faker.phone.number(),
      ssn: faker.string.numeric(9),
      username: faker.internet.username(),
      password: faker.internet.password(),
      ...overrides,
    };
  }
}
