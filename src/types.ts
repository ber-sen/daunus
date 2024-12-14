import { z } from "./zod";

export type DaunusQuery<T> = T & ((ctx: DaunusCtx) => Promise<T>);

export type DaunusInput<T> = z.ZodType<T>;

export type DaunusCtx = Map<any, any>;

export type ResolveDaunusVarData<T> =
  T extends ReadableStream<infer Z>
    ? ReadableStream<Z>
    : T extends DaunusQuery<infer U>
      ? U extends DaunusQuery<infer Z>
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
  T extends DaunusQuery<infer U>
    ? U extends DaunusQuery<infer Z>
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
  actionMeta?: object;
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

export type DaunusRoute<D, P, E, I extends z.ZodType<any>> = {
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

export type DaunusActionWithOptions<D, P, E> = DaunusAction<D, P, E> & {
  createRoute<I extends z.ZodType<any>>(iSchema: I): DaunusRoute<D, P, E, I>;
  createRoute(): DaunusAction<D, P, E>;
};

export type DaunusExcludeException<T> =
  T extends DaunusException<any, any> ? never : T;

export type DaunusGetExceptions<T> =
  T extends DaunusException<any, any> ? T : never;

export type DaunusInferReturn<
  T extends DaunusAction<any, any, any> | DaunusRoute<any, any, any, any>
> =
  T extends DaunusRoute<any, any, any, any>
    ? Awaited<ReturnType<ReturnType<T["input"]>["run"]>>
    : T extends DaunusAction<any, any, any>
      ? Awaited<ReturnType<T["run"]>>
      : never;

export type DaunusInferInput<T extends DaunusRoute<any, any, any, any>> =
  T extends DaunusRoute<any, any, any, any> ? Parameters<T["input"]>[0] : never;

export class DaunusException<S extends number, D = undefined> {
  public status: S;
  public data: D;

  constructor(status: S, data = undefined as D) {
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

export interface RouterFactory<
  R extends Record<
    string,
    {
      route: DaunusRoute<any, any, any, any> | DaunusAction<any, any, any>;
      input: any;
    }
  >,
  AI extends any | undefined,
  AR extends any | undefined
> extends DaunusRoute<
    Exclude<AR, undefined>,
    {},
    {},
    z.ZodType<Exclude<AI, undefined>>
  > {
  add<N extends string, D, P, E, I extends z.ZodTypeAny = z.ZodUndefined>(
    name: N,
    route: DaunusRoute<D, P, E, I>
  ): RouterFactory<
    R & Record<N, { route: DaunusRoute<D, P, E, I> }>,
    AI | I["_output"],
    AR | D
  >;

  add<N extends string, D, P, E>(
    name: N,
    route: DaunusAction<D, P, E>
  ): RouterFactory<R & Record<N, { route: DaunusAction<D, P, E> }>, AI, AR | D>;

  get<N extends keyof R>(name: N): R[N]["route"];
  defs: R;
}
