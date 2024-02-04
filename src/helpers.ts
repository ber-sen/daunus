import { get } from "./get";
import {
  ResolveTineVarData,
  ResolveTineVarError,
  ExtractTineErrors,
  TineError,
  TineCtx,
  TineVar,
  NonUndefined
} from "./types";

export const isObject = (value: any): value is object =>
  value === null ||
  Array.isArray(value) ||
  typeof value === "function" ||
  value instanceof Set ||
  value instanceof Map ||
  value?.constructor === Date
    ? false
    : typeof value === "object";

export const isTineVar = (value: any) =>
  typeof value === "function" && value.__type === "tineVar";

export const isTinePlaceholder = (value: any) =>
  typeof value === "string" && /{{\s*([\S\s]*?)\s*}}/g.test(value);

export const isArray = (value: any): value is any[] => Array.isArray(value);

export const isError = (value: any): value is TineError<any, any> =>
  value instanceof TineError;

export const isMapLike = (value: any): value is Map<any, any> => {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof value.has === "function" &&
    typeof value.get === "function"
  );
};

export const isAction = <T>(obj: T): obj is T & { type: [string] } => {
  return (
    isObject(obj) &&
    "type" in obj &&
    isArray(obj.type) &&
    obj.type.length === 1 &&
    typeof obj.type[0] === "string"
  );
};

export const resolveTineVar = (ctx: TineCtx, tineVar: TineVar<any>) =>
  tineVar(ctx);

export const resolveTinePlaceholder = (ctx: TineCtx, str: TineVar<any>) => {
  const $ = new Proxy(ctx, {
    get(target, name) {
      return get(target, name as any);
    }
  });

  if (/^{{\s*([\S\s]*?)\s*}}$/g.test(str)) {
    const match = /^{{\s*([\S\s]*?)\s*}}$/g.exec(str);

    if (match && ctx.has(".tine-placeholder-resolver")) {
      return ctx.get(".tine-placeholder-resolver")($, match[1]);
    }

    return get({ $ }, match && (match[1].trim() as any));
  }

  const interpolated = str.replace(
    /{{\s*([\S\s]*?)\s*}}/g,
    (_: any, key: string) => {
      if (ctx.has(".tine-placeholder-resolver")) {
        return ctx.get(".tine-placeholder-resolver")($, key);
      }

      return get({ $ }, key.trim() as any);
    }
  );

  return interpolated;
};

function extractTineErrors<T>(obj: T): TineError<any>[] {
  const tineErrors: TineError<any>[] = [];

  function traverseObject(obj: any): void {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        if (value instanceof TineError) {
          tineErrors.push(value);
        } else if (typeof value === "object" && value !== null) {
          traverseObject(value);
        }
      }
    }
  }

  traverseObject(obj);
  return tineErrors;
}

export const parseResult = <T, P>(
  data: T
): {
  data: ResolveTineVarData<T>;
  error: NonUndefined<
    | ExtractTineErrors<ResolveTineVarError<T>>
    | ExtractTineErrors<ResolveTineVarError<P>>
  >;
} => {
  if (isError(data)) {
    return {
      data: undefined as ResolveTineVarData<T>,
      error: data as NonUndefined<
        | ExtractTineErrors<ResolveTineVarError<T>>
        | ExtractTineErrors<ResolveTineVarError<P>>
      >
    };
  }

  if (isObject(data)) {
    const errors = extractTineErrors(data);

    if (errors[0]) {
      return {
        data: undefined as ResolveTineVarData<T>,
        error: errors[0] as NonUndefined<
          | ExtractTineErrors<ResolveTineVarError<T>>
          | ExtractTineErrors<ResolveTineVarError<P>>
        >
      };
    }
  }

  return {
    data: data as ResolveTineVarData<T>,
    error: undefined as any as NonUndefined<
      | ExtractTineErrors<ResolveTineVarError<T>>
      | ExtractTineErrors<ResolveTineVarError<P>>
    >
  };
};
