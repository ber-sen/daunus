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
  type StepOptions,
  type Ctx
} from "./types"
import { $steps } from "./daunus-steps"

import {
  type ValidateName,
  type FormatScope,
  type Overwrite
} from "./types-helpers"
import { $actionWithInput } from "./daunus-action-with-input"
import { isException } from "./helpers"
import { $stepProps, type StepProps } from "./daunus-step-props"
import { Scope } from "./daunus-scope"

export interface DefaultLoopStepFactory<
  Global extends Record<string, any> = {},
  Local extends Record<any, any> = Record<typeof resultKey, undefined>,
  StepsMap extends Record<string, any> = {}
> extends StepFactory<Global, Local, StepsMap>,
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
      (Value extends Action<any, any> | ActionWithInput<any, any, any>
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
        : {}),
    StepsMap & Record<Name, Global>
  >
}

export interface ParallelLoopStepFactory<
  Global extends Record<string, any> = {},
  Local extends Record<string, any> = {},
  StepsMap extends Record<string, any> = {}
> extends StepFactory<Global, Local>,
    ActionOrActionWithInput<Global["input"], Array<FormatScope<Local>>> {
  add<Name extends string, Value>(
    name: ValidateName<Name, Local> | StepConfig<Name, Local>,
    fn: (props: StepProps<Global>) => Promise<Value> | Value
  ): ParallelLoopStepFactory<Global, Local & Record<Name, Value>, StepsMap & Record<Name, Global>>
}

export type Item<List extends Array<any> | readonly any[]> = {
  value: List[number]
  index: number
}

function rangeToList<T extends Array<number> | readonly number[]>(
  range: [number, number] | number
): T {
  const [start, end] = typeof range === "number" ? [0, range - 1] : range

  return Array.from(
    { length: end - start + 1 },
    (_, index) => start + index
  ) as T
}

function $loopSteps<
  List extends Array<any> | readonly any[],
  ItemVariable extends string = "item",
  Options extends StepOptions = {},
  Global extends Record<string, any> = {},
  Local extends Record<string, any> = {},
  StepsMap extends Record<string, any> = {}
>(
  params: {
    name?: string
    list: List
    itemVariable?: ItemVariable
    $?: Scope<Global, Local, StepsMap> | Global
  } & Options
): Options["stepsType"] extends "parallel"
  ? ParallelLoopStepFactory<Global & Record<ItemVariable, Item<List>>, Local, StepsMap>
  : DefaultLoopStepFactory<Global & Record<ItemVariable, Item<List>>, Local, StepsMap> {
  const { $, list, itemVariable, stepsType } = params ?? {}

  const scope = $ instanceof Scope ? $ : new Scope<Global, Local, StepsMap>({ global: $ })

  function get<Name extends keyof Local>(
    name: Extract<Name, string>,
    params: { $?: Record<any, any>; ctx?: Ctx }
  ): Local[Name] {
    return scope.get(name, $stepProps(params))
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

          const { data, exception } = await $steps({
            $: rowScope,
            stepsType
          }).run(ctx)

          if (exception) {
            return exception
          }

          return data
        })

        const result = await Promise.all(promises)

        const exception = result.find((item) => isException(item))

        if (exception) {
          return exception
        }

        return result
      }
  )({})

  return { ...action, get, scope, add }
}

export type IterateFactory<
  List extends Array<any> | readonly any[],
  ItemVariable extends string = "item",
  Global extends Record<string, any> = {}
> = ReturnType<typeof $iterate<List, ItemVariable, Global>>

export function $iterate<
  List extends Array<any> | readonly any[] = number[],
  ItemVariable extends string = "item",
  Global extends Record<string, any> = {}
>(
  params: { itemVariable?: ItemVariable; $?: Global } & (
    | { list: List }
    | { range: [number, number] | number }
  )
) {
  function forEachItem<Options extends StepOptions>(options?: Options) {
    const list: List =
      "range" in params ? rangeToList(params.range) : params.list

    return $loopSteps({
      ...params,
      list,
      stepsType: options?.stepsType as Options["stepsType"]
    })
  }

  return { forEachItem }
}
