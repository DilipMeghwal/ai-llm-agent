import { z } from 'zod';

export const AddressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
});

export const PayeeSchema = z.object({
  name: z.string().optional(),
  address: AddressSchema.optional(),
  phoneNumber: z.string().optional(),
  accountNumber: z.number().int().optional(),
});

export const BillPayResultSchema = z.object({
  payeeName: z.string().optional(),
  amount: z.number().optional(),
  accountId: z.number().int().optional(),
});

export const CustomerSchema = z.object({
  id: z.number().int().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  address: AddressSchema.optional(),
  phoneNumber: z.string().optional(),
  ssn: z.string().optional(),
});

export const AccountTypeEnum = z.enum(['CHECKING', 'SAVINGS', 'LOAN']);

export const AccountSchema = z.object({
  id: z.number().int().optional(),
  customerId: z.number().int().optional(),
  type: z.union([AccountTypeEnum, z.string()]).optional(),
  balance: z.number().optional(),
});

export const LoanResponseSchema = z.object({
  responseDate: z.union([z.string(), z.number()]).optional(),
  loanProviderName: z.string().optional(),
  approved: z.boolean().optional(),
  message: z.string().optional(),
  accountId: z.number().int().optional(),
});

export const PositionSchema = z.object({
  positionId: z.number().int().optional(),
  customerId: z.number().int().optional(),
  name: z.string().optional(),
  symbol: z.string().optional(),
  shares: z.number().int().optional(),
  purchasePrice: z.number().optional(),
});

export const HistoryPointSchema = z.object({
  symbol: z.string().optional(),
  date: z.string().optional(),
  closingPrice: z.number().optional(),
});

export const TransactionTypeEnum = z.enum(['Credit', 'Debit', 'CREDIT', 'DEBIT']);

export const TransactionSchema = z.object({
  id: z.number().int().optional(),
  accountId: z.number().int().optional(),
  type: z.union([TransactionTypeEnum, z.string()]).optional(),
  date: z.union([z.string(), z.number()]).optional(),
  amount: z.number().optional(),
  description: z.string().optional(),
});
