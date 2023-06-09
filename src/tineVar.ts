import { TineAction, TineCtx, TineInput, TineVar } from './types';
import { Path, TypeAtPath, get } from './get';
import { isArray } from './helpers';

type ExtractTineType<T> = T extends readonly (
  | TineInput<any>
  | TineAction<any>
)[]
  ? {
      [K in keyof T]: T[K] extends TineInput<infer X>
        ? X
        : T[K] extends TineAction<infer Y>
        ? Y
        : never;
    }
  : never;

export function tineVar<T, K extends Path<T>>(
  arg: TineInput<T> | TineAction<T>,
  selector: K,
): TineVar<TypeAtPath<T, K>>;

export function tineVar<T, R>(
  arg: TineInput<T> | TineAction<T>,
  selector: (value: T) => R | Promise<R>,
): TineVar<R>;

export function tineVar<T>(
  arg: TineInput<T> | TineAction<T>,
  selector?: undefined,
): TineVar<T>;

export function tineVar<
  T extends readonly (TineInput<any> | TineAction<any>)[],
  R,
>(arg: T, selector: (value: ExtractTineType<T>) => R | Promise<R>): TineVar<R>;

export function tineVar(arg: any, selector?: any) {
  const getValue = async (
    ctx: TineCtx,
    arg: TineInput<any> | TineAction<any>,
  ) => {
    if (ctx.has(arg.name)) {
      return ctx.get(arg.name);
    }

    if ('run' in arg) {
      return await arg.run(ctx);
    }
  };

  if (isArray(arg)) {
    const tineVar = async (ctx: TineCtx) => {
      const values = await Promise.all(arg.map((item) => getValue(ctx, item)));

      return await selector(values);
    };

    tineVar.toString = () => '{{tineVar}}';
    tineVar.toJSON = () => '{{tineVar}}';

    return tineVar;
  }

  const tineVar = async (ctx: TineCtx) => {
    const value = await getValue(ctx, arg);

    if (!selector) {
      return value;
    }

    return typeof selector === 'function'
      ? await selector(value)
      : get(value, selector);
  };

  tineVar.toString = () => '{{tineVar}}';
  tineVar.toJSON = () => '{{tineVar}}';

  return tineVar;
}
