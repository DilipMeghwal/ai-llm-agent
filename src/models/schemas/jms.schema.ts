import { z } from 'zod';

export const JmsOperationResponseSchema = z.union([
  z.object({}).passthrough(),
  z.string(),
  z.null(),
  z.undefined()
]);
