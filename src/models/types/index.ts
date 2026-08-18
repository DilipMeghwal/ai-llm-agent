import { z } from 'zod';
import {
  AddressSchema,
  PayeeSchema,
  BillPayResultSchema,
  CustomerSchema,
  AccountSchema,
  LoanResponseSchema,
  PositionSchema,
  HistoryPointSchema,
  TransactionSchema,
} from '../schemas/common.schema';
import { BillPayRequestSchema, DepositParamsSchema, TransferParamsSchema, WithdrawParamsSchema } from '../schemas/accounts.schema';
import { CreateAccountParamsSchema, UpdateCustomerParamsSchema } from '../schemas/customers.schema';
import { RequestLoanParamsSchema } from '../schemas/loans.schema';
import { LoginParamsSchema, SetParameterParamsSchema } from '../schemas/misc.schema';
import { BuyPositionParamsSchema, SellPositionParamsSchema } from '../schemas/positions.schema';

export type Address = z.infer<typeof AddressSchema>;
export type Payee = z.infer<typeof PayeeSchema>;
export type BillPayResult = z.infer<typeof BillPayResultSchema>;
export type Customer = z.infer<typeof CustomerSchema>;
export type Account = z.infer<typeof AccountSchema>;
export type LoanResponse = z.infer<typeof LoanResponseSchema>;
export type Position = z.infer<typeof PositionSchema>;
export type HistoryPoint = z.infer<typeof HistoryPointSchema>;
export type Transaction = z.infer<typeof TransactionSchema>;

export type BillPayRequest = z.infer<typeof BillPayRequestSchema>;
export type DepositParams = z.infer<typeof DepositParamsSchema>;
export type TransferParams = z.infer<typeof TransferParamsSchema>;
export type WithdrawParams = z.infer<typeof WithdrawParamsSchema>;

export type CreateAccountParams = z.infer<typeof CreateAccountParamsSchema>;
export type UpdateCustomerParams = z.infer<typeof UpdateCustomerParamsSchema>;
export type RequestLoanParams = z.infer<typeof RequestLoanParamsSchema>;
export type LoginParams = z.infer<typeof LoginParamsSchema>;
export type SetParameterParams = z.infer<typeof SetParameterParamsSchema>;
export type BuyPositionParams = z.infer<typeof BuyPositionParamsSchema>;
export type SellPositionParams = z.infer<typeof SellPositionParamsSchema>;
