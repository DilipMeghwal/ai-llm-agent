import { z } from 'zod';
import { CustomerSchema } from './common.schema';

export { CustomerSchema };

export const LoginParamsSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const SetParameterParamsSchema = z.object({
  name: z.string().min(1),
  value: z.string().min(1),
});
