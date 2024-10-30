import { $steps } from "./daunus_steps";
import { StepOptions } from "./new_types";

export function $loop<
  A extends Array<any> | readonly any[],
  I extends string = "item",
  G extends Record<string, any> = {}
>(
  { itemVariable = "item" as I }: { list: A; itemVariable?: I },
  initialScope?: G
) {
  function forEachItem<T extends StepOptions>(options: T) {
    return $steps(initialScope).add(itemVariable, () => {
      return {
        value: {} as any as A[number],
        index: {} as number
      };
    });
  }

  return { forEachItem };
}
