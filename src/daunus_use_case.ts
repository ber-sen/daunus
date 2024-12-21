import { z } from "zod";
import { $steps } from "./daunus_steps";
import { Scope, StepOptions } from "./new_types";
import { DaunusCtx } from ".";

export function $useCase<T>(options?: { input?: z.ZodType<T> }) {
  const scope = new Scope({}).addLazyGlobal("input", (ctx: DaunusCtx) =>
    options?.input?.parse(ctx.get("input")) as T
  );

  function steps<T extends StepOptions>(options?: T) {
    return $steps({
      $: scope,
      stepsType: options?.stepsType as T["stepsType"]
    });
  }

  function handle<Z>(fn: ($: typeof scope.global) => Z) {
    return $steps({
      $: scope
    }).add("handle", fn);
  }

  return { steps, handle };
}
