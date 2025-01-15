import { type FormatScope, type ValidateName } from "./types_helpers"
import { type ConditionFactory, type LoopFactory, type StepsFactory } from "."
import { type Scope } from "./daunus_scope"

type WorkflowBackoff = "constant" | "linear" | "exponential"

export interface StepConfig<N, L> {
  name: ValidateName<N, L>
  retries?: {
    limit: number
    delay: string | number
    backoff?: WorkflowBackoff
  }
  timeout?: string | number
}

export interface AbstractStepFactory<
  Global extends Record<string, any> = {},
  Local extends Record<string, any> = {}
> {
  scope: Scope<FormatScope<Global>, FormatScope<Local>>

  get(name: string, scope?: Record<any, any>): any

  add(...params: any): any
}

export interface StepFactory<
  Global extends Record<string, any> = {},
  Local extends Record<string, any> = {}
> extends AbstractStepFactory<Global, Local> {
  get<N extends keyof Local>(name: N, scope?: Record<any, any>): Local[N]
}

export const resultKey: unique symbol = Symbol("resultKey")

export interface StepOptions {
  stepsType?: "default" | "parallel" | "serial"
}

export interface StepProps<Global extends Record<string, any> = {}> {
  $: FormatScope<Global>
  $if: <Condition>(options: {
    condition: Condition
  }) => ConditionFactory<Condition, Global>
  $steps: <Options extends StepOptions>(
    options?: Options
  ) => StepsFactory<Options, Global>
  $loop: <
    List extends Array<any> | readonly any[],
    ItemVariable extends string = "item"
  >(options: {
    list: List
    itemVariable?: ItemVariable
  }) => LoopFactory<List, ItemVariable, Global>
}
