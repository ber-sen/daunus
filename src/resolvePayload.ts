import {
  isArray,
  isObject,
  isTinePlaceholder,
  isTineVar,
  resolveTinePlaceholder,
  resolveTineVar,
} from './helpers';
import { TinePayload } from './types';

export const resolvePayload = async <T>(
  ctx: Map<string, unknown>,
  payload: TinePayload<T>,
  options?: { skipPlaceholders?: Boolean },
): Promise<T> => {
  if (!options?.skipPlaceholders && isTinePlaceholder(payload)) {
    return await resolveTinePlaceholder(ctx, payload);
  }

  if (isTineVar(payload)) {
    return resolvePayload(ctx, await resolveTineVar(ctx, payload), options);
  }

  if (isArray(payload)) {
    const result: any = [];

    for (const key in payload) {
      const value = await resolvePayload(ctx, payload[key], options);

      result[key] = value;
    }

    return result as any;
  }

  if (isObject(payload)) {
    const result = {};

    for (const key of Object.keys(payload)) {
      const value = await resolvePayload(ctx, payload[key], options);

      result[key] = value;
    }

    return result as any;
  }

  return payload;
};
