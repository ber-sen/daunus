import { type z } from "zod"
import {
  type StepOptions,
  type Ctx,
  type StepFactory,
  type ActionOrActionWithInput
} from "./types"
import { Scope } from "./daunus-scope"
import { $stepProps, type StepProps } from "./daunus-step-props"
import { type ValidateName } from "./types-helpers"
import { $actionWithInput } from "./daunus-action-with-input"
import { isAction } from "./helpers"

type Task<Output = string> =
  | string
  | { description: string; output?: z.ZodType<Output> }

export interface AgentResourcesFactory<
  Global extends Record<string, any> = {},
  Local extends Record<any, any> = {},
  StepsMap extends Record<string, any> = {}
> extends StepFactory<Global, Local, StepsMap> {
  add<Value, Name extends string>(
    name: ValidateName<Name, Local>,
    fn: (props: StepProps<Global>) => Promise<Value> | Value
  ): AgentResourcesFactory<
    Global,
    Local & Record<Name, Value>,
    StepsMap & Record<Name, Global>
  >

  task<Value extends Task<any>>(
    fn: ((props: StepProps<Global>) => Promise<Value> | Value) | Value
  ): ActionOrActionWithInput<
    Global["input"],
    Value extends { output: any } ? z.infer<Value["output"]> : string
  >
}

export type AgentStepsFactory<
  Options extends StepOptions = {},
  Global extends Record<string, any> = {},
  Local extends Record<any, any> = {},
  StepsMap extends Record<string, any> = {}
> = ReturnType<typeof $agentResources<Options, Global, Local, StepsMap>>

function $agentResources<
  Value,
  Options extends StepOptions = {},
  Global extends Record<string, any> = {},
  Local extends Record<any, any> = {},
  StepsMap extends Record<string, any> = {}
>(
  params?: {
    $?: Scope<Global, Local, StepsMap> | Global
    value?: Value
    name?: string
  } & Options
): AgentResourcesFactory<Global, Local, StepsMap> &
  ActionOrActionWithInput<Global["input"], Value> {
  const { $, stepsType } = params ?? {}

  const scope =
    $ instanceof Scope ? $ : new Scope<Global, Local, StepsMap>({ global: $ })

  function get<Name extends keyof Local>(
    name: Extract<Name, string>,
    params: { $?: Record<any, any>; ctx?: Ctx }
  ): Local[Name] {
    return scope.get(name, $stepProps(params))
  }

  function add(name: string, fn: (props: any) => any): any {
    return $agentResources({
      stepsType,
      $: scope.addLocal(name, fn)
    })
  }

  const action = $actionWithInput<Global["input"], any, any>(
    { type: "agent" },
    ({ ctx }) =>
      async () => {
        // Todo
        const promises = Object.values(scope.steps).map(async (fn) => {
          const res = await fn($stepProps({ $: scope.getGlobal(ctx), ctx }))

          if (isAction(res)) {
            return (await res.execute(ctx)).data
          }

          return res
        })

        const res = await Promise.all(promises)

        return Object.fromEntries(
          Object.keys(scope.steps).map((key, index) => [key, res[index]])
        )
      }
  )({})

  function task(fn: any) {
    return $agentResources({
      $: scope.addStep("task", fn),
      value: fn
    })
  }

  return {
    ...action,
    task,
    get,
    scope,
    add
  }
}

export function $agent<Instructions extends string, Input>(
  instructions: Instructions,
  options?: { input?: z.ZodType<Input> }
) {
  const scope = new Scope()
    .addGlobal("agent", { instructions })
    .addLazyGlobal(
      "input",
      (ctx: Ctx) => options?.input?.parse(ctx.get("input")) as Input
    )

  function resources() {
    return $agentResources({
      $: scope
    })
  }

  function task<Value extends Task<any>>(
    fn:
      | ((props: StepProps<typeof scope.global>) => Promise<Value> | Value)
      | Value
  ) {
    return $agentResources({
      $: scope
    }).task(fn)
  }

  function input<Input>(input: z.ZodType<Input>) {
    const { task, resources } = $agent(instructions, {
      input
    })

    return { task, resources }
  }

  const action = $actionWithInput<{ task: string }, any, string>(
    { type: "agent" },
    () => async () => {
      return "sadad"
    }
  )({})

  return { ...action, task, resources, input }
}
