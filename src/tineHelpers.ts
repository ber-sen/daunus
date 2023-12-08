import { z } from 'zod';

import { DEFAULT_ACTIONS } from './defaultActions';

export const tineCtx = (value?: object): Map<any, any> =>
  new Map(Object.entries({ ...value, '.defaultActions': DEFAULT_ACTIONS }));

export const tineInput = z.object;
