import { z } from "./zod"

export type DaunusQuery<T> = T & ((ctx: DaunusCtx) => Promise<T>)

export type DaunusInput<T> = z.ZodType<T>

export type DaunusCtx = Map<any, any>

export type ExtractDaunusExceptions<T> =
  T extends DaunusException<any, any>
    ? T
    : T extends Array<infer A>
      ? ExtractDaunusExceptions<A>
      : T extends object
        ? {
            [K in keyof T]: T[K] extends DaunusException<any, any>
              ? T[K]
              : ExtractDaunusExceptions<T[K]>
          }[keyof T]
        : never

export type NonUndefined<T> = T extends undefined ? never : T

export type ExtractData<Return> = Exclude<Return, DaunusException<any, any>>

export type DataResponse<D> = { data: D }

export type ExceptionReponse<E> = { exception: E }

export type ActionReponse<D, E> = DataResponse<D> & ExceptionReponse<E>

export type DaunusAction<Return, Env = {}> = {
  name: string
  env: Env
  run: (ctx?: DaunusCtx) => Promise<{
    data: ExtractData<Return>
    exception: ExtractDaunusExceptions<Return>
  }>
}

export type DaunusActionWithInput<Input, Return, Env = {}> = {
  name: string
  env: Env
  run: (
    input: Input,
    ctx?: DaunusCtx
  ) => Promise<{
    data: ExtractData<Return>
    exception: ExtractDaunusExceptions<Return>
  }>
  input: (input: Input) => DaunusAction<Return, Env>
}

export type DaunusActionOrActionWithInput<Input, Return, Env = {}> = {
  name: string
  env: Env
  run: Input extends object
    ? DaunusActionWithInput<Input, Return, Env>["run"]
    : DaunusAction<Return, Env>["run"]
  input: Input extends object
    ? (input: Input) => DaunusAction<Return, Env>
    : never
}

export type DaunusWorkflowAction<T> = {
  type: string[]
  params?: T
  name: string
}

export type DaunusOpenApiMethod =
  | "get"
  | "post"
  | "put"
  | "delete"
  | "patch"
  | "head"
  | "options"
  | "trace"

export type DaunusOpenApi = z.ZodObject<{
  method?: z.ZodType<any>
  contentType?: z.ZodType<any>
  path?: any
  body?: any
  query?: any
}>

export type DaunusRoute<D, P, E, I extends z.ZodType<any>> = {
  meta: {
    iSchema: I
    openapi: {
      method: I extends DaunusOpenApi
        ? NonNullable<I["shape"]["method"]>["_output"]
        : "post"
      contentType: I extends DaunusOpenApi
        ? NonNullable<I["shape"]["contentType"]>["_output"]
        : never
      path: I extends DaunusOpenApi
        ? NonNullable<I["shape"]["path"]>["_output"]
        : never
      body: I extends DaunusOpenApi
        ? NonNullable<I["shape"]["body"]>["_output"]
        : never
      query: I extends DaunusOpenApi
        ? NonNullable<I["shape"]["query"]>["_output"]
        : never
    }
  }
  input: (value: I["_type"]) => DaunusAction<D, E>
  rawInput: (value: unknown) => DaunusAction<D, E>
}

export type DaunusActionWithOptions<D, P, E> = DaunusAction<D, E> & {
  createRoute<I extends z.ZodType<any>>(iSchema: I): DaunusRoute<D, P, E, I>
  createRoute(): DaunusAction<D, E>
}

export type DaunusExcludeException<T> =
  T extends DaunusException<any, any> ? never : T

export type DaunusGetExceptions<T> =
  T extends DaunusException<any, any> ? T : never

export type DaunusInferReturn<
  T extends DaunusAction<any, any> | DaunusRoute<any, any, any, any>
> =
  T extends DaunusRoute<any, any, any, any>
    ? Awaited<ReturnType<ReturnType<T["input"]>["run"]>>
    : T extends DaunusAction<any, any>
      ? Awaited<ReturnType<T["run"]>>
      : never

export type DaunusInferInput<T extends DaunusRoute<any, any, any, any>> =
  T extends DaunusRoute<any, any, any, any> ? Parameters<T["input"]>[0] : never

export class DaunusException<
  S extends number = 500,
  D = undefined,
  P = undefined
> {
  public status: S
  public data: D
  public paths: P

  constructor(options?: { status?: S; data?: D; paths?: P }) {
    this.status = options?.status ?? (500 as S)
    this.data = options?.data as D
    this.paths = options?.paths as P
  }
}

type WaitParams =
  | {
      delay: string
    }
  | {
      until: Date
    }

export class Wait extends DaunusException<102, WaitParams> {
  constructor(params: WaitParams) {
    super({ status: 102, data: params })
  }
}

export class Return extends DaunusException<200, WaitParams> {
  constructor(params: WaitParams) {
    super({ status: 200, data: params })
  }
}

export type Expect<T extends true> = T

export type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? true
    : false

export type ExceptionParams<T, P> =
  ExtractDaunusExceptions<T> extends never ? P : ExtractDaunusExceptions<T>

export type DaunusSchema<T> =
  | z.Schema<T>
  | { schema: z.Schema<T>; jsonSchema: string }
  | { jsonSchema: string }
