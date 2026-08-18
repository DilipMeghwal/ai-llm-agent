import { z } from 'zod';
import { CustomerSchema, AccountSchema } from './common.schema';

export { CustomerSchema, AccountSchema };

export const CreateAccountParamsSchema = z.object({
  customerId: z.number().int(),
  newAccountType: z.number().int(), // 0: CHECKING, 1: SAVINGS, 2: LOAN
  fromAccountId: z.number().int(),
});

export const UpdateCustomerParamsSchema = z.object({
  customerId: z.number().int(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zipCode: z.string().min(1),
  phoneNumber: z.string().min(1),
  ssn: z.string().min(1),
  username: z.string().min(1),
  password: z.string().min(1),
});
