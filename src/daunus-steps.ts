import {
  type DataResponse,
  type ExceptionReponse,
  type Action,
  type StepFactory,
  type resultKey,
  type StepConfig,
  type StepOptions,
  type Ctx,
  type ActionWithInput
} from "./types"

import {
  type ValidateName,
  type FormatScope,
  type Overwrite,
  type ExtractExceptions
} from "./types-helpers"
import { $actionWithInput } from "./daunus-action-with-input"
import { isAction } from "./helpers"
import { Scope } from "./daunus-scope"
import { $stepProps, type StepProps } from "./daunus-step-props"

export interface DefaultStepFactory<
  Global extends Record<string, any> = {},
  Local extends Record<any, any> = Record<typeof resultKey, undefined>,
  StepsMap extends Record<string, any> = {}
> extends StepFactory<Global, Local, StepsMap>,
    ActionWithInput<
      ExtractExceptions<Local["exceptions"]> extends undefined
        ? Local[typeof resultKey]
        : Local[typeof resultKey] | ExtractExceptions<Local["exceptions"]>,
      Global["input"]
    > {
  add<Value, Name extends string>(
    name: ValidateName<Name, Local> | StepConfig<Name, Local>,
    fn: (props: StepProps<Global>) => Value | Promise<Value>
  ): DefaultStepFactory<
    Overwrite<Global, Name> &
      Record<Name, Value extends Action<infer D, any, any> ? D : Value>,
    Omit<Local, typeof resultKey> &
      Record<Name, Value> &
      Record<
        typeof resultKey,
        Value extends Action<any, any, any>
          ? Awaited<ReturnType<Value>> extends DataResponse<infer T>
            ? T
            : Value
          : Value
      > &
      (Value extends Action<any, any, any>
        ? Record<
            "exceptions",
            Record<
              Name,
              Awaited<ReturnType<Value>> extends ExceptionReponse<infer T>
                ? T
                : Value
            >
          >
        : {}),
    StepsMap & Record<Name, Global>
  >
}

export interface ParallelStepFactory<
  Global extends Record<string, any> = {},
  Local extends Record<string, any> = {},
  StepsMap extends Record<string, any> = {}
> extends StepFactory<Global, Local, StepsMap>,
    ActionWithInput<FormatScope<Local>, Global["input"]> {
  add<Value, Name extends string>(
    name: ValidateName<Name, Local> | StepConfig<Name, Local>,
    fn: (props: StepProps<Global>) => Promise<Value> | Value
  ): ParallelStepFactory<
    Global,
    Local & Record<Name, Value>,
    StepsMap & Record<Name, Global>
  >
}

export type StepsFactory<
  Options extends StepOptions = {},
  Global extends Record<string, any> = {},
  Local extends Record<string, any> = {},
  StepsMap extends Record<string, any> = {}
> = ReturnType<typeof $steps<Options, Global, Local, StepsMap>>

export function $steps<
  Options extends StepOptions = {},
  Global extends Record<string, any> = {},
  Local extends Record<string, any> = {},
  StepsMap extends Record<string, any> = {}
>(
  params?: {
    $?: Scope<Global, Local, StepsMap> | Global
    name?: string
  } & Options
): Options["stepsType"] extends "parallel"
  ? ParallelStepFactory<Global, Local, StepsMap>
  : DefaultStepFactory<Global, Local, StepsMap> {
  const { $, stepsType } = params ?? {}

  const scope =
    $ instanceof Scope ? $ : new Scope<Global, Local, StepsMap>({ global: $ })

  function get<Name extends keyof Local>(
    name: Extract<Name, string>,
    params: { $?: Record<any, any>; ctx?: Ctx }
  ): Local[Name] {
    return scope.get(name, $stepProps(params))
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

  const action = $actionWithInput<Global["input"], any, any>(
    { type: "steps" },
    ({ ctx }) =>
      async () => {
        if (!Object.keys(scope.steps)?.at(-1)) {
          return undefined
        }

        if (stepsType === "parallel") {
          const promises = Object.values(scope.steps).map(async (fn) => {
            const res = await fn($stepProps({ $: scope.getGlobal(ctx), ctx }))

            if (isAction(res)) {
              return (await res(ctx)).data
            }

            return res
          })

          const res = await Promise.all(promises)

          return Object.fromEntries(
            Object.keys(scope.steps).map((key, index) => [key, res[index]])
          )
        }

        const res: unknown[] = []

        for (const [name, fn] of Object.entries(scope.steps)) {
          let value = await fn($stepProps({ $: scope.getGlobal(ctx), ctx }))

          if (isAction(value)) {
            const { data, exception } = await value(ctx)

            if (exception) {
              return exception
            }

            value = data
          }

          scope.global = { ...scope.global, [name]: value }
          scope.local = { ...scope.local, [name]: value }

          res.push(value)
        }

        return res.at(-1)
      }
  )({})

  return Object.assign(action, { get, scope, add })
}
