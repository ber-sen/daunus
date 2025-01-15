import { type z } from "zod"
import { $steps } from "./daunus_steps"
import { type StepProps, type StepOptions } from "./new_types"
import { toCamelCase } from "./helpers"
import { type DaunusCtx } from "./types"
import { Scope } from "./daunus_scope"

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

  function withInput<Input>(input: z.ZodType<Input>) {
    return $useCase(originalName, {
      input
    })
  }

  return { steps, handle, originalName, name, withInput }
}
