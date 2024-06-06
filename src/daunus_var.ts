import { ZodObject } from "zod";

import {
  DaunusAction,
  DaunusCtx,
  DaunusExcludeError,
  DaunusActionWithParams,
  DaunusGetErrors,
  DaunusInput,
  DaunusVar
} from "./types";
import { Path, TypeAtPath, get } from "./get";
import { isArray, isError } from "./helpers";

async function getValue(ctx: DaunusCtx, arg: DaunusAction<any, any, any>) {
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

export function $var<T, K extends Path<DaunusExcludeError<T>>>(
  arg: DaunusActionWithParams<T, any, any>,
  selector: K
): DaunusVar<TypeAtPath<DaunusExcludeError<T>, K> | DaunusGetErrors<T>>;

export function $var<T, R>(
  arg: DaunusActionWithParams<T, any, any>,
  selector: (value: T) => R | Promise<R>
): DaunusVar<R | DaunusGetErrors<T>>;

export function $var<T>(
  arg: DaunusActionWithParams<T, any, any>,
  selector?: undefined
): DaunusVar<T | DaunusGetErrors<T>>;

export function $var<T, K extends Path<DaunusExcludeError<T>>>(
  arg: DaunusAction<T, any, any>,
  selector: K
): DaunusVar<TypeAtPath<DaunusExcludeError<T>, K> | DaunusGetErrors<T>>;

export function $var<T, R>(
  arg: DaunusAction<T, any, any>,
  selector: (value: T) => R | Promise<R>
): DaunusVar<R | DaunusGetErrors<T>>;

export function $var<T>(
  arg: DaunusAction<T, any, any>,
  selector?: undefined
): DaunusVar<T | DaunusGetErrors<T>>;

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

  $var.toString = () => `<% ${selector.toString()} %>`;
  $var.toJSON = () => `<% ${selector.toString()} %>`;
  $var.__type = "daunus_var";

  return $var;
}
