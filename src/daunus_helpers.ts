import { ZodRawShape } from "zod";
import { z } from "./zod";

import { DEFAULT_ACTIONS } from "./default_actions";

export const $ctx = (value?: object): Map<any, any> =>
  new Map(Object.entries({ ...value, ".defaultActions": DEFAULT_ACTIONS }));

export const $input = z.object;

export const $httpInput = <T extends ZodRawShape>(shape: T) =>
  z.object({ __type: z.literal("http").catch("http"), ...shape });
