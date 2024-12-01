import { z } from "zod";
import { $steps } from "./daunus_steps";
import { Scope, StepOptions } from "./new_types";

export function $route<T>(options?: { input?: z.ZodType<T> }) {
  const scope = new Scope({}).addGlobal("input", {} as T);

  function steps<T extends StepOptions>(options?: T) {
    return $steps({ $: scope, stepsType: options?.stepsType as T["stepsType"] });
  }

  return { steps };
}
