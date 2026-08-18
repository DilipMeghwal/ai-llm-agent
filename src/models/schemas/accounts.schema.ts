import { z } from 'zod';
import { AccountSchema, BillPayResultSchema, PayeeSchema } from './common.schema';

export { BillPayResultSchema, PayeeSchema, AccountSchema };

export const AccountArraySchema = z.array(AccountSchema);

export const BillPayRequestSchema = z.object({
  accountId: z.number().int(),
  amount: z.number().positive(),
  payee: PayeeSchema,
});

export const DepositParamsSchema = z.object({
  accountId: z.number().int(),
  amount: z.number().positive(),
});

export const TransferParamsSchema = z.object({
  fromAccountId: z.number().int(),
  toAccountId: z.number().int(),
  amount: z.number().positive(),
});

export const WithdrawParamsSchema = z.object({
  accountId: z.number().int(),
  amount: z.number().positive(),
});
