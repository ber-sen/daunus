import { type Exception } from "./daunus-exception"
import { type Scope } from "./daunus-scope"
import { type FormatScope, type ValidateName } from "./types-helpers"
import { type z } from "./zod"
import { type LanguageModelV1 } from "@ai-sdk/provider"

export type Ctx = Map<any, any>

export type Query<T> = T & ((ctx: Ctx) => Promise<T>)

export type Input<T> = z.ZodType<T>

export type ExtractExceptions<T> =
  T extends Exception<any, any>
    ? T
    : T extends Array<infer A>
      ? ExtractExceptions<A>
      : T extends object
        ? {
            [K in keyof T]: T[K] extends Exception<any, any>
              ? T[K]
              : ExtractExceptions<T[K]>
          }[keyof T]
        : never

export type ExtractData<Return> = Exclude<Return, Exception<any, any>>

export type DataResponse<Data> = { data: Data }

export type ExceptionReponse<Exception> = { exception: Exception }

export type ActionResponse<Data, Exception> = DataResponse<Data> &
  ExceptionReponse<Exception>

export type Action<Return, Env = {}> = {
  name: string
  env: Env
  execute: (ctx?: Ctx) => Promise<{
    data: ExtractData<Return>
    exception: ExtractExceptions<Return>
  }>
}

export type ActionFactory<Params, Return, Env = {}> = (
  params: Params,
  actionMeta?: {
    name?: string
  }
) => Action<Return, Env>

export type ActionWithInput<Input, Return, Env = {}> = {
  name: string
  env: Env
  execute: (
    input: Input,
    ctx?: Ctx
  ) => Promise<{
    data: ExtractData<Return>
    exception: ExtractExceptions<Return>
  }>
  input: (input: Input) => Action<Return, Env>
}

export type ActionOrActionWithInput<Input, Return, Env = {}> = {
  name: string
  env: Env
  execute: Input extends object
    ? ActionWithInput<Input, Return, Env>["execute"]
    : Action<Return, Env>["execute"]
  input: Input extends object ? (input: Input) => Action<Return, Env> : never
}

export type Event<Type, Params> = {
  type: Type
  params: Params
}

export type WorkflowAction<T> = {
  type: string[]
  params?: T
  name: string
}

export type ExcludeException<T> = T extends Exception<any, any> ? never : T

export type InferReturn<
  T extends Action<any, any> | ActionWithInput<any, any, any>
> = T extends Action<any, any> ? Awaited<ReturnType<T["execute"]>> : never

export type InferInput<
  T extends
    | ActionWithInput<any, any, any>
    | ActionOrActionWithInput<any, any, any>
> = T extends
  | ActionWithInput<any, any, any>
  | ActionOrActionWithInput<any, any, any>
  ? Parameters<T["input"]>[0]
  : never

type WorkflowBackoff = "constant" | "linear" | "exponential"

export interface StepConfig<N, L> {
  name: ValidateName<N, L>
  timeout?: string | number
  retries?: {
    limit: number
    delay: string | number
    backoff?: WorkflowBackoff
  }
}
export interface AbstractStepFactory<
  Global extends Record<string, any> = {},
  Local extends Record<string, any> = {},
  StepsMap extends Record<string, any> = {},
> {
  scope: Scope<FormatScope<Global>, FormatScope<Local>, StepsMap>

  get(name: string, scope?: Record<any, any>): any

  add(...params: any): any
}

export interface StepFactory<
  Global extends Record<string, any> = {},
  Local extends Record<string, any> = {},
  StepsMap extends Record<string, any> = {},
> extends AbstractStepFactory<Global, Local, StepsMap> {
  get<N extends keyof Local>(name: N, scope?: Record<any, any>): Local[N]
}

export const resultKey: unique symbol = Symbol("resultKey")

export interface StepOptions {
  stepsType?: "default" | "parallel" | "serial"
}

export type Model = (ctx: Ctx) => LanguageModelV1
