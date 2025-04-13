import { z } from "zod"
import { $steps } from "./daunus-steps"
import { toCamelCase } from "./helpers"
import { type StepOptions, type Ctx, type Input } from "./types"
import { Scope } from "./daunus-scope"
import { type StepProps } from "./daunus-step-props"
import { type Type } from "arktype"

export function $useCase<
  Name extends string,
  InputSchema extends Input<any> | undefined = undefined
>(originalName: Name, options?: { input?: InputSchema }) {
  const name = toCamelCase(originalName)

  const scope = new Scope()
    .addGlobal("useCase", { name, originalName })
    .addLazyGlobal(
      "input",
      (
        ctx: Ctx
      ): InputSchema extends Input<infer Schema> ? Schema : undefined => {
        if (options?.input && options.input instanceof z.ZodAny) {
          return options?.input?.parse(ctx.get("input"))
        }

        if (typeof options?.input === "function") {
          return options?.input?.(ctx.get("input"))
        }

        return undefined as any
      }
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

  function input<Input>(input: z.ZodType<Input> | Type<Input>) {
    return $useCase(originalName, {
      input
    })
  }

  return { steps, handle, originalName, name, input }
}
