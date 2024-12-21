import { $steps } from "./daunus_steps";
import { toCamelCase } from "./new_helpers";
import {
  Action,
  Scope,
  StepConfig,
  StepFactory,
  StepOptions,
  resultKey
} from "./new_types";
import { ValidateName, FormatScope, Overwrite } from "./type_helpers";

export interface DefaultLoopStepFactory<
  G extends Record<string, any> = {},
  L extends Record<any, any> = Record<typeof resultKey, undefined>
> extends StepFactory<G, L>,
    Action<Promise<Array<L[typeof resultKey]>>, G["input"]> {
  add<T extends Action<any, any>, N extends string>(
    name: ValidateName<N, L> | StepConfig<N, L>,
    fn: ($: FormatScope<G>) => Promise<T> | T
  ): DefaultLoopStepFactory<
    Overwrite<G, N> & Record<N, Awaited<ReturnType<T["run"]>>>,
    Omit<L, typeof resultKey> & Record<N, T> & Record<typeof resultKey, T>
  >;

  add<T, N extends string>(
    name: ValidateName<N, L> | StepConfig<N, L>,
    fn: ($: FormatScope<G>) => Promise<T> | T
  ): DefaultLoopStepFactory<
    Overwrite<G, N> & Record<N, Awaited<T>>,
    Omit<L, typeof resultKey> & Record<N, T> & Record<typeof resultKey, T>
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

  const scope =
    $ instanceof Scope ? $ : new Scope<Global, Local>({ global: $ });

  function add<T, N extends string>(
    name: N,
    fn: ($: FormatScope<Global>) => T | Promise<T>
  ) {
    const result = (scope: any) => {
      return fn(scope);
    };

    result.meta = {
      name,
      fn
    };

    return $loopSteps({
      list,
      itemVariable,
      stepsType,
      $: new Scope({
        global: scope.global,
        local: {
          ...scope.local,
          [toCamelCase(name)]: result
        }
      })
    });
  }

  function get<N extends keyof Local>(
    name: Extract<N, string>,
    global?: Record<any, any>
  ): Local[N] {
    return scope.local[toCamelCase(name)](global);
  }

  async function run(i: any, c: any) {
    const promises = list.map((value, index) => {
      const rowScope = scope.addGlobal(itemVariable ?? "item", {
        value,
        index
      });

      return $steps({ $: rowScope, stepsType }).run(i, c);
    });

    return await Promise.all(promises);
  }

  return { scope, run, add, get } as any;
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
