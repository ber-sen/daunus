import { DaunusAction, DaunusActionOrActionWithInput } from "./types"
import { isAction } from "./new_helpers"
import {
  Scope,
  StepConfig,
  StepFactory,
  StepProps,
  StepOptions,
  resultKey
} from "./new_types"
import { createRun } from "./run_helpers"
import { ValidateName, FormatScope, Overwrite } from "./type_helpers"

export interface DefaultStepFactory<
  Global extends Record<string, any> = {},
  Local extends Record<any, any> = Record<typeof resultKey, undefined>
> extends StepFactory<Global, Local>,
    DaunusActionOrActionWithInput<
      Global["input"],
      Local[typeof resultKey] extends DaunusActionOrActionWithInput<
        any,
        any,
        any
      >
        ? Awaited<ReturnType<Local[typeof resultKey]["run"]>>["data"]
        : Local[typeof resultKey]
    > {
  add<Value extends DaunusAction<any, any>, Name extends string>(
    name: ValidateName<Name, Local> | StepConfig<Name, Local>,
    fn: (props: StepProps<Global>) => Promise<Value> | Value
  ): DefaultStepFactory<
    Overwrite<Global, Name> &
      Record<Name, Awaited<ReturnType<Value["run"]>>["data"]>,
    Omit<Local, typeof resultKey> &
      Record<Name, Value> &
      Record<typeof resultKey, Value>
  >

  add<Value, Name extends string>(
    name: ValidateName<Name, Local> | StepConfig<Name, Local>,
    fn: (props: StepProps<Global>) => Promise<Value> | Value
  ): DefaultStepFactory<
    Overwrite<Global, Name> & Record<Name, Awaited<Value>>,
    Omit<Local, typeof resultKey> &
      Record<Name, Value> &
      Record<typeof resultKey, Value>
  >
}

export interface ParallelStepFactory<
  Global extends Record<string, any> = {},
  Local extends Record<string, any> = {}
> extends StepFactory<Global, Local>,
    DaunusActionOrActionWithInput<Global["input"], FormatScope<Local>> {
  add<Value, Name extends string>(
    name: ValidateName<Name, Local> | StepConfig<Name, Local>,
    fn: (props: StepProps<Global>) => Promise<Value> | Value
  ): ParallelStepFactory<Global, Local & Record<Name, Value>>
}

export type StepsFactory<
  Options extends StepOptions = {},
  Global extends Record<string, any> = {},
  Local extends Record<string, any> = {}
> = ReturnType<typeof $steps<Options, Global, Local>>

export function $steps<
  Options extends StepOptions = {},
  Global extends Record<string, any> = {},
  Local extends Record<string, any> = {}
>(
  params?: {
    $?: Scope<Global, Local> | Global
    name?: string
  } & Options
): Options["stepsType"] extends "parallel"
  ? ParallelStepFactory<Global, Local>
  : DefaultStepFactory<Global, Local> {
  const { $, stepsType } = params ?? {}

  const scope = $ instanceof Scope ? $ : new Scope<Global, Local>({ global: $ })

  function get<Name extends keyof Local>(
    name: Extract<Name, string>,
    global?: Record<any, any>
  ): Local[Name] {
    return scope.get(name, global)
  }

  function add(
    nameOrConfig: string | StepConfig<any, any>,
    fn: (props: any) => any
  ): any {
    return $steps({
      stepsType,
      $: scope.addStep(nameOrConfig, fn)
    })
  }

  const run = createRun<Global["input"]>(async (ctx) => {
    if (!Object.keys(scope.steps)?.at(-1)) {
      return undefined
    }

    if (stepsType === "parallel") {
      const promises = Object.values(scope.steps).map(async (fn) => {
        const res = await fn(scope.getStepsProps(ctx))

        if (isAction(res)) {
          return (await res.run(ctx)).data
        }

        return res
      })

      const res = await Promise.all(promises)

      return Object.fromEntries(
        Object.keys(scope.steps).map((key, index) => [key, res[index]])
      )
    }

    const res: any[] = []

    for (const [name, fn] of Object.entries(scope.steps)) {
      let value = await fn(scope.getStepsProps(ctx))

      if (isAction(value)) {
        value = (await value.run(ctx)).data
      }

      scope.global = { ...scope.global, [name]: value }
      scope.local = { ...scope.local, [name]: value }

      res.push(value)
    }

    return res.at(-1)
  })

  // TODO
  const env = {}

  const name = params?.name as string

  const input: any = () => {
    return {} as any
  }

  return { get, scope, add, run, name, env, input }
}
