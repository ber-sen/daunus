import { z } from 'zod';

import { TineInput } from './types';
import { BASE_ACTIONS } from './baseActions';

export const tineCtx = (value?: object): Map<any, any> =>
  new Map(Object.entries({ ...value, '.baseActions': BASE_ACTIONS }));

export const tineInput = <T>(
  schema: z.ZodType<T>,
  args?: { name?: string },
): TineInput<T> =>
  Object.assign(schema, { ...args, name: args?.name || 'input' });
