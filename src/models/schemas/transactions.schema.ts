import { z } from 'zod';
import { TransactionSchema } from './common.schema';

export { TransactionSchema };

export const TransactionArraySchema = z.array(TransactionSchema);
