import { UnknownKeysParam, ZodRawShape, ZodTypeAny } from "zod";

import { z } from "./zod";

export type DaunusVar<T> =
  DaunusExcludeError<T> extends never
    ? T
    : DaunusExcludeError<T> & ((ctx: DaunusCtx) => Promise<T>);

export type DaunusParams<T> = T; // TODO: fix type

export type DaunusInput<
  T extends ZodRawShape,
  U extends UnknownKeysParam,
  C extends ZodTypeAny,
  O,
  I
> = z.ZodObject<T, U, C, O, I>;

export type DaunusCtx = Map<any, any>;

export type ResolveDaunusVar<T> =
  T extends DaunusVar<infer U>
    ? U extends DaunusVar<infer Z>
      ? Z
      : U extends Array<infer A>
        ? Array<ResolveDaunusVar<A>>
        : U extends object
          ? {
              [K in keyof U]: ResolveDaunusVar<U[K]>;
            }
          : U
    : T extends Array<infer A>
      ? Array<ResolveDaunusVar<A>>
      : T extends Date
        ? T
        : T extends object
          ? {
              [K in keyof T]: ResolveDaunusVar<T[K]>;
            }
          : T;

export type ResolveDaunusVarData<T> =
  T extends DaunusVar<infer U>
    ? U extends DaunusVar<infer Z>
      ? DaunusExcludeError<Z>
      : U extends Array<infer A>
        ? Array<ResolveDaunusVarData<A>>
        : U extends DaunusError<any, any>
          ? DaunusExcludeError<U>
          : U extends object
            ? {
                [K in keyof U]: ResolveDaunusVarData<U[K]>;
              }
            : U
    : T extends Array<infer A>
      ? Array<ResolveDaunusVarData<A>>
      : T extends Date
        ? T
        : T extends DaunusError<any, any>
          ? DaunusExcludeError<T>
          : T extends object
            ? {
                [K in keyof T]: ResolveDaunusVarData<T[K]>;
              }
            : T;

export type ResolveDaunusVarError<T> =
  T extends DaunusVar<infer U>
    ? U extends DaunusVar<infer Z>
      ? DaunusGetErrors<Z>
      : U extends Array<infer A>
        ? Array<ResolveDaunusVarError<A>>
        : U extends DaunusError<any, any>
          ? DaunusGetErrors<U>
          : U extends object
            ? {
                [K in keyof U]: ResolveDaunusVarError<U[K]>;
              }
            : never
    : T extends Array<infer A>
      ? Array<ResolveDaunusVarError<A>>
      : T extends Date
        ? T
        : T extends DaunusError<any, any>
          ? T
          : T extends object
            ? {
                [K in keyof T]: ResolveDaunusVarError<T[K]>;
              }
            : never;

export type ExtractDaunusErrors<T> =
  T extends DaunusError<any, any>
    ? T
    : T extends object
      ? {
          [K in keyof T]: T[K] extends DaunusError<any, any>
            ? T[K]
            : ExtractDaunusErrors<T[K]>;
        }[keyof T]
      : never;

export type NonUndefined<T> = T extends undefined ? never : T;

export type DaunusActionInfo<D, P> = {
  name: string;
  type: string;
  params: any;
  data?: ResolveDaunusVarData<D>;
  error?: NonUndefined<
    | ExtractDaunusErrors<ResolveDaunusVarError<D>>
    | ExtractDaunusErrors<ResolveDaunusVarError<P>>
  >;
};

export type DaunusActionRunOptions<T, P> = {
  onComplete?: (actionInfo: DaunusActionInfo<T, P>, ctx: DaunusCtx) => void;
};

export type DaunusAction<T, P, E> = {
  name: string;
  envSchema?: z.Schema<E>;
  run: (
    ctx?: DaunusCtx,
    options?: DaunusActionRunOptions<T, P>
  ) => Promise<{
    data: ResolveDaunusVarData<T>;
    error: NonUndefined<
      | ExtractDaunusErrors<ResolveDaunusVarError<T>>
      | ExtractDaunusErrors<ResolveDaunusVarError<P>>
    >;
  }>;
};

export type DaunusWorkflowAction<T> = {
  type: string[];
  params?: T;
  name?: string;
};

export type DaunusActionWithInput<
  T extends ZodRawShape,
  U extends UnknownKeysParam,
  C extends ZodTypeAny,
  O,
  I,
  Z,
  B,
  Q,
  D,
  P,
  E
> = {
  meta: {
    iSchema: z.ZodObject<T, U, C, O, I>;
    // oSchema?: z.ZodType<ResolveDaunusVar<D>>;
    openApi?: {
      method?:
        | "get"
        | "post"
        | "put"
        | "delete"
        | "patch"
        | "head"
        | "options"
        | "trace";
      contentType?: string;
      params?: Z;
      body?: B;
      query?: Q;
    };
  };
  input: (value: I) => DaunusAction<D, P, E>;
  rawInput: (value: unknown) => DaunusAction<D, P, E>;
};

export type DaunusActionWithParams<D, P, E> = DaunusAction<D, P, E> & {
  noParams: () => DaunusAction<D, P, E>;
  withParams: <
    T extends ZodRawShape,
    U extends UnknownKeysParam,
    C extends ZodTypeAny,
    O,
    I,
    Z,
    B,
    Q
  >(
    iSchema: DaunusInput<T, U, C, O, I>,
    meta?: {
      openApi?: {
        method?:
          | "get"
          | "post"
          | "put"
          | "delete"
          | "patch"
          | "head"
          | "options"
          | "trace";
        contentType?: string;
        params?: Z;
        body?: B;
        query?: Q;
      };
    }
  ) => DaunusActionWithInput<T, U, C, O, I, Z, B, Q, D, P, E>;
};

export type DaunusActionOptions<E> = {
  ctx: DaunusCtx;
  env: E;
  parseParams: <X>(ctx: Map<string, any>, params: X) => Promise<X>;
};

export type DaunusExcludeError<T> = T extends DaunusError<any, any> ? never : T;

export type DaunusGetErrors<T> = T extends DaunusError<any, any> ? T : never;

export type DaunusInferReturn<
  T extends
    | DaunusAction<any, any, any>
    | DaunusActionWithInput<
        any,
        any,
        any,
        any,
        any,
        any,
        any,
        any,
        any,
        any,
        any
      >
> =
  T extends DaunusActionWithInput<
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any
  >
    ? Awaited<ReturnType<ReturnType<T["input"]>["run"]>>
    : T extends DaunusAction<any, any, any>
      ? Awaited<ReturnType<T["run"]>>
      : never;

export type DaunusInferInput<
  T extends DaunusActionWithInput<
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any
  >
> =
  T extends DaunusActionWithInput<
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any
  >
    ? Parameters<T["input"]>[0]
    : never;

export class DaunusError<S extends number, D = undefined> extends Error {
  public status: S;
  public data?: D;

  constructor(status: S, message?: string, data?: D) {
    super(message);

    this.name = "DaunusError";
    this.status = status;
    this.data = data;
  }
}

type WaitParams =
  | {
      delay: string;
    }
  | {
      until: Date;
    };

export class Wait extends DaunusError<102, WaitParams> {
  constructor(params: WaitParams) {
    super(102, "Wait", params);
  }
}

export type Expect<T extends true> = T;

export type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? true
    : false;

export type ErrorParams<T, P> =
  ExtractDaunusErrors<T> extends never ? P : ExtractDaunusErrors<T>;
