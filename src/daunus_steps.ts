import { isAction, toCamelCase } from "./new_helpers";
import {
  Action,
  Scope,
  StepConfig,
  StepFactory,
  StepOptions,
  resultKey
} from "./new_types";
import { DisableSameName, FormatScope, Overwrite } from "./type_helpers";

export interface DefaultStepFactory<
  G extends Record<string, any> = {},
  L extends Record<any, any> = Record<typeof resultKey, undefined>
> extends StepFactory<G, L>,
    Action<"steps", Promise<L[typeof resultKey]>> {
  add<T extends Action<any, any>, N extends string>(
    name: DisableSameName<N, L>,
    options: StepConfig,
    fn: ($: FormatScope<G>) => Promise<T> | T
  ): DefaultStepFactory<
    Overwrite<G, N> & Record<N, Awaited<ReturnType<T["run"]>>>,
    Omit<L, typeof resultKey> & Record<N, T> & Record<typeof resultKey, T>
  >;

  add<T extends Action<any, any>, N extends string>(
    name: DisableSameName<N, L>,
    fn: ($: FormatScope<G>) => Promise<T> | T
  ): DefaultStepFactory<
    Overwrite<G, N> & Record<N, Awaited<ReturnType<T["run"]>>>,
    Omit<L, typeof resultKey> & Record<N, T> & Record<typeof resultKey, T>
  >;

  add<T, N extends string>(
    name: DisableSameName<N, L>,
    options: StepConfig,
    fn: ($: FormatScope<G>) => Promise<T> | T
  ): DefaultStepFactory<
    Overwrite<G, N> & Record<N, Awaited<T>>,
    Omit<L, typeof resultKey> & Record<N, T> & Record<typeof resultKey, T>
  >;

  add<T, N extends string>(
    name: DisableSameName<N, L>,
    fn: ($: FormatScope<G>) => Promise<T> | T
  ): DefaultStepFactory<
    Overwrite<G, N> & Record<N, Awaited<T>>,
    Omit<L, typeof resultKey> & Record<N, T> & Record<typeof resultKey, T>
  >;
}

export interface ParallelStepFactory<
  G extends Record<string, any> = {},
  L extends Record<string, any> = {}
> extends StepFactory<G, L>,
    Action<"steps.parallel", FormatScope<L>> {
  add<T, N extends string>(
    name: DisableSameName<N, L>,
    fn: ($: FormatScope<G>) => Promise<T> | T
  ): ParallelStepFactory<G, L & Record<N, T>>;
}

export function $steps<
  T extends StepOptions,
  G extends Record<string, any> = {},
  L extends Record<string, any> = {}
>({
  $: initialScope,
  stepsType
}: {
  $?: Scope<G, L> | G
} & T = {} as T): T["stepsType"] extends "parallel"
  ? ParallelStepFactory<G, L>
  : DefaultStepFactory<G, L> {
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

  async function run() {
    if (!Object.keys(scope.local)?.at(-1)) {
      return undefined;
    }

    if (stepsType === "parallel") {
      const promises = Object.values(scope.local).map(async (action) => {
        const res = await action(scope.global);

        if (isAction(res)) {
          return await res.run();
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
        value = await value.run();
      }

      scope.global = { ...scope.global, [name]: value };
      res.push(value);
    }

    return res.at(-1);
  }

  run.type = stepsType === "parallel" ? "steps.parallel" : "steps";

  return { scope, run, add, get } as any
}
