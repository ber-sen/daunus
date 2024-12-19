import { $steps } from "./daunus_steps";
import { isAction, toCamelCase } from "./new_helpers";
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
    name: ValidateName<N, L>,
    options: StepConfig,
    fn: ($: FormatScope<G>) => Promise<T> | T
  ): DefaultLoopStepFactory<
    Overwrite<G, N> & Record<N, Awaited<ReturnType<T["run"]>>>,
    Omit<L, typeof resultKey> & Record<N, T> & Record<typeof resultKey, T>
  >;

  add<T extends Action<any, any>, N extends string>(
    name: ValidateName<N, L>,
    fn: ($: FormatScope<G>) => Promise<T> | T
  ): DefaultLoopStepFactory<
    Overwrite<G, N> & Record<N, Awaited<ReturnType<T["run"]>>>,
    Omit<L, typeof resultKey> & Record<N, T> & Record<typeof resultKey, T>
  >;

  add<T, N extends string>(
    name: ValidateName<N, L>,
    options: StepConfig,
    fn: ($: FormatScope<G>) => Promise<T> | T
  ): DefaultLoopStepFactory<
    Overwrite<G, N> & Record<N, Awaited<T>>,
    Omit<L, typeof resultKey> & Record<N, T> & Record<typeof resultKey, T>
  >;

  add<T, N extends string>(
    name: ValidateName<N, L>,
    fn: ($: FormatScope<G>) => Promise<T> | T
  ): DefaultLoopStepFactory<
    Overwrite<G, N> & Record<N, Awaited<T>>,
    Omit<L, typeof resultKey> & Record<N, T> & Record<typeof resultKey, T>
  >;
}

function $loopSteps<
  T extends StepOptions,
  G extends Record<string, any> = {},
  L extends Record<string, any> = {}
>(
  {
    $: initialScope,
    stepsType
  }: {
    $?: Scope<G, L> | G;
  } & T = {} as T
): T["stepsType"] extends "parallel"
  ? ParallelLoopStepFactory<G, L>
  : DefaultLoopStepFactory<G, L> {
  const scope =
    initialScope instanceof Scope
      ? initialScope
      : new Scope<G, L>({ global: initialScope });

  function add<T, N extends string>(
    name: N,
    fn: ($: FormatScope<G>) => T | Promise<T>
  ) {
    const result = (scope: any) => {
      return fn(scope);
    };

    result.meta = {
      name,
      fn
    };

    return $steps({
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

  function get<N extends keyof L>(
    name: Extract<N, string>,
    global?: Record<any, any>
  ): L[N] {
    return scope.local[toCamelCase(name)](global);
  }

  async function run(i: any, c: any) {
    if (!Object.keys(scope.local)?.at(-1)) {
      return undefined;
    }

    if (stepsType === "parallel") {
      const promises = Object.values(scope.local).map(async (fn) => {
        const res = await fn(scope.global);

        if (isAction(res)) {
          return await res.run(i, c);
        }

        return res;
      });

      const res = await Promise.all(promises);

      return Object.fromEntries(
        Object.keys(scope.local).map((key, index) => [key, res[index]])
      );
    }

    const res: any[] = [];

    for (const [name, fn] of Object.entries(scope.local)) {
      let value = await fn(scope.global);

      if (isAction(value)) {
        value = await value.run(i, c);
      }

      scope.global = { ...scope.global, [name]: value };
      res.push(value);
    }

    return res.at(-1);
  }

  run.type = stepsType === "parallel" ? "steps.parallel" : "steps";

  return { scope, run, add, get } as any;
}

export interface ParallelLoopStepFactory<
  G extends Record<string, any> = {},
  L extends Record<string, any> = {}
> extends StepFactory<G, L>,
    Action<Array<FormatScope<L>>, G["input"]> {
  add<T, N extends string>(
    name: ValidateName<N, L>,
    fn: ($: FormatScope<G>) => Promise<T> | T
  ): ParallelLoopStepFactory<G, L & Record<N, T>>;
}

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
    return $loopSteps({
      $: scope,
      stepsType: options?.stepsType as T["stepsType"]
    });
  }

  return { forEachItem };
}
