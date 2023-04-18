import { z } from 'zod';
import { TineAction, TineCtx, TineInput, TineVar } from './types';
import { GetFieldType, get } from './get';

export function tineVar<T>(
  arg: TineInput<T> | z.ZodType<T> | TineAction<T>,
  selector?: undefined,
): TineVar<T>;

export function tineVar<T, R>(
  arg: TineInput<T> | z.ZodType<T> | TineAction<T>,
  selector?: (value: T) => R,
): TineVar<R>;

export function tineVar<T, K extends string>(
  arg: TineInput<T> | z.ZodType<T> | TineAction<T>,
  selector?: K,
): TineVar<GetFieldType<T, K>>;

export function tineVar(
  arg: TineInput<any> | TineAction<any>,
  selector?: (value: any) => any | string,
) {
  const getValue = async (ctx: TineCtx) => {
    const value = ctx.get('name' in arg ? arg.name : arg);

    if (value) {
      return value;
    }

    if ('run' in arg) {
      return await arg.run({ ctx });
    }
  };

  return {
    __value: async (ctx: TineCtx) => {
      const value = await getValue(ctx);

      if (!value || !selector) {
        return value;
      }

      return typeof selector === 'function'
        ? await selector(value)
        : get(value, selector);
    },
  };
}
