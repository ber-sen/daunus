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
  $: Global = {} as Global
): StepProps<Global> => ({
  $,
  $if: (options: any) => $if({ $, ...options }),
  $loop: (options: any) => $loop({ $, ...options }),
  $steps: <Options extends StepOptions = {}>(options?: Options) =>
    $steps({ $, ...(options ?? ({} as Options)) })
})
