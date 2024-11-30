import { $steps } from "./daunus_steps";
import { Scope, StepOptions } from "./new_types";

export function $loop<
  A extends Array<any> | readonly any[],
  I extends string = "item",
  G extends Record<string, any> = {}
>({ itemVariable = "item" as I, $ }: { list: A; itemVariable?: I; $?: G }) {
  const scope = new Scope({ global: $ }).addGlobal(itemVariable, {
    value: {} as any as A[number],
    index: {} as number
  });

  function forEachItem<T extends StepOptions>(options?: T) {
    return $steps({ $: scope, stepsType: options?.stepsType as T["stepsType"] });
  }

  return { forEachItem };
}
