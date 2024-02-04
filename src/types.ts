import { UnknownKeysParam, ZodRawShape, ZodTypeAny } from "zod";

import { z } from "./zod";

export type TineVar<T> = TineExcludeError<T> & ((ctx: TineCtx) => Promise<T>);

export type TineParams<T> = T; // TODO: fix type

export type TineInput<
  T extends ZodRawShape,
  U extends UnknownKeysParam,
  C extends ZodTypeAny,
  O,
  I
> = z.ZodObject<T, U, C, O, I>;

export type TineCtx = Map<any, any>;

export type ResolveTineVar<T> =
  T extends TineVar<infer U>
    ? U extends TineVar<infer Z>
      ? Z
      : U extends Array<infer A>
        ? Array<ResolveTineVar<A>>
        : U extends object
          ? {
              [K in keyof U]: ResolveTineVar<U[K]>;
            }
          : U
    : T extends Array<infer A>
      ? Array<ResolveTineVar<A>>
      : T extends Date
        ? T
        : T extends object
          ? {
              [K in keyof T]: ResolveTineVar<T[K]>;
            }
          : T;

export type ResolveTineVarData<T> =
  T extends TineVar<infer U>
    ? U extends TineVar<infer Z>
      ? TineExcludeError<Z>
      : U extends Array<infer A>
        ? Array<ResolveTineVarData<A>>
        : U extends TineError<any, any>
          ? TineExcludeError<U>
          : U extends object
            ? {
                [K in keyof U]: ResolveTineVarData<U[K]>;
              }
            : U
    : T extends Array<infer A>
      ? Array<ResolveTineVarData<A>>
      : T extends Date
        ? T
        : T extends TineError<any, any>
          ? TineExcludeError<T>
          : T extends object
            ? {
                [K in keyof T]: ResolveTineVarData<T[K]>;
              }
            : T;

export type ResolveTineVarError<T> =
  T extends TineVar<infer U>
    ? U extends TineVar<infer Z>
      ? TineGetErrors<Z>
      : U extends Array<infer A>
        ? Array<ResolveTineVarError<A>>
        : U extends TineError<any, any>
          ? TineGetErrors<U>
          : U extends object
            ? {
                [K in keyof U]: ResolveTineVarError<U[K]>;
              }
            : never
    : T extends Array<infer A>
      ? Array<ResolveTineVarError<A>>
      : T extends Date
        ? T
        : T extends TineError<any, any>
          ? T
          : T extends object
            ? {
                [K in keyof T]: ResolveTineVarError<T[K]>;
              }
            : never;

export type ExtractTineErrors<T> =
  T extends TineError<any, any>
    ? T
    : T extends object
      ? {
          [K in keyof T]: T[K] extends TineError<any, any>
            ? T[K]
            : ExtractTineErrors<T[K]>;
        }[keyof T]
      : never;

export type TineActionInfo<D> = {
  name: string;
  type: string;
  params: any;
  data?: ResolveTineVarData<D>;
  error?: ExtractTineErrors<ResolveTineVarError<D>>;
};

export type TineActionRunOptions<T> = {
  onComplete?: (actionInfo: TineActionInfo<T>, ctx: TineCtx) => void;
};

export type TineAction<T> = {
  name: string;
  run: (
    ctx?: TineCtx
    // options?: TineActionRunOptions<T>
  ) => Promise<{
    data: ResolveTineVarData<T>;
    error: ExtractTineErrors<ResolveTineVarError<T>>;
  }>;
};

export type TineWorkflowAction<T> = {
  type: string[];
  params?: T;
  name?: string;
};

export type TineActionWithParams<
  T extends ZodRawShape,
  U extends UnknownKeysParam,
  C extends ZodTypeAny,
  O,
  I,
  D,
  P,
  B,
  Q
> = {
  meta: {
    iSchema: z.ZodObject<T, U, C, O, I>;
    oSchema?: z.ZodType<ResolveTineVar<D>>;
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
      params?: P;
      body?: B;
      query?: Q;
    };
  };
  input: (value: I) => TineAction<D>;
  rawInput: (value: unknown) => TineAction<D>;
};

export type TineActionWithOptions<D> = TineAction<D> & {
  noParams: (meta?: {
    oSchema?: z.ZodType<ResolveTineVar<D>>;
  }) => TineAction<D> & {
    meta: {
      oSchema?: z.ZodType<ResolveTineVar<D>>;
    };
  };
  withParams: <
    T extends ZodRawShape,
    U extends UnknownKeysParam,
    C extends ZodTypeAny,
    O,
    I,
    P,
    B,
    Q
  >(
    iSchema: TineInput<T, U, C, O, I>,
    meta?: {
      oSchema?: z.ZodType<ResolveTineVar<D>>;
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
        params?: P;
        body?: B;
        query?: Q;
      };
    }
  ) => TineActionWithParams<T, U, C, O, I, D, P, B, Q>;
};

export type TineActionOptions = {
  ctx: TineCtx;
  parseParams: <X>(ctx: Map<string, any>, params: X) => Promise<X>;
};

export type TineExcludeError<T> = T extends TineError<any, any> ? never : T;

export type TineGetErrors<T> = T extends TineError<any, any> ? T : never;

export type TineInferReturn<
  T extends
    | TineAction<any>
    | TineActionWithParams<any, any, any, any, any, any, any, any, any>
> =
  T extends TineActionWithParams<any, any, any, any, any, any, any, any, any>
    ? Awaited<ReturnType<ReturnType<T["input"]>["run"]>>
    : T extends TineAction<any>
      ? Awaited<ReturnType<T["run"]>>
      : never;

export type TineInferInput<
  T extends TineActionWithParams<any, any, any, any, any, any, any, any, any>
> =
  T extends TineActionWithParams<any, any, any, any, any, any, any, any, any>
    ? Parameters<T["input"]>[0]
    : never;

export class TineError<S extends number, D = undefined> extends Error {
  public status: S;
  public data?: D;

  constructor(status: S, message?: string, data?: D) {
    super(message);

    this.name = "TineError";
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

export class Wait extends TineError<102, WaitParams> {
  constructor(params: WaitParams) {
    super(102, "Wait", params);
  }
}

export type Expect<T extends true> = T;

export type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? true
    : false;
