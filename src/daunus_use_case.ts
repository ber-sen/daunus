import { z } from "zod"
import { $steps, StepsFactory } from "./daunus_steps"
import { Scope, StepOptions } from "./new_types"
import { FormatScope } from "./type_helpers"
import { ConditionFactory, DaunusCtx, LoopFactory } from "."

export function $useCase<Input>(options?: { input?: z.ZodType<Input> }) {
  const scope = new Scope({}).addLazyGlobal(
    "input",
    (ctx: DaunusCtx) => options?.input?.parse(ctx.get("input")) as Input
  )

  function steps<Options extends StepOptions>(options?: Options) {
    return $steps({
      $: scope,
      stepsType: options?.stepsType as Options["stepsType"]
    })
  }

  function handle<Value>(
    fn: (helpers: {
      $: FormatScope<typeof scope.global>
      $if: <Condition>(options: {
        condition: Condition
      }) => ConditionFactory<Condition, typeof scope.global>
      $steps: <Options extends StepOptions>(
        options: Options
      ) => StepsFactory<Options, typeof scope.global>
      $loop: <
        List extends Array<any> | readonly any[],
        ItemVariable extends string = "item"
      >(options: {
        list: List
        itemVariable?: ItemVariable
      }) => LoopFactory<List, ItemVariable, typeof scope.global>
    }) => Promise<Value> | Value
  ) {
    return $steps({
      $: scope
    }).add("handle", fn)
  }

  return { steps, handle }
}
