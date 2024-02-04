import { UnknownKeysParam, ZodObject, ZodRawShape, ZodTypeAny } from "zod";

import {
  TineAction,
  TineCtx,
  TineExcludeError,
  TineActionWithParams,
  TineGetErrors,
  TineInput,
  TineVar
} from "./types";
import { Path, TypeAtPath, get } from "./get";
import { isArray, isError } from "./helpers";

async function getValue(ctx: TineCtx, arg: TineAction<any, any>) {
  if (arg instanceof ZodObject) {
    return ctx.get("input");
  }

  if (ctx.has(arg.name)) {
    return ctx.get(arg.name).data ?? ctx.get(arg.name).error;
  }

  if ("run" in arg) {
    const res = await arg.run(ctx);

    return res.data ?? res.error;
  }
}

type ExtractTineType<T> = T extends readonly TineAction<any, any>[]
  ? {
      [K in keyof T]: T[K] extends TineAction<infer Y, any> ? Y : never;
    }
  : never;

export function tineVar<
  T extends ZodRawShape,
  U extends UnknownKeysParam,
  C extends ZodTypeAny,
  O,
  I,
  K extends Path<O>
>(arg: TineInput<T, U, C, O, I>, selector: K): TineVar<TypeAtPath<O, K>>;

export function tineVar<
  T extends ZodRawShape,
  U extends UnknownKeysParam,
  C extends ZodTypeAny,
  O,
  I,
  R
>(
  arg: TineInput<T, U, C, O, I>,
  selector: (value: O) => R | Promise<R>
): TineVar<R>;

export function tineVar<T, K extends Path<TineExcludeError<T>>>(
  arg: TineActionWithParams<T, any>,
  selector: K
): TineVar<TypeAtPath<TineExcludeError<T>, K> | TineGetErrors<T>>;

export function tineVar<T, R>(
  arg: TineActionWithParams<T, any>,
  selector: (value: T) => R | Promise<R>
): TineVar<R | TineGetErrors<T>>;

export function tineVar<T>(
  arg: TineActionWithParams<T, any>,
  selector?: undefined
): TineVar<T | TineGetErrors<T>>;

export function tineVar<T, K extends Path<TineExcludeError<T>>>(
  arg: TineAction<T, any>,
  selector: K
): TineVar<TypeAtPath<TineExcludeError<T>, K> | TineGetErrors<T>>;

export function tineVar<T, R>(
  arg: TineAction<T, any>,
  selector: (value: T) => R | Promise<R>
): TineVar<R | TineGetErrors<T>>;

export function tineVar<T>(
  arg: TineAction<T, any>,
  selector?: undefined
): TineVar<T | TineGetErrors<T>>;

export function tineVar<T extends readonly TineAction<any, any>[], R>(
  arg: T,
  selector: (value: ExtractTineType<T>) => R | Promise<R>
): TineVar<R>;

export function tineVar(arg: any, selector?: any) {
  if (isArray(arg)) {
    const tineVar = async (ctx: TineCtx) => {
      const values = await Promise.all(arg.map((item) => getValue(ctx, item)));

      return await selector(values);
    };

    tineVar.toString = () => "{{tineVar}}";
    tineVar.toJSON = () => "{{tineVar}}";
    tineVar.__type = "tineVar";

    return tineVar;
  }

  const tineVar = async (ctx: TineCtx) => {
    const value = await getValue(ctx, arg);

    if (isError(value)) {
      return value;
    }

    if (!selector) {
      return value;
    }

    return typeof selector === "function"
      ? await selector(value)
      : get(value, selector);
  };

  tineVar.toString = () => `{{ ${selector.toString()} }}`;
  tineVar.toJSON = () => `{{ ${selector.toString()} }}`;
  tineVar.__type = "tineVar";

  return tineVar;
}
