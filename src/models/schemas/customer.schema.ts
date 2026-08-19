import { sharedAjv } from './ajv';

export const customerSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    firstName: { type: 'string' },
    lastName: { type: 'string' },
    address: {
      type: 'object',
      properties: {
        street: { type: 'string' },
        city: { type: 'string' },
        state: { type: 'string' },
        zipCode: { type: 'string' },
      },
    },
    phoneNumber: { type: 'string' },
    ssn: { type: 'string' },
  },
  required: ['id', 'firstName', 'lastName'],
  additionalProperties: true,
} as const;

const validateCustomer = sharedAjv.compile(customerSchema);

export function parseCustomerResponse(data: unknown) {
  if (typeof data === 'object' && data !== null && !validateCustomer(data)) {
    throw new Error(`Customer schema validation failed: ${sharedAjv.errorsText(validateCustomer.errors)}`);
  }
  return data;
}
