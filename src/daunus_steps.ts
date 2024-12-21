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
  add<Value extends Action<any, any>, Name extends string>(
    name: ValidateName<Name, Local> | StepConfig<Name, Local>,
    fn: ($: FormatScope<Global>) => Promise<Value> | Value
  ): DefaultStepFactory<
    Overwrite<Global, Name> & Record<Name, Awaited<ReturnType<Value["run"]>>>,
    Omit<Local, typeof resultKey> &
      Record<Name, Value> &
      Record<typeof resultKey, Value>
  >;

  add<Value, Name extends string>(
    name: ValidateName<Name, Local> | StepConfig<Name, Local>,
    fn: ($: FormatScope<Global>) => Promise<Value> | Value
  ): DefaultStepFactory<
    Overwrite<Global, Name> & Record<Name, Awaited<Value>>,
    Omit<Local, typeof resultKey> &
      Record<Name, Value> &
      Record<typeof resultKey, Value>
  >;
}

export interface ParallelStepFactory<
  Global extends Record<string, any> = {},
  Local extends Record<string, any> = {},
> extends StepFactory<Global, Local>,
    Action<FormatScope<Local>, Global["input"]> {
  add<Value, Name extends string>(
    name: ValidateName<Name, Local> | StepConfig<Name, Local>,
    fn: ($: FormatScope<Global>) => Promise<Value> | Value
  ): ParallelStepFactory<Global, Local & Record<Name, Value>>;
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
  const { $, stepsType } = params ?? {};

  const scope = $ instanceof Scope ? $ : new Scope<G, L>({ global: $ });

  function add<T>(
    nameOrConfig: string | StepConfig<any, any>,
    fn: ($: FormatScope<G>) => T | Promise<T>
  ) {
    const name =
      typeof nameOrConfig === "string" ? nameOrConfig : nameOrConfig.name;

    return $steps({
      stepsType,
      $: scope.addStep(name, fn)
    });
  }

  function get<N extends keyof L>(
    name: Extract<N, string>,
    global?: Record<any, any>
  ): L[N] {
    return scope.steps[toCamelCase(name)](global);
  }

  async function run(i: any, c: any) {
    if (!Object.keys(scope.steps)?.at(-1)) {
      return undefined;
    }

    if (stepsType === "parallel") {
      const promises = Object.values(scope.steps).map(async (fn) => {
        const res = await fn(scope.global);

        if (isAction(res)) {
          return res.run(i, c);
        }

        return res;
      });

      const res = await Promise.all(promises);

      return Object.fromEntries(
        Object.keys(scope.steps).map((key, index) => [key, res[index]])
      );
    }

    const res: any[] = [];

    for (const [name, fn] of Object.entries(scope.steps)) {
      let value = await fn(scope.global);

      if (isAction(value)) {
        value = await value.run(i, c);
      }

      scope.global = { ...scope.global, [name]: value };
      scope.local = { ...scope.local, [name]: value };

      res.push(value);
    }

    return res.at(-1);
  }

  return { scope, run, add, get } as any;
}
