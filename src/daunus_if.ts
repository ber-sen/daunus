import {
  AbstractStepFactory,
  Action,
  Scope,
  StepConfig,
  StepFactory,
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

  add<T extends Action<any, any>, N extends string>(
    name: ValidateName<N, Local> | StepConfig<N, Local>,
    fn: ($: FormatScope<Global>) => Promise<T> | T
  ): ConditionDefaultCaseStepFactoryWithout<
    Condition,
    Overwrite<Global, N> & Record<N, Awaited<ReturnType<T["run"]>>>,
    DeepOmitByPath<Local, [CurrentKey, typeof resultKey]> &
      Record<CurrentKey, Record<N, T>> &
      Record<CurrentKey, Record<typeof resultKey, T>>,
    CurrentKey,
    Without
  >;

  add<T, N extends string>(
    name: ValidateName<N, Local> | StepConfig<N, Local>,
    fn: ($: FormatScope<Global>) => Promise<T> | T
  ): ConditionDefaultCaseStepFactoryWithout<
    Condition,
    Overwrite<Global, N> & Record<N, Awaited<T>>,
    DeepOmitByPath<Local, [CurrentKey, typeof resultKey]> &
      Record<CurrentKey, Record<N, T>> &
      Record<CurrentKey, Record<typeof resultKey, T>>,
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

type MainConditionStepFactory<
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
  scopes: prevScopes
}: {
  condition: Condition;
  $?: Global;
  key?: Key;
  scopes?: Scope<any, any>;
}): MainConditionStepFactory<Condition, Global, Local> {
  const scopes =
    prevScopes ??
    new Scope({
      local: {
        true: new Scope({ global: $ }),
        false: new Scope({ global: $ })
      }
    });

  if (key) {
    scopes.addLocal(key, $ instanceof Scope ? $ : new Scope({ global: $ }));
  }

  function get<Name extends keyof Local>(
    name: Extract<Name, string>,
    global?: Record<any, any>
  ): Local[Name] {
    return scopes.get(name, global);
  }

  const run = createRun<Global["input"]>(() => {
    const noSteps =
      Object.values(scopes.local).filter(
        (item: any) => Object.values(item.steps).length === 0
      ).length === 0;

    if (!noSteps) {
      return condition;
    }

    return null;
  });

  return { run, get } as any
}
