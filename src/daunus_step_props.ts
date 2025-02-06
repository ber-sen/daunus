import { $steps, type StepsFactory } from "./daunus_steps"
import { $when, type ConditionFactory } from "./daunus_when"
import { $loop, type LoopFactory } from "./daunus_loop"
import { type StepOptions } from "./types"
import { type FormatScope } from "./types_helpers"
import { type Ctx } from "../dist"
import { $prompt, type PromptFactory } from "./daunus_prompt"

export interface StepProps<Global extends Record<string, any> = {}> {
  scope: FormatScope<Global>
  $: FormatScope<Global>
  ctx: Ctx
  when: <Condition>(options: {
    condition: Condition
  }) => ConditionFactory<Condition, Global>
  steps: <Options extends StepOptions>(
    options?: Options
  ) => StepsFactory<Options, Global>
  loop: <
    List extends Array<any> | readonly any[],
    ItemVariable extends string = "item"
  >(options: {
    list: List
    itemVariable?: ItemVariable
  }) => LoopFactory<List, ItemVariable, Global>
  prompt: PromptFactory
}

export const $stepProps = <Global extends Record<string, any> = {}>({
  $ = {} as Global,
  ctx = new Map() as Ctx
}: {
  $?: Global
  ctx?: Ctx
} = {}): StepProps<Global> => ({
  $,
  ctx,
  scope: $,
  when: (options: any) => $when({ $, ...options }),
  loop: (options: any) => $loop({ $, ...options }),
  steps: <Options extends StepOptions = {}>(options?: Options) =>
    $steps({ $, ...(options ?? ({} as Options)) }),
  prompt: (options: any) =>
    $prompt({ ctx, model: ctx.get(".defaultModel") })(options)
})
