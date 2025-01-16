import {
  type StepFactory,
  type DataResponse,
  type ActionOrActionWithInput,
  type ExtractExceptions,
  type resultKey,
  type ActionWithInput,
  type Action,
  type ExceptionReponse,
  type StepConfig,
  type StepOptions
} from "./types"
import { $steps } from "./daunus_steps"

import {
  type ValidateName,
  type FormatScope,
  type Overwrite
} from "./types_helpers"
import { $actionWithInput } from "./daunus_action_with_input"
import { Scope, type StepProps } from "./daunus_scope"

export interface DefaultLoopStepFactory<
  Global extends Record<string, any> = {},
  Local extends Record<any, any> = Record<typeof resultKey, undefined>
> extends StepFactory<Global, Local>,
    ActionOrActionWithInput<
      Global["input"],
      ExtractExceptions<Local["exceptions"]> extends undefined
        ? Array<Local[typeof resultKey]>
        :
            | Array<Local[typeof resultKey]>
            | ExtractExceptions<Local["exceptions"]>
    > {
  add<Value, Name extends string>(
    name: ValidateName<Name, Local> | StepConfig<Name, Local>,
    fn: (props: StepProps<Global>) => Value | Promise<Value>
  ): DefaultLoopStepFactory<
    Overwrite<Global, Name> &
      Record<
        Name,
        Value extends ActionWithInput<any, any, any> | Action<any, any>
          ? Awaited<ReturnType<Value["run"]>> extends DataResponse<infer T>
            ? T
            : never
          : Value
      >,
    // &
    // (Value extends Action<any, any> | ActionWithInput<any, any, any>
    //   ? Record<
    //       "exceptions",
    //       Record<
    //         Name,
    //         Awaited<ReturnType<Value["run"]>> extends ExceptionReponse<
    //           infer T
    //         >
    //           ? T
    //           : never
    //       >
    //     >
    //   : {}),
    Omit<Local, typeof resultKey> &
      Record<Name, Value> &
      Record<
        typeof resultKey,
        Value extends Action<any, any> | ActionWithInput<any, any, any>
          ? Awaited<ReturnType<Value["run"]>> extends DataResponse<infer T>
            ? T
            : never
          : Value
      > &
      (Value extends Action<any, any>
        ? Record<
            "exceptions",
            Record<
              Name,
              Awaited<ReturnType<Value["run"]>> extends ExceptionReponse<
                infer T
              >
                ? T
                : never
            >
          >
        : {})
  >
}

export interface ParallelLoopStepFactory<
  Global extends Record<string, any> = {},
  Local extends Record<string, any> = {}
> extends StepFactory<Global, Local>,
    ActionOrActionWithInput<Global["input"], Array<FormatScope<Local>>> {
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

  const action = $actionWithInput<Global["input"], any, any>(
    { type: "loop" },
    ({ ctx }) =>
      async () => {
        const promises = list.map(async (value, index) => {
          const rowScope = scope.addGlobal(itemVariable ?? "item", {
            value,
            index
          })

          const { data } = await $steps({ $: rowScope, stepsType }).run(ctx)

          return data
        })

        return await Promise.all(promises)
      }
  )({})

  return { ...action, get, scope, add }
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
