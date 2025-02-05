import {
  type DataResponse,
  type ExceptionReponse,
  type ExtractExceptions,
  type Action,
  type ActionWithInput,
  type StepFactory,
  type resultKey,
  type StepConfig,
  type ActionOrActionWithInput,
  type StepOptions,
  type Ctx
} from "./types"

import {
  type ValidateName,
  type FormatScope,
  type Overwrite
} from "./types_helpers"
import { $actionWithInput } from "./daunus_action_with_input"
import { isAction } from "./helpers"
import { Scope } from "./daunus_scope"
import { $stepProps, type StepProps } from "./daunus_step_props"

export interface DefaultStepFactory<
  Global extends Record<string, any> = {},
  Local extends Record<any, any> = Record<typeof resultKey, undefined>
> extends StepFactory<Global, Local>,
    ActionOrActionWithInput<
      Global["input"],
      ExtractExceptions<Local["exceptions"]> extends undefined
        ? Local[typeof resultKey]
        : Local[typeof resultKey] | ExtractExceptions<Local["exceptions"]>
    > {
  add<Value, Name extends string>(
    name: ValidateName<Name, Local> | StepConfig<Name, Local>,
    fn: (props: StepProps<Global>) => Value | Promise<Value>
  ): DefaultStepFactory<
    Overwrite<Global, Name> &
      Record<
        Name,
        Value extends Action<any, any> | ActionWithInput<any, any, any>
          ? Awaited<ReturnType<Value["run"]>> extends DataResponse<infer T>
            ? T
            : never
          : Value
      >,
    // TODO: add continue on error option
    // &
    // (Value extends Action<any, any> | ActionWithInput<any, any, any>
    //   ? Record<
    //       "exceptions",
    //       Record<
    //         Name,
    //         Awaited<ReturnType<Value["run"]>> extends ExceptionReponse<
    //           infer T
    //         >
    //           ? T
    //           : never
    //       >
    //     >
    //   : {})
    Omit<Local, typeof resultKey> &
      Record<Name, Value> &
      Record<
        typeof resultKey,
        Value extends Action<any, any> | ActionWithInput<any, any, any>
          ? Awaited<ReturnType<Value["run"]>> extends DataResponse<infer T>
            ? T
            : never
          : Value
      > &
      (Value extends Action<any, any> | ActionWithInput<any, any, any>
        ? Record<
            "exceptions",
            Record<
              Name,
              Awaited<ReturnType<Value["run"]>> extends ExceptionReponse<
                infer T
              >
                ? T
                : never
            >
          >
        : {})
  >
}

export interface ParallelStepFactory<
  Global extends Record<string, any> = {},
  Local extends Record<string, any> = {}
> extends StepFactory<Global, Local>,
    ActionOrActionWithInput<Global["input"], FormatScope<Local>> {
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
              return (await res.run(ctx)).data
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
            const { data, exception } = await value.run(ctx)

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

  return {
    ...action,
    get,
    scope,
    add
  }
}
