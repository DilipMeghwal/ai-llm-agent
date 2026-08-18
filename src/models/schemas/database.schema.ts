import { z } from 'zod';

export const DatabaseOperationResponseSchema = z.union([
  z.object({}).passthrough(),
  z.string(),
  z.null(),
  z.undefined()
]);
