import { get } from './get';
import {
  TineCtx,
  TineError,
  TineExcludeError,
  TineGetErrors,
  TineVar,
} from './types';

export const isObject = (value: any): value is object =>
  value === null ||
  Array.isArray(value) ||
  typeof value == 'function' ||
  value instanceof Set ||
  value instanceof Map ||
  value?.constructor === Date
    ? false
    : typeof value == 'object';

export const isTineVar = (value: any) =>
  typeof value === 'function' && value.__type === 'tineVar';

export const isTinePlaceholder = (value: any) =>
  typeof value === 'string' && /\{\{\s*([\s\S]*?)\s*\}\}/g.test(value);

export const isArray = (value: any): value is any[] => Array.isArray(value);

export const isError = (value: any): value is Error =>
  value && value.name && value.name === 'TineError';

export const isMapLike = (value: any): value is Map<any, any> => {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.has === 'function' &&
    typeof value.get === 'function'
  );
};

export const isAction = <T>(obj: T): obj is T & { type: [string] } => {
  return (
    isObject(obj) &&
    'type' in obj &&
    isArray(obj.type) &&
    obj.type.length === 1 &&
    typeof obj.type[0] === 'string'
  );
};

export const resolveTineVar = (ctx: TineCtx, tineVar: TineVar<any>) =>
  tineVar(ctx);

export const resolveTinePlaceholder = (ctx: TineCtx, str: TineVar<any>) => {
  const $ = new Proxy(ctx, {
    get(target, name) {
      return get(target, name as any);
    },
  });

  if (/^\{\{\s*([\s\S]*?)\s*\}\}$/g.test(str)) {
    const match = /^\{\{\s*([\s\S]*?)\s*\}\}$/g.exec(str);

    if (match && ctx.has('.tine-placeholder-resolver')) {
      return ctx.get('.tine-placeholder-resolver')($, match[1]);
    }

    return get({ $ }, match && (match[1].trim() as any));
  }

  const interpolated = str.replace(
    /\{\{\s*([\s\S]*?)\s*\}\}/g,
    (_: any, key: string) => {
      if (ctx.has('.tine-placeholder-resolver')) {
        return ctx.get('.tine-placeholder-resolver')($, key);
      }

      return get({ $ }, key.trim() as any);
    },
  );

  return interpolated;
};

export const parseResult = <T>(
  value: T,
): {
  data: TineExcludeError<T>;
  error?: TineGetErrors<T> | undefined;
} => {
  if (isError(value)) {
    return {
      data: undefined as TineExcludeError<T>,
      error: value as TineGetErrors<T>,
    };
  }

  return {
    data: value as TineExcludeError<T>,
    error: undefined,
  };
};
