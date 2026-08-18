import { z } from 'zod';
import { PositionSchema, HistoryPointSchema } from './common.schema';

export { PositionSchema, HistoryPointSchema };

export const PositionArraySchema = z.array(PositionSchema);
export const HistoryPointArraySchema = z.array(HistoryPointSchema);

export const BuyPositionParamsSchema = z.object({
  customerId: z.number().int(),
  accountId: z.number().int(),
  name: z.string().min(1),
  symbol: z.string().min(1),
  shares: z.number().int().positive(),
  pricePerShare: z.number().positive(),
});

export const SellPositionParamsSchema = z.object({
  customerId: z.number().int(),
  accountId: z.number().int(),
  positionId: z.number().int(),
  shares: z.number().int().positive(),
  pricePerShare: z.number().positive(),
});
