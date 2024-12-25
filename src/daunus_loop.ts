import { DaunusAction, DaunusActionOrActionWithInput } from "./types"
import { $steps } from "./daunus_steps"
import {
  Scope,
  StepConfig,
  StepFactory,
  StepProps,
  StepOptions,
  resultKey
} from "./new_types"
import { createRun } from "./run_helpers"
import { ValidateName, FormatScope, Overwrite } from "./type_helpers"

export interface DefaultLoopStepFactory<
  Global extends Record<string, any> = {},
  Local extends Record<any, any> = Record<typeof resultKey, undefined>
> extends StepFactory<Global, Local>,
    DaunusActionOrActionWithInput<
      Global["input"],
      Local[typeof resultKey] extends DaunusActionOrActionWithInput<any, any, any>
        ? Array<Awaited<ReturnType<Local[typeof resultKey]["run"]>>["data"]>
        : Array<Local[typeof resultKey]>
    > {
  add<Value extends DaunusAction<any, any>, N extends string>(
    name: ValidateName<N, Local> | StepConfig<N, Local>,
    fn: (props: StepProps<Global>) => Promise<Value> | Value
  ): DefaultLoopStepFactory<
    Overwrite<Global, N> & Record<N, Awaited<ReturnType<Value["run"]>>["data"]>,
    Omit<Local, typeof resultKey> &
      Record<N, Value> &
      Record<typeof resultKey, Value>
  >

  add<Value, N extends string>(
    name: ValidateName<N, Local> | StepConfig<N, Local>,
    fn: (props: StepProps<Global>) => Promise<Value> | Value
  ): DefaultLoopStepFactory<
    Overwrite<Global, N> & Record<N, Awaited<Value>>,
    Omit<Local, typeof resultKey> &
      Record<N, Value> &
      Record<typeof resultKey, Value>
  >
}

export interface ParallelLoopStepFactory<
  Global extends Record<string, any> = {},
  Local extends Record<string, any> = {}
> extends StepFactory<Global, Local>,
    DaunusActionOrActionWithInput<Global["input"], Array<FormatScope<Local>>> {
  add<Name extends string, Value>(
    name: ValidateName<Name, Local> | StepConfig<Name, Local>,
    fn: (props: StepProps<Global>) => Promise<Value> | Value
  ): ParallelLoopStepFactory<Global, Local & Record<Name, Value>>
}

type Item<List extends Array<any> | readonly any[]> = {
  value: List[number]
  index: number
}

function $loopSteps<
  List extends Array<any> | readonly any[],
  ItemVariable extends string = "item",
  Options extends StepOptions = {},
  Global extends Record<string, any> = {},
  Local extends Record<string, any> = {}
>(
  params: {
    name?: string
    list: List
    itemVariable?: ItemVariable
    $?: Scope<Global, Local> | Global
  } & Options
): Options["stepsType"] extends "parallel"
  ? ParallelLoopStepFactory<Global & Record<ItemVariable, Item<List>>, Local>
  : DefaultLoopStepFactory<Global & Record<ItemVariable, Item<List>>, Local> {
  const { $, list, itemVariable, stepsType } = params ?? {}

  const scope = $ instanceof Scope ? $ : new Scope<Global, Local>({ global: $ })

  function get<Name extends keyof Local>(
    name: Extract<Name, string>,
    global?: Record<any, any>
  ): Local[Name] {
    return scope.get(name, global)
  }

  function add(
    nameOrConfig: string | StepConfig<any, any>,
    fn: (props: any) => any
  ): any {
    return $loopSteps({
      list,
      itemVariable,
      stepsType,
      $: scope.addStep(nameOrConfig, fn)
    })
  }

  const run: any = createRun<Global["input"]>(async (ctx) => {
    const promises = list.map(async (value, index) => {
      const rowScope = scope.addGlobal(itemVariable ?? "item", {
        value,
        index
      })

      const { data } = await $steps({ $: rowScope, stepsType }).run(ctx)

      return data
    })

    return await Promise.all(promises)
  })

  // TODO
  const env = {}

  const name = params?.name as string

  const input: any = () => {
    return {} as any
  }

  return { get, scope, add, run, name, env, input }
}

export type LoopFactory<
  List extends Array<any> | readonly any[],
  ItemVariable extends string = "item",
  Global extends Record<string, any> = {}
> = ReturnType<typeof $loop<List, ItemVariable, Global>>

export function $loop<
  List extends Array<any> | readonly any[],
  ItemVariable extends string = "item",
  Global extends Record<string, any> = {}
>(params: { list: List; itemVariable?: ItemVariable; $?: Global }) {
  function forEachItem<Options extends StepOptions>(options?: Options) {
    return $loopSteps({
      ...params,
      stepsType: options?.stepsType as Options["stepsType"]
    })
  }

  return { forEachItem }
}
