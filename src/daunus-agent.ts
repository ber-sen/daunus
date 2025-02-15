import { type z } from "zod"
import {
  type StepOptions,
  type Ctx,
  type StepFactory,
  type resultKey,
  type ActionOrActionWithInput,
  type ExtractExceptions,
  type Action,
  type StepConfig,
  type ActionWithInput,
  type DataResponse,
  type ExceptionReponse
} from "./types"
import { Scope } from "./daunus-scope"
import { $stepProps, type StepProps } from "./daunus-step-props"
import {
  type FormatScope,
  type Overwrite,
  type ValidateName
} from "./types-helpers"
import { $actionWithInput } from "./daunus-action-with-input"
import { isAction } from "./helpers"

type Task<Output = string> =
  | string
  | { description: string; output?: z.ZodType<Output> }

export interface DefaultAgentStepFactory<
  Global extends Record<string, any> = {},
  Local extends Record<any, any> = Record<typeof resultKey, undefined>,
  StepsMap extends Record<string, any> = {}
> extends StepFactory<Global, Local, StepsMap>,
    ActionOrActionWithInput<
      Global["input"],
      ExtractExceptions<Local["exceptions"]> extends undefined
        ? Local[typeof resultKey]
        : Local[typeof resultKey] | ExtractExceptions<Local["exceptions"]>
    > {
  add<
    Value extends Task<any> | Action<any, any> | ActionWithInput<any, any, any>,
    Name extends string
  >(
    name: ValidateName<Name, Local> | StepConfig<Name, Local>,
    fn: (props: StepProps<Global>) => Value | Promise<Value>
  ): DefaultAgentStepFactory<
    Overwrite<Global, Name> &
      Record<
        Name,
        Value extends Task<infer Output>
          ? Value extends { output?: any }
            ? Output
            : string
          : Value extends Action<any, any> | ActionWithInput<any, any, any>
            ? Awaited<ReturnType<Value["run"]>> extends DataResponse<infer T>
              ? T
              : never
            : Value
      >,
    Omit<Local, typeof resultKey> &
      Record<Name, Value> &
      Record<
        typeof resultKey,
        Value extends Task<infer Output>
          ? Value extends { output?: any }
            ? Output
            : string
          : Value extends Action<any, any> | ActionWithInput<any, any, any>
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
        : {}),
    StepsMap & Record<Name, Global>
  >
}

export interface ParallelAgentStepFactory<
  Global extends Record<string, any> = {},
  Local extends Record<string, any> = {},
  StepsMap extends Record<string, any> = {}
> extends StepFactory<Global, Local, StepsMap>,
    ActionOrActionWithInput<Global["input"], FormatScope<Local>> {
  add<Value, Name extends string>(
    name: ValidateName<Name, Local> | StepConfig<Name, Local>,
    fn: (props: StepProps<Global>) => Promise<Value> | Value
  ): ParallelAgentStepFactory<Global, Local & Record<Name, Value>, StepsMap & Record<Name, Global>>
}

export type AgentStepsFactory<
  Options extends StepOptions = {},
  Global extends Record<string, any> = {},
  Local extends Record<string, any> = {},
  StepsMap extends Record<string, any> = {}
> = ReturnType<typeof $agentSteps<Options, Global, Local, StepsMap>>

export function $agentSteps<
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
  ? ParallelAgentStepFactory<Global, Local, StepsMap>
  : DefaultAgentStepFactory<Global, Local, StepsMap> {
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
    return $agentSteps({
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

export function $agent<Description extends string, Input>(
  description: Description,
  options?: { input?: z.ZodType<Input> }
) {
  const scope = new Scope()
    .addGlobal("agent", { description })
    .addLazyGlobal(
      "input",
      (ctx: Ctx) => options?.input?.parse(ctx.get("input")) as Input
    )

  function tasks<Options extends StepOptions>(options?: Options) {
    return $agentSteps({
      $: scope,
      stepsType: options?.stepsType as Options["stepsType"]
    })
  }

  function task<
    Value extends Task<any> | Action<any, any> | ActionWithInput<any, any, any>
  >(fn: (props: StepProps<typeof scope.global>) => Value) {
    return $agentSteps({
      $: scope
    }).add("task", fn)
  }

  function input<Input>(input: z.ZodType<Input>) {
    return $agent(description, {
      input
    })
  }

  return { tasks, task, description, input }
}
