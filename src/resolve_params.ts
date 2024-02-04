import {
  isArray,
  isError,
  isObject,
  isTinePlaceholder,
  isTineVar,
  resolveTinePlaceholder,
  resolveTineVar
} from "./helpers";
import { TineParams } from "./types";

export const resolveParams = async <T>(
  ctx: Map<string, unknown>,
  params: TineParams<T>,
  options?: { skipPlaceholders?: boolean }
): Promise<T> => {
  if (isError(params)) {
    return params;
  }

  if (!options?.skipPlaceholders && isTinePlaceholder(params)) {
    return await resolveTinePlaceholder(ctx, params);
  }

  if (isTineVar(params)) {
    return resolveParams(ctx, await resolveTineVar(ctx, params), options);
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
