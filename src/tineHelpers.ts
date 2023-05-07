import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

export const tineCtx = (value: object) => new Map(Object.entries(value));

export const tineInput = <T>(schema: z.ZodType<T>, args?: { name?: string }) =>
  Object.assign(schema, { ...args, name: args?.name || uuidv4() });
