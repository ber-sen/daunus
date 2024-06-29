import { ZodObject } from "zod";

import {
  DaunusAction,
  DaunusCtx,
  DaunusExcludeException,
  DaunusActionWithOptions,
  DaunusGetExceptions,
  DaunusInput,
  DaunusVar,
  ResolveDaunusVar
} from "./types";
import { Path, TypeAtPath, get } from "./get";
import { isArray, isException } from "./helpers";

async function getValue(ctx: DaunusCtx, arg: DaunusAction<any, any, any>) {
  if (arg instanceof ZodObject) {
    return ctx.get("input");
  }

  if (ctx.has(arg.name)) {
    return ctx.get(arg.name).data ?? ctx.get(arg.name).error;
  }

  if ("run" in arg) {
    const res = await arg.run(ctx);

    return res.data ?? res.exception;
  }
}

type ExtractDaunusType<T> = T extends readonly DaunusAction<any, any, any>[]
  ? {
      [K in keyof T]: T[K] extends DaunusAction<infer Y, any, any> ? Y : never;
    }
  : never;

export function $var<I, K extends Path<I>>(
  arg: DaunusInput<I>,
  selector: K
): DaunusVar<TypeAtPath<I, K>>;

export function $var<I, R>(
  arg: DaunusInput<I>,
  selector: (value: I) => R | Promise<R>
): DaunusVar<R>;

export function $var<I>(
  arg: DaunusInput<I>,
  selector?: undefined
): DaunusVar<I>;

export function $var<T, K extends Path<DaunusExcludeException<T>>>(
  arg: DaunusActionWithOptions<T, any, any>,
  selector: K
): DaunusVar<TypeAtPath<DaunusExcludeException<T>, K> | DaunusGetExceptions<T>>;

export function $var<T, R>(
  arg: DaunusActionWithOptions<T, any, any>,
  selector: (value: ResolveDaunusVar<T>) => R | Promise<R>
): DaunusVar<R | DaunusGetExceptions<T>>;

export function $var<T>(
  arg: DaunusActionWithOptions<T, any, any>,
  selector?: undefined
): DaunusVar<T | DaunusGetExceptions<T>>;

export function $var<T, K extends Path<DaunusExcludeException<T>>>(
  arg: DaunusAction<T, any, any>,
  selector: K
): DaunusVar<TypeAtPath<DaunusExcludeException<T>, K> | DaunusGetExceptions<T>>;

export function $var<T, R>(
  arg: DaunusAction<T, any, any>,
  selector: (value: ResolveDaunusVar<T>) => R | Promise<R>
): DaunusVar<R | DaunusGetExceptions<T>>;

export function $var<T>(
  arg: DaunusAction<T, any, any>,
  selector?: undefined
): DaunusVar<T | DaunusGetExceptions<T>>;

export function $var<T extends readonly DaunusAction<any, any, any>[], R>(
  arg: T,
  selector: (value: ExtractDaunusType<T>) => R | Promise<R>
): DaunusVar<R>;

export function $var(arg: any, selector?: any) {
  if (isArray(arg)) {
    const $var = async (ctx: DaunusCtx) => {
      const values = await Promise.all(arg.map((item) => getValue(ctx, item)));

      return await selector(values);
    };

    $var.toString = () => "<% daunus_var %>";
    $var.toJSON = () => "<% daunus_var %>";
    $var.__type = "daunus_var";

    return $var;
  }

  const $var = async (ctx: DaunusCtx) => {
    const value = await getValue(ctx, arg);

    if (isException(value)) {
      return value;
    }

    if (!selector) {
      return value;
    }

    return typeof selector === "function"
      ? await selector(value)
      : get(value, selector);
  };

  $var.toString = () => `<% ${selector.toString()} %>`;
  $var.toJSON = () => `<% ${selector.toString()} %>`;
  $var.__type = "daunus_var";

  return $var;
}
