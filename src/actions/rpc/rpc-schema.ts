import { z } from 'zod';

export const rpcSchema = z.object({
  endpoint: z.string(),
  secret: z.string(),
  workflow: z.any(),
});
