import { z } from 'zod';

import { DEFAULT_ACTIONS } from './defaultActions';

export const tineCtx = (value?: object): Map<any, any> =>
  new Map(Object.entries({ ...value, '.defaultActions': DEFAULT_ACTIONS }));

export const tineInput = <T>(
  schema: z.ZodType<T>,
  args?: { name?: string },
): z.ZodType<T> =>
  Object.assign(schema, { ...args, name: args?.name || 'input' });
