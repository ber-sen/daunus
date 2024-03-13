import {
  isArray,
  isError,
  isObject,
  isDaunusPlaceholder,
  isDaunusVar,
  resolveDaunusPlaceholder,
  resolveDaunusVar
} from "./helpers";
import { DaunusParams } from "./types";

export const resolveParams = async <T>(
  ctx: Map<string, unknown>,
  params: DaunusParams<T>,
  options?: { skipPlaceholders?: boolean }
): Promise<T> => {
  if (isError(params)) {
    return params;
  }

  if (!options?.skipPlaceholders && isDaunusPlaceholder(params)) {
    return await resolveDaunusPlaceholder(ctx, params);
  }

  if (isDaunusVar(params)) {
    return resolveParams(ctx, await resolveDaunusVar(ctx, params), options);
  }

  if (isArray(params)) {
    const result: any = [];

    for (const key in params) {
      const value = await resolveParams(ctx, params[key], options);

      result[key] = value;
    }

    return result as any;
  }

  if (isObject(params)) {
    const result: any = {};

    for (const key of Object.keys(params)) {
      const value = await resolveParams(ctx, (params as any)[key], options);

      result[key] = value;
    }

    return result as any;
  }

  return params;
};
