import { z } from "./zod";

export type DaunusVar<T> =
  DaunusExcludeException<T> extends never
    ? T
    : DaunusExcludeException<T> & ((ctx: DaunusCtx) => Promise<T>);

export type DaunusParams<T> = T; // TODO: fix type

export type DaunusInput<T> = z.ZodType<T>;

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
  T extends DaunusReadable<infer Z>
    ? Z extends "text"
      ? string
      : Z extends "arrayBuffer"
        ? ArrayBuffer
        : Z extends "blob"
          ? Blob
          : string
    : T extends DaunusVar<infer U>
      ? U extends DaunusVar<infer Z>
        ? DaunusExcludeException<Z>
        : U extends Array<infer A>
          ? Array<ResolveDaunusVarData<A>>
          : U extends DaunusException<any, any>
            ? DaunusExcludeException<U>
            : U extends object
              ? {
                  [K in keyof U]: ResolveDaunusVarData<U[K]>;
                }
              : U
      : T extends Array<infer A>
        ? Array<ResolveDaunusVarData<A>>
        : T extends Date
          ? T
          : T extends DaunusException<any, any>
            ? DaunusExcludeException<T>
            : T extends object
              ? {
                  [K in keyof T]: ResolveDaunusVarData<T[K]>;
                }
              : T;

export type ResolveDaunusVarExceptions<T> =
  T extends DaunusVar<infer U>
    ? U extends DaunusVar<infer Z>
      ? DaunusGetExceptions<Z>
      : U extends Array<infer A>
        ? Array<ResolveDaunusVarExceptions<A>>
        : U extends DaunusException<any, any>
          ? DaunusGetExceptions<U>
          : U extends object
            ? {
                [K in keyof U]: ResolveDaunusVarExceptions<U[K]>;
              }
            : never
    : T extends Array<infer A>
      ? Array<ResolveDaunusVarExceptions<A>>
      : T extends Date
        ? T
        : T extends DaunusException<any, any>
          ? T
          : T extends object
            ? {
                [K in keyof T]: ResolveDaunusVarExceptions<T[K]>;
              }
            : never;

export type ExtractDaunusExceptions<T> =
  T extends DaunusException<any, any>
    ? T
    : T extends Array<infer A>
      ? never
      : T extends object
        ? {
            [K in keyof T]: T[K] extends DaunusException<any, any>
              ? T[K]
              : ExtractDaunusExceptions<T[K]>;
          }[keyof T]
        : never;

export type NonUndefined<T> = T extends undefined ? never : T;

export type DaunusActionInfo<D, P> = {
  name: string;
  type: string;
  params: any;
  data?: ResolveDaunusVarData<D>;
  exception?: NonUndefined<
    | ExtractDaunusExceptions<ResolveDaunusVarExceptions<D>>
    | ExtractDaunusExceptions<ResolveDaunusVarExceptions<P>>
  >;
};

export type DaunusActionRunOptions<T, P> = {
  onComplete?: (actionInfo: DaunusActionInfo<T, P>, ctx: DaunusCtx) => void;
};

// eslint-disable-next-line @typescript-eslint/ban-types
export type DaunusAction<T, P, E = {}> = {
  name: string;
  envSchema?: z.Schema<E>;
  run: (
    ctx?: DaunusCtx,
    options?: DaunusActionRunOptions<T, P>
  ) => Promise<{
    data: ResolveDaunusVarData<T>;
    exception: NonUndefined<
      | ExtractDaunusExceptions<ResolveDaunusVarExceptions<T>>
      | ExtractDaunusExceptions<ResolveDaunusVarExceptions<P>>
    >;
  }>;
};

export type DaunusWorkflowAction<T> = {
  type: string[];
  params?: T;
  name?: string;
};

export type DaunusOpenApiMethod =
  | "get"
  | "post"
  | "put"
  | "delete"
  | "patch"
  | "head"
  | "options"
  | "trace";

export type DaunusOpenApi = z.ZodObject<{
  method?: z.ZodType<any>;
  contentType?: z.ZodType<any>;
  path?: any;
  body?: any;
  query?: any;
}>;

export type DaunusActionWithInput<I extends z.ZodType<any>, D, P, E> = {
  meta: {
    iSchema: I;
    openapi: {
      method: I extends DaunusOpenApi
        ? NonNullable<I["shape"]["method"]>["_output"]
        : "post";
      contentType: I extends DaunusOpenApi
        ? NonNullable<I["shape"]["contentType"]>["_output"]
        : never;
      path: I extends DaunusOpenApi
        ? NonNullable<I["shape"]["path"]>["_output"]
        : never;
      body: I extends DaunusOpenApi
        ? NonNullable<I["shape"]["body"]>["_output"]
        : never;
      query: I extends DaunusOpenApi
        ? NonNullable<I["shape"]["query"]>["_output"]
        : never;
    };
  };
  input: (value: I["_type"]) => DaunusAction<D, P, E>;
  rawInput: (value: unknown) => DaunusAction<D, P, E>;
};

export type DaunusActionWithParams<D, P, E> = DaunusAction<D, P, E> & {
  noParams: () => DaunusAction<D, P, E>;
  withParams: <I extends z.ZodType<any>>(
    iSchema: I
  ) => DaunusActionWithInput<I, D, P, E>;
};

export type DaunusExcludeException<T> =
  T extends DaunusException<any, any> ? never : T;

export type DaunusGetExceptions<T> =
  T extends DaunusException<any, any> ? T : never;

export type DaunusInferReturn<
  T extends
    | DaunusAction<any, any, any>
    | DaunusActionWithInput<any, any, any, any>
> =
  T extends DaunusActionWithInput<any, any, any, any>
    ? Awaited<ReturnType<ReturnType<T["input"]>["run"]>>
    : T extends DaunusAction<any, any, any>
      ? Awaited<ReturnType<T["run"]>>
      : never;

export type DaunusInferInput<
  T extends DaunusActionWithInput<any, any, any, any>
> =
  T extends DaunusActionWithInput<any, any, any, any>
    ? Parameters<T["input"]>[0]
    : never;

export class DaunusException<S extends number, D = undefined> extends Error {
  public status: S;
  public data?: D;

  constructor(status: S, data?: D) {
    super("daunus_exception");
    this.status = status;
    this.data = data;
  }
}

export class DaunusReadable<T extends "text" | "arrayBuffer" | "blob"> {
  public readable: ReadableStream<any>;
  public type: "text" | "arrayBuffer" | "blob";

  constructor(readable: ReadableStream<any>, type: T) {
    this.readable = readable;
    this.type = type;
  }

  parse() {
    if (this.type === "text") {
      return new Response(this.readable).text();
    }

    if (this.type === "arrayBuffer") {
      return new Response(this.readable).arrayBuffer();
    }

    if (this.type === "blob") {
      return new Response(this.readable).blob();
    }

    return new Response(this.readable).text();
  }
}

type WaitParams =
  | {
      delay: string;
    }
  | {
      until: Date;
    };

export class Wait extends DaunusException<102, WaitParams> {
  constructor(params: WaitParams) {
    super(102, params);
  }
}

export class Return extends DaunusException<200, WaitParams> {
  constructor(params: WaitParams) {
    super(200, params);
  }
}

export type Expect<T extends true> = T;

export type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? true
    : false;

export type ExceptionParams<T, P> =
  ExtractDaunusExceptions<T> extends never ? P : ExtractDaunusExceptions<T>;

export type DaunusSchema<T> =
  | z.Schema<T>
  | { schema: z.Schema<T>; jsonSchema: string }
  | { jsonSchema: string };

export const Empty = Symbol("Empty");
export interface RouterFactory<
  R extends Record<
    string,
    {
      action: DaunusActionWithInput<any, any, any, any>;
    }
  >,
  AI extends any | typeof Empty,
  AR extends any | typeof Empty
> extends DaunusActionWithInput<
    Zod.ZodType<Exclude<AI, typeof Empty>>,
    Exclude<AR, typeof Empty>,
    {},
    {}
  > {
  add: <N extends string, I extends z.AnyZodObject, D, P, E>(
    name: N,
    action: DaunusActionWithInput<I, D, P, E>
  ) => RouterFactory<
    R & Record<N, { action: DaunusActionWithInput<I, D, P, E> }>,
    AI | I["_output"],
    AR | D
  >;
  get: <N extends keyof R>(name: N) => R[N]["action"];
}
