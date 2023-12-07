import { z } from 'zod';

import { TineInput } from './types';
import { DEFAULT_ACTIONS } from './defaultActions';

export const tineCtx = (value?: object): Map<any, any> =>
  new Map(Object.entries({ ...value, '.defaultActions': DEFAULT_ACTIONS }));

export const tineInput = <T>(
  schema: z.ZodType<T>,
  args?: { name?: string },
): TineInput<T> =>
  Object.assign(schema, { ...args, name: args?.name || 'input' });
