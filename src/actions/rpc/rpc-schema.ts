import { z } from 'zod';

export const rpcSchema = z.object({
  endpoint: z.string(),
  secret: z.string(),
  type: z.array(z.string()),
  name: z.string().optional(),
  params: z.any(),
});
