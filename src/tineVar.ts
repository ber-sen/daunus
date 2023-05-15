import { TineAction, TineCtx, TineInput, TineVar } from './types';
import { Path, TypeAtPath, get } from './get';
import { isArray } from './helpers';

export function tineVar<
  T extends readonly (TineInput<any> | TineAction<any>)[],
  R,
>(arg: T, selector: (value: T) => R): TineVar<R>;

export function tineVar<T, K extends Path<T>>(
  arg: TineInput<T> | TineAction<T>,
  selector: K,
): TineVar<TypeAtPath<T, K>>;

export function tineVar<T, R>(
  arg: TineInput<T> | TineAction<T>,
  selector: (value: T) => R,
): TineVar<R>;

export function tineVar<T>(
  arg: TineInput<T> | TineAction<T>,
  selector?: undefined,
): TineVar<T>;

export function tineVar(arg: any, selector?: any) {
  const getValue = async (
    ctx: TineCtx,
    arg: TineInput<any> | TineAction<any>,
  ) => {
    const value = ctx.get(arg.name);

    if (value) {
      return value;
    }

    if ('run' in arg) {
      return await arg.run(ctx);
    }
  };

  if (isArray(arg)) {
    return {
      __value: async (ctx: TineCtx) => {
        const values = await Promise.all(
          arg.map((item) => getValue(ctx, item)),
        );

        return await selector(values);
      },
    };
  }

  return {
    __value: async (ctx: TineCtx) => {
      const value = await getValue(ctx, arg);

      if (!value || !selector) {
        return value;
      }

      return typeof selector === 'function'
        ? await selector(value)
        : get(value, selector);
    },
  };
}
