import { type Type } from "arktype"
import { type Exception } from "./daunus-exception"
import { type Scope } from "./daunus-scope"
import { type ExtractData, type ExtractExceptions, type FormatScope, type ValidateName } from "./types-helpers"
import { type z } from "./zod"
import { type LanguageModelV1 } from "@ai-sdk/provider"

export type Ctx = Map<any, any>

export type Query<T> = T & ((ctx: Ctx) => Promise<T>)

export type Input<T> = Type<T> | z.ZodType<T>

export type DataResponse<Data> = { data: Data }

export type ExceptionReponse<Exception> = { exception: Exception }

export type ActionResponse<Return> = {
  data: ExtractData<Return>
  exception: ExtractExceptions<Return>
}

export type ActionMeta<Env> = {
  name: string
  env: Env
}

export type Action<Return, Input = void, Env = {}> = Input extends object
  ? {
      (input: Input, ctx?: Ctx): Promise<ActionResponse<Return>>
      meta: ActionMeta<Env>
    }
  : {
      (ctx?: Ctx): Promise<ActionResponse<Return>>
      meta: ActionMeta<Env>
    }

export type ActionWithInput<Return, Input, Env = {}> = {
  (
    input: Input extends object ? Input : never,
    ctx?: Ctx
  ): Promise<ActionResponse<Return>>
  (ctx?: Input extends object ? never : Ctx): Promise<ActionResponse<Return>>
  meta: {
    name: string
    env: Env
  }
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

export type InferReturn<T extends Action<any, any, any>> =
  T extends Action<any, any, any> ? Awaited<ReturnType<T>> : never

export type InferInput<T extends Action<any, any, any>> =
  T extends Action<any, infer I, any> ? I : never

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
  StepsMap extends Record<string, any> = {}
> {
  scope: Scope<FormatScope<Global>, FormatScope<Local>, StepsMap>

  get(name: string, scope?: Record<any, any>): any

  add(...params: any): any
}

export interface StepFactory<
  Global extends Record<string, any> = {},
  Local extends Record<string, any> = {},
  StepsMap extends Record<string, any> = {}
> extends AbstractStepFactory<Global, Local, StepsMap> {
  get<N extends keyof Local>(name: N, scope?: Record<any, any>): Local[N]
}

export const resultKey: unique symbol = Symbol("resultKey")

export interface StepOptions {
  stepsType?: "default" | "parallel" | "serial"
}

export type Model = (ctx: Ctx) => LanguageModelV1
