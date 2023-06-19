import { get } from './get';
import { TineCtx, TineVar } from './types';

export const isObject = (value: any): value is object =>
  value === null ||
  Array.isArray(value) ||
  typeof value == 'function' ||
  value?.constructor === Date
    ? false
    : typeof value == 'object';

export const isTineVar = (value: any) =>
  typeof value === 'function' && value.__type === 'tineVar';

export const isTinePlaceholder = (value: any) =>
  typeof value === 'string' && /{{\s?([^}]*)\s?}}/g.test(value);

export const isArray = (value: any): value is any[] => Array.isArray(value);

export const isMapLike = (value: any): value is Map<any, any> => {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.has === 'function' &&
    typeof value.get === 'function'
  );
};

export const resolveTineVar = (ctx: TineCtx, tineVar: TineVar<any>) =>
  tineVar(ctx);

export const resolveTinePlaceholder = (ctx: TineCtx, str: TineVar<any>) => {
  const $ = new Proxy(ctx, {
    get(target, name) {
      return target.get(name);
    },
  });

  const interpolated = str.replace(
    /{{\s?([^}]*)\s?}}/g,
    (_: any, key: string) => {
      if (ctx.has('.tine-placeholder-get')) {
        return ctx.get('.tine-placeholder-get')($, key);
      }

      return get<any, any>({ $ }, key.trim());
    },
  );

  return interpolated;
};
