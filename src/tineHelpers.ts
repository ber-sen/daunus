import { z } from 'zod';
import { TineInput } from './types';

export const tineCtx = (value: object) => new Map(Object.entries(value));

export const tineInput = <T>(
  schema: z.ZodType<T>,
  args?: { name?: string },
): TineInput<T> =>
  Object.assign(schema, { ...args, name: args?.name || 'input' });
