import { type z } from "zod"
import {
  type StepOptions,
  type Ctx,
  type StepFactory,
  type ActionOrActionWithInput,
  type ActionResponse
} from "./types"
import { Scope } from "./daunus-scope"
import { $stepProps, type StepProps } from "./daunus-step-props"
import { type ValidateName } from "./types-helpers"
import { $actionWithInput } from "./daunus-action-with-input"
import { isAction } from "./helpers"
import { type CoreMessage, type Message } from "ai"
import { type Type } from "arktype"

type Task<Output = string> =
  | string
  | { description: string; output?: z.ZodType<Output> | Type<Output> }

type Goal<Output = string> =
  | string
  | {
      desiredOutcome: string
      output?: z.ZodType<Output>
      maxAttempts?: number
      reflect?: (
        previousAttempts: Array<{
          desiredOutcome: string
          result: Output
          reason?: string
        }>
      ) => Goal<Output> | null
    }

type Response = {
  messages: Array<CoreMessage> | Array<Omit<Message, "id">>
}

type AgentDefaultInput<Output> =
  | { task: Task<Output> }
  | { goal: Goal<Output> }
  | { response: Response }

export interface AgentActionsFactory<Global extends Record<string, any> = {}> {
  task<Value extends Task<any>>(
    fn: ((props: StepProps<Global>) => Promise<Value> | Value) | Value
  ): ActionOrActionWithInput<
    Global["input"],
    Value extends { output: any } ? z.infer<Value["output"]> : string
  >

  goal<Value extends Goal<any>>(
    fn: ((props: StepProps<Global>) => Promise<Value> | Value) | Value
  ): ActionOrActionWithInput<
    Global["input"],
    Value extends { output: any } ? z.infer<Value["output"]> : string
  >

  response<Value extends Response>(
    fn: ((props: StepProps<Global>) => Promise<Value> | Value) | Value
  ): ActionOrActionWithInput<
    Global["input"],
    Value extends { output: any } ? z.infer<Value["output"]> : string
  >
}

export interface AgentResourcesFactory<
  Global extends Record<string, any> = {},
  Local extends Record<any, any> = {},
  StepsMap extends Record<string, any> = {}
> extends StepFactory<Global, Local, StepsMap> {
  add<Value, Name extends string>(
    name: ValidateName<Name, Local>,
    fn: (props: StepProps<Global>) => Promise<Value> | Value
  ): Global["input"] extends object
    ? AgentResourcesFactory<
        Global,
        Local & Record<Name, Value>,
        StepsMap & Record<Name, Global>
      >
    : AgentResourcesFactory<
        Global,
        Local & Record<Name, Value>,
        StepsMap & Record<Name, Global>
      > &
        ActionOrActionWithInput<{ task: string }, string>
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

  function goal(fn: any) {
    return $agentResources({
      $: scope.addStep("goal", fn),
      value: fn
    })
  }

  function response(fn: any) {
    return $agentResources({
      $: scope.addStep("response", fn),
      value: fn
    })
  }

  return {
    ...action,
    task,
    goal,
    get,
    scope,
    add
  }
}

export function $agent<Instructions extends string, Input, Output>(
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

  function goal<Value extends Goal<any>>(
    fn:
      | ((props: StepProps<typeof scope.global>) => Promise<Value> | Value)
      | Value
  ) {
    return $agentResources({
      $: scope
    }).goal(fn)
  }

  function input<Input>(input: z.ZodType<Input>) {
    const { task, resources } = $agent(instructions, {
      input
    })

    return { task, resources }
  }

  const action = $actionWithInput<any, any, any>(
    { type: "agent" },
    () => async () => {
      return "sadad"
    }
  )({})

  const { execute: actionRun } = action

  const execute = <Output = string>(
    input: AgentDefaultInput<Output>,
    ctx?: Ctx
  ): Promise<ActionResponse<Output, never>> => actionRun(input, ctx) as any

  return { ...action, task, execute, goal, resources, input }
}
