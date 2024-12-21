import { isAction } from "./new_helpers";
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
  Local extends Record<string, any> = {}
> extends StepFactory<Global, Local>,
    Action<FormatScope<Local>, Global["input"]> {
  add<Value, Name extends string>(
    name: ValidateName<Name, Local> | StepConfig<Name, Local>,
    fn: ($: FormatScope<Global>) => Promise<Value> | Value
  ): ParallelStepFactory<Global, Local & Record<Name, Value>>;
}

export function $steps<
  Options extends StepOptions = {},
  Global extends Record<string, any> = {},
  Local extends Record<string, any> = {}
>(
  params?: {
    $?: Scope<Global, Local> | Global;
  } & Options
): Options["stepsType"] extends "parallel"
  ? ParallelStepFactory<Global, Local>
  : DefaultStepFactory<Global, Local> {
  const { $, stepsType } = params ?? {};

  const scope =
    $ instanceof Scope ? $ : new Scope<Global, Local>({ global: $ });

  function get<Name extends keyof Local>(
    name: Extract<Name, string>,
    global?: Record<any, any>
  ): Local[Name] {
    return scope.get(name, global);
  }

  function add(
    nameOrConfig: string | StepConfig<any, any>,
    fn: ($: any) => any
  ): any {
    return $steps({
      stepsType,
      $: scope.addStep(nameOrConfig, fn)
    });
  }

  async function run(...args: any): Promise<any> {
    const ctx = getContext(...args);

    if (!Object.keys(scope.steps)?.at(-1)) {
      return undefined;
    }

    if (stepsType === "parallel") {
      const promises = Object.values(scope.steps).map(async (fn) => {
        const res = await fn(scope.getGlobal(ctx));

        if (isAction(res)) {
          return res.run(ctx);
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
      let value = await fn(scope.getGlobal(ctx));

      if (isAction(value)) {
        value = await value.run(ctx);
      }

      scope.global = { ...scope.global, [name]: value };
      scope.local = { ...scope.local, [name]: value };

      res.push(value);
    }

    return res.at(-1);
  }

  return { get, scope, add, run: run as any };
}
