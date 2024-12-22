import { z } from "zod";
import { $steps } from "./daunus_steps";
import { Scope, StepOptions } from "./new_types";
import { DaunusCtx } from ".";

export function $useCase<Input>(options?: { input?: z.ZodType<Input> }) {
  const scope = new Scope({}).addLazyGlobal("input", (ctx: DaunusCtx) =>
    options?.input?.parse(ctx.get("input")) as Input
  );

  function steps<Options extends StepOptions>(options?: Options) {
    return $steps({
      $: scope,
      stepsType: options?.stepsType as Options["stepsType"]
    });
  }

  function handle<Value>(fn: ($: typeof scope.global) => Value) {
    return $steps({
      $: scope
    }).add("handle", fn);
  }

  return { steps, handle };
}
