import { z } from 'zod';

export const rpcSchema = z.object({
  endpoint: z.string(),
  secret: z.string(),
  action: z.string(),
  name: z.string().optional(),
  payload: z.any(),
});
