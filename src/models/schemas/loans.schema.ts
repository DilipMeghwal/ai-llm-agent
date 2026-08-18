import { z } from 'zod';
import { LoanResponseSchema } from './common.schema';

export { LoanResponseSchema };

export const RequestLoanParamsSchema = z.object({
  customerId: z.number().int(),
  amount: z.number().positive(),
  downPayment: z.number().nonnegative(),
  fromAccountId: z.number().int(),
});
