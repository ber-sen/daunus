import { z } from "zod"
import { $steps } from "./daunus_steps"
import { Scope, StepProps, StepOptions } from "./new_types"
import { toCamelCase } from "./new_helpers"
import { DaunusCtx } from "."

export function $useCase<Name extends string, Input>(
  originalName: Name,
  options?: { input?: z.ZodType<Input> }
) {
  const name = toCamelCase(originalName)

  const scope = new Scope()
    .addGlobal("useCase", { name, originalName })
    .addLazyGlobal(
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
    fn: (props: StepProps<typeof scope.global>) => Promise<Value> | Value
  ) {
    return $steps({
      $: scope
    }).add("handle", fn)
  }

  return { steps, handle, originalName, name }
}
