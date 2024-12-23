import { type LoopFactory } from "./daunus_loop";
import { $steps, type StepsFactory } from "./daunus_steps";
import {
  AbstractStepFactory,
  Action,
  Scope,
  StepConfig,
  StepFactory,
  StepOptions,
  resultKey
} from "./new_types";
import { createRun } from "./run_helpers";
import { ValidateName, FormatScope, Overwrite } from "./type_helpers";

export type ExtractValuesByKey<T, K extends keyof any> =
  T extends Record<string, any>
    ? T extends Record<K, infer R>
      ? R
      : { [P in keyof T]: ExtractValuesByKey<T[P], K> }[keyof T]
    : never;

export type DeepOmitByPath<
  T,
  Path extends [keyof any, ...any[]]
> = Path extends [infer Key, ...infer Rest]
  ? Key extends keyof T
    ? Rest extends [keyof any, ...any[]]
      ? { [K in keyof T]: K extends Key ? DeepOmitByPath<T[K], Rest> : T[K] }
      : Omit<T, Key>
    : T
  : T;

type ConditionDefaultCaseStepFactoryWithout<
  Condition,
  Global extends Record<string, any> = {},
  Local extends Record<any, any> = {},
  CurrentKey extends Key = "",
  Without extends string = ""
> = Omit<
  ConditionDefaultCaseStepFactory<
    Condition,
    Global,
    Local,
    CurrentKey,
    Without
  >,
  Without
>;

interface ConditionDefaultCaseStepFactory<
  Condition,
  Global extends Record<string, any> = {},
  Local extends Record<string, any> = {},
  CurrentKey extends Key = "",
  Without extends string = ""
> extends AbstractStepFactory<Global, Local>,
    Action<
      Promise<ExtractValuesByKey<Local, typeof resultKey>>,
      Global["input"] extends unknown ? undefined : Global["input"]
    > {
  isTrue(): ConditionDefaultCaseStepFactoryWithout<
    Condition,
    GlobalWithoutFalcy<Global, Condition>,
    Local,
    "true",
    "isTrue"
  >;

  isFalse(): ConditionDefaultCaseStepFactoryWithout<
    Condition,
    GlobalWithoutTruthy<Global, Condition>,
    Local,
    "false",
    "isFalse"
  >;

  add<Name extends string, Value extends Action<any, any>>(
    name: ValidateName<Name, Local> | StepConfig<Name, Local>,
    fn: (helpers: {
      $: FormatScope<Global>;
      $if: <Condition>(options: {
        condition: Condition;
      }) => ConditionFactory<Condition, Global>;
      $steps: <Options extends StepOptions>(
        options: Options
      ) => StepsFactory<Options, Global>;
      $loop: <
        List extends Array<any> | readonly any[],
        ItemVariable extends string = "item"
      >(options: {
        list: List;
        itemVariable?: ItemVariable;
      }) => LoopFactory<List, ItemVariable, Global>;
    }) => Promise<Value> | Value
  ): ConditionDefaultCaseStepFactoryWithout<
    Condition,
    Overwrite<Global, Name> & Record<Name, Awaited<ReturnType<Value["run"]>>>,
    DeepOmitByPath<Local, [CurrentKey, typeof resultKey]> &
      Record<CurrentKey, Record<Name, Value>> &
      Record<CurrentKey, Record<typeof resultKey, Value>>,
    CurrentKey,
    Without
  >;

  add<Name extends string, Value>(
    name: ValidateName<Name, Local> | StepConfig<Name, Local>,
    fn: (helpers: {
      $: FormatScope<Global>;
      $if: <Condition>(options: {
        condition: Condition;
      }) => ConditionFactory<Condition, Global>;
      $steps: <Options extends StepOptions>(
        options: Options
      ) => StepsFactory<Options, Global>;
      $loop: <
        List extends Array<any> | readonly any[],
        ItemVariable extends string = "item"
      >(options: {
        list: List;
        itemVariable?: ItemVariable;
      }) => LoopFactory<List, ItemVariable, Global>;
    }) => Promise<Value> | Value
  ): ConditionDefaultCaseStepFactoryWithout<
    Condition,
    Overwrite<Global, Name> & Record<Name, Awaited<Value>>,
    DeepOmitByPath<Local, [CurrentKey, typeof resultKey]> &
      Record<CurrentKey, Record<Name, Value>> &
      Record<CurrentKey, Record<typeof resultKey, Value>>,
    CurrentKey,
    Without
  >;

  get<N extends keyof Local>(
    name: N,
    scope?: Record<any, any>
  ): StepFactory<Global, Local[N]>;
}
type Falsy = false | 0 | -0 | 0n | "" | null | undefined | typeof Number.NaN;

type Truthy<T> = Exclude<T, Falsy>;

type ExcludeFalsy<Condition> = Exclude<Condition, Falsy>;

type ExcludeTruthy<Condition> = Exclude<Condition, Truthy<Condition>>;

type GlobalWithoutFalcy<Global, Condition> = Omit<Global, "condition"> &
  Record<"condition", ExcludeFalsy<Condition>>;

type GlobalWithoutTruthy<Global, Condition> = Omit<Global, "condition"> &
  Record<"condition", ExcludeTruthy<Condition>>;

type Key = "true" | "false" | "";

export type ConditionFactory<
  Condition,
  Global extends Record<string, any> = {},
  Local extends Record<string, any> = {}
> = ConditionDefaultCaseStepFactory<Condition, Global, Local, "", "add">;

export function $if<
  Condition,
  Global extends Record<string, any> = {},
  Local extends Record<any, any> = Record<
    "true",
    Record<"condition", Exclude<Condition, Falsy>> &
      Record<typeof resultKey, ExcludeFalsy<Condition>>
  > &
    Record<
      "false",
      Record<"condition", ExcludeTruthy<Condition>> &
        Record<typeof resultKey, ExcludeTruthy<Condition>>
    >
>({
  condition,
  key,
  $,
  scope: prevScope
}: {
  condition: Condition;
  $?: Global;
  key?: Key;
  scope?: Scope<any, any>;
}): ConditionFactory<Condition, Global, Local> {
  const scope =
    prevScope ??
    new Scope({
      local: {
        true: {
          scope: new Scope({ global: $ })
        },
        false: {
          scope: new Scope({ global: $ })
        }
      }
    });

  function get<Name extends keyof Local>(
    name: Extract<Name, string>,
    global?: Record<any, any>
  ): Local[Name] {
    return scope.get(name, global);
  }

  function isTrue(): any {
    return $if({
      condition,
      key: "true",
      scope
    });
  }

  function isFalse(): any {
    return $if({
      condition,
      key: "false",
      scope
    });
  }

  function add(
    nameOrConfig: string | StepConfig<any, any>,
    fn: (helpers: any) => any
  ): any {
    scope.get(key ?? "").scope.addStep(nameOrConfig, fn);

    return $if({
      key,
      condition,
      scope
    });
  }

  const run = createRun<Global["input"]>((ctx) => {
    const noSteps =
      Object.values(scope.local).filter(
        (item: any) => Object.values(item.scope.steps).length === 0
      ).length === 0;

    if (!noSteps) {
      return condition;
    }

    if (condition) {
      return $steps({
        $: scope.get("true").scope.addGlobal("condition", condition)
      }).run(ctx);
    }

    return $steps({
      $: scope.get("false").scope.addGlobal("condition", condition)
    }).run(ctx);
  });

  return { run, get, add, isTrue, isFalse, scope };
}
