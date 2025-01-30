import { $steps, type StepsFactory } from "./daunus_steps"
import { $if, type ConditionFactory } from "./daunus_if"
import { $loop, type LoopFactory } from "./daunus_loop"
import { type StepOptions } from "./types"
import { type FormatScope } from "./types_helpers"

export interface StepProps<Global extends Record<string, any> = {}> {
  $: FormatScope<Global>
  $if: <Condition>(options: {
    condition: Condition
  }) => ConditionFactory<Condition, Global>
  $steps: <Options extends StepOptions>(
    options?: Options
  ) => StepsFactory<Options, Global>
  $loop: <
    List extends Array<any> | readonly any[],
    ItemVariable extends string = "item"
  >(options: {
    list: List
    itemVariable?: ItemVariable
  }) => LoopFactory<List, ItemVariable, Global>
}

export const $stepProps = <Global extends Record<string, any> = {}>(
  global: Global = {} as Global
): StepProps<Global> => ({
  $: global,
  $if: (options: any) => $if({ $: global, ...options }),
  $loop: (options: any) => $loop({ $: global, ...options }),
  $steps: (options: any) => $steps({ $: global, ...options }) as any
})
