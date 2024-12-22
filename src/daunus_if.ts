import {
  AbstractStepFactory,
  Action,
  StepConfig,
  StepFactory,
  resultKey
} from "./new_types";
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
  ScopeKey extends string = "",
  Without extends string = ""
> = Omit<
  ConditionDefaultCaseStepFactory<Condition, Global, Local, ScopeKey, Without>,
  Without
>;

interface ConditionDefaultCaseStepFactory<
  Condition,
  Global extends Record<string, any> = {},
  Local extends Record<string, any> = {},
  K extends string = "",
  E extends string = ""
> extends AbstractStepFactory<Global, Local>,
    Action<
      Promise<ExtractValuesByKey<Local, typeof resultKey>>,
      Global["input"] extends unknown ? undefined : Global["input"]
    > {
  isTrue(): ConditionDefaultCaseStepFactoryWithout<
    Condition,
    Omit<Global, "condition"> & Record<"condition", ExcludeFalsy<Condition>>,
    Local,
    "true",
    "isTrue"
  >;

  isFalse(): ConditionDefaultCaseStepFactoryWithout<
    Condition,
    Omit<Global, "condition"> & Record<"condition", ExcludeTruthy<Condition>>,
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
    DeepOmitByPath<Local, [K, typeof resultKey]> &
      Record<K, Record<N, T>> &
      Record<K, Record<typeof resultKey, T>>,
    K,
    E
  >;

  add<T, N extends string>(
    name: ValidateName<N, Local> | StepConfig<N, Local>,
    fn: ($: FormatScope<Global>) => Promise<T> | T
  ): ConditionDefaultCaseStepFactoryWithout<
    Condition,
    Overwrite<Global, N> & Record<N, Awaited<T>>,
    DeepOmitByPath<Local, [K, typeof resultKey]> &
      Record<K, Record<N, T>> &
      Record<K, Record<typeof resultKey, T>>,
    K,
    E
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

type MainConditionStepFactory<
  Condition,
  G extends Record<string, any> = {},
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
> = ConditionDefaultCaseStepFactory<Condition, G, Local, "", "add">;

export function $if<C, G extends Record<string, any> = {}>({
  condition,
  $
}: {
  condition: C;
  $?: G;
}) {
  return {} as MainConditionStepFactory<C, G>;
}
