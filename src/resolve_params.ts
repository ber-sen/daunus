import { ReadableStream } from "isomorphic-web-streams";
import {
  isArray,
  isException,
  isObject,
  isDaunusPlaceholder,
  isDaunusQuery,
  resolveDaunusPlaceholder,
  resolveDaunusVar
} from "./helpers";

export const resolveParams = async <T>(
  ctx: Map<string, unknown>,
  params: T,
  options?: { skipPlaceholders?: boolean }
): Promise<T> => {
  if (params instanceof ReadableStream) {
    return params;
  }

  if (isException(params)) {
    return params;
  }

  if (!options?.skipPlaceholders && isDaunusPlaceholder(params)) {
    return await resolveDaunusPlaceholder(ctx, params);
  }

  if (isDaunusQuery(params)) {
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
