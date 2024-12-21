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

export interface DefaultStepFactory<
  Global extends Record<string, any> = {},
  Local extends Record<any, any> = Record<typeof resultKey, undefined>
> extends StepFactory<Global, Local>,
    Action<Promise<Local[typeof resultKey]>, Global["input"]> {
  add<T extends Action<any, any>, N extends string>(
    name: ValidateName<N, Local> | StepConfig<N, Local>,
    fn: ($: FormatScope<Global>) => Promise<T> | T
  ): DefaultStepFactory<
    Overwrite<Global, N> & Record<N, Awaited<ReturnType<T["run"]>>>,
    Omit<Local, typeof resultKey> & Record<N, T> & Record<typeof resultKey, T>
  >;

  add<T, N extends string>(
    name: ValidateName<N, Local> | StepConfig<N, Local>,
    fn: ($: FormatScope<Global>) => Promise<T> | T
  ): DefaultStepFactory<
    Overwrite<Global, N> & Record<N, Awaited<T>>,
    Omit<Local, typeof resultKey> & Record<N, T> & Record<typeof resultKey, T>
  >;
}

export interface ParallelStepFactory<
  Global extends Record<string, any> = {},
  Local extends Record<string, any> = {}
> extends StepFactory<Global, Local>,
    Action<FormatScope<Local>, Global["input"]> {
  add<T, N extends string>(
    name: ValidateName<N, Local> | StepConfig<N, Local>,
    fn: ($: FormatScope<Global>) => Promise<T> | T
  ): ParallelStepFactory<Global, Local & Record<N, T>>;
}

export function $steps<
  T extends StepOptions = {},
  G extends Record<string, any> = {},
  L extends Record<string, any> = {}
>(
  params?: {
    $?: Scope<G, L> | G;
  } & T
): T["stepsType"] extends "parallel"
  ? ParallelStepFactory<G, L>
  : DefaultStepFactory<G, L> {
  const scope =
  params?.$ instanceof Scope
      ? params?.$
      : new Scope<G, L>({ global: params?.$ });

  function add<T>(
    nameOrConfig: string | StepConfig<any, any>,
    fn: ($: FormatScope<G>) => T | Promise<T>
  ) {
    const name =
      typeof nameOrConfig === "string" ? nameOrConfig : nameOrConfig.name;

    const result = (scope: any) => {
      return fn(scope);
    };

    result.meta = {
      name,
      fn
    };

    return $steps({
      stepsType: params?.stepsType,
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

    if (params?.stepsType === "parallel") {
      const promises = Object.values(scope.local).map(async (fn) => {
        const res = await fn(scope.global);

        if (isAction(res)) {
          return res.run(i, c);
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

  return { scope, run, add, get } as any;
}
