import { $steps } from "./daunus_steps";
import {
  Action,
  Scope,
  StepConfig,
  StepFactory,
  StepOptions,
  resultKey
} from "./new_types";
import { getContext } from "./run_helpers";
import { ValidateName, FormatScope, Overwrite } from "./type_helpers";

export interface DefaultLoopStepFactory<
  Global extends Record<string, any> = {},
  Local extends Record<any, any> = Record<typeof resultKey, undefined>
> extends StepFactory<Global, Local>,
    Action<Promise<Array<Local[typeof resultKey]>>, Global["input"]> {
  add<T extends Action<any, any>, N extends string>(
    name: ValidateName<N, Local> | StepConfig<N, Local>,
    fn: ($: FormatScope<Global>) => Promise<T> | T
  ): DefaultLoopStepFactory<
    Overwrite<Global, N> & Record<N, Awaited<ReturnType<T["run"]>>>,
    Omit<Local, typeof resultKey> & Record<N, T> & Record<typeof resultKey, T>
  >;

  add<T, N extends string>(
    name: ValidateName<N, Local> | StepConfig<N, Local>,
    fn: ($: FormatScope<Global>) => Promise<T> | T
  ): DefaultLoopStepFactory<
    Overwrite<Global, N> & Record<N, Awaited<T>>,
    Omit<Local, typeof resultKey> & Record<N, T> & Record<typeof resultKey, T>
  >;
}

export interface ParallelLoopStepFactory<
  G extends Record<string, any> = {},
  L extends Record<string, any> = {}
> extends StepFactory<G, L>,
    Action<Promise<Array<FormatScope<L>>>, G["input"]> {
  add<T, N extends string>(
    name: ValidateName<N, L> | StepConfig<N, L>,
    fn: ($: FormatScope<G>) => Promise<T> | T
  ): ParallelLoopStepFactory<G, L & Record<N, T>>;
}

function $loopSteps<
  List extends Array<any> | readonly any[],
  itemVariable extends string = "item",
  Options extends StepOptions = {},
  Global extends Record<string, any> = {},
  Local extends Record<string, any> = {}
>(
  params: {
    list: List;
    itemVariable?: itemVariable;
    $?: Scope<Global, Local> | Global;
  } & Options
): Options["stepsType"] extends "parallel"
  ? ParallelLoopStepFactory<
      Global &
        Record<
          itemVariable,
          {
            value: List[number];
            index: number;
          }
        >,
      Local
    >
  : DefaultLoopStepFactory<
      Global &
        Record<
          itemVariable,
          {
            value: List[number];
            index: number;
          }
        >,
      Local
    > {
  const { $, list, itemVariable, stepsType } = params ?? {};

  const { get, scope } = $steps({ $, stepsType });

  function add(
    nameOrConfig: string | StepConfig<any, any>,
    fn: ($: any) => any
  ): any {
    return $loopSteps({
      list,
      itemVariable,
      stepsType,
      $: scope.addStep(nameOrConfig, fn)
    });
  }

  async function run(...args: any) {
    const ctx = getContext(...args);

    const promises = list.map((value, index) => {
      const rowScope = scope.addGlobal(itemVariable ?? "item", {
        value,
        index
      });

      return $steps({ $: rowScope, stepsType }).run(ctx);
    });

    return await Promise.all(promises);
  }

  return { get, scope, add, run: run as any };
}

export function $loop<
  List extends Array<any> | readonly any[],
  itemVariable extends string = "item",
  Global extends Record<string, any> = {}
>(params: { list: List; itemVariable?: itemVariable; $?: Global }) {
  function forEachItem<Options extends StepOptions>(options?: Options) {
    return $loopSteps({
      ...params,
      stepsType: options?.stepsType as Options["stepsType"]
    });
  }

  return { forEachItem };
}
