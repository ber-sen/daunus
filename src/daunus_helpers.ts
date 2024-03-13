import { z } from "./zod";

import { DEFAULT_ACTIONS } from "./default_actions";

export const $ctx = (value?: object): Map<any, any> =>
  new Map(Object.entries({ ...value, ".defaultActions": DEFAULT_ACTIONS }));

export const $input = z.object;
