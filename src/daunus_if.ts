import {
  AbstractStepFactory,
  Action,
  StepConfig,
  StepFactory,
  resultKey
} from "./new_types";
import { DisableSameName, FormatScope, Overwrite } from "./type_helpers";

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

type OverwriteLocal<T, L extends Record<any, any>> = {
  [K in keyof T]: T[K] extends (
    options: any
  ) => DefaultCaseStepFactory<any, any, any, any>
    ? ReturnType<T[K]> extends DefaultCaseStepFactory<
        infer C,
        infer G,
        any,
        infer E
      >
      ? () => DefaultCaseStepFactory<C, G, L, E>
      : T[K]
    : T[K];
};

interface DefaultCaseStepFactory<
  C extends string,
  G extends Record<string, any> = {},
  L extends Record<any, any> = Record<C, Record<typeof resultKey, undefined>>,
  E extends {} = {}
> extends AbstractStepFactory<G, L>,
    Action<"caseSteps", Promise<ExtractValuesByKey<L, typeof resultKey>>> {
  add<T extends Action<any, any>, N extends string>(
    name: DisableSameName<N, L>,
    options: StepConfig,
    fn: ($: FormatScope<G>) => Promise<T> | T
  ): DefaultCaseStepFactory<
    C,
    Overwrite<G, N> & Record<N, Awaited<ReturnType<T["run"]>>>,
    DeepOmitByPath<L, [C, typeof resultKey]> &
      Record<C, Record<N, T>> &
      Record<C, Record<typeof resultKey, T>>,
    E
  > &
    OverwriteLocal<
      E,
      DeepOmitByPath<L, [C, typeof resultKey]> &
        Record<C, Record<N, T>> &
        Record<C, Record<typeof resultKey, T>>
    >;

  add<T extends Action<any, any>, N extends string>(
    name: DisableSameName<N, L>,
    fn: ($: FormatScope<G>) => Promise<T> | T
  ): DefaultCaseStepFactory<
    C,
    Overwrite<G, N> & Record<N, Awaited<ReturnType<T["run"]>>>,
    DeepOmitByPath<L, [C, typeof resultKey]> &
      Record<C, Record<N, T>> &
      Record<C, Record<typeof resultKey, T>>,
    E
  > &
    OverwriteLocal<
      E,
      DeepOmitByPath<L, [C, typeof resultKey]> &
        Record<C, Record<N, T>> &
        Record<C, Record<typeof resultKey, T>>
    >;

  add<T, N extends string>(
    name: DisableSameName<N, L>,
    options: StepConfig,
    fn: ($: FormatScope<G>) => Promise<T> | T
  ): DefaultCaseStepFactory<
    C,
    Overwrite<G, N> & Record<N, Awaited<T>>,
    DeepOmitByPath<L, [C, typeof resultKey]> &
      Record<C, Record<N, T>> &
      Record<C, Record<typeof resultKey, T>>,
    E
  > &
    OverwriteLocal<
      E,
      DeepOmitByPath<L, [C, typeof resultKey]> &
        Record<C, Record<N, T>> &
        Record<C, Record<typeof resultKey, T>>
    >;

  add<T, N extends string>(
    name: DisableSameName<N, L>,
    fn: ($: FormatScope<G>) => Promise<T> | T
  ): DefaultCaseStepFactory<
    C,
    Overwrite<G, N> & Record<N, Awaited<T>>,
    DeepOmitByPath<L, [C, typeof resultKey]> &
      Record<C, Record<N, T>> &
      Record<C, Record<typeof resultKey, T>>,
    E
  > &
    OverwriteLocal<
      E,
      DeepOmitByPath<L, [C, typeof resultKey]> &
        Record<C, Record<N, T>> &
        Record<C, Record<typeof resultKey, T>>
    >;

  get<N extends keyof L>(
    name: N,
    scope?: Record<any, any>
  ): StepFactory<G, L[N]> & { meta: { fs: () => any; name: string } };
}

interface ConditionStepFactory<
  G extends Record<string, any> = {},
  L extends Record<any, any> = Record<
    "true",
    Record<typeof resultKey, undefined>
  > &
    Record<"false", Record<typeof resultKey, undefined>>
> extends Action<"condition", undefined> {
  isTrue(): DefaultCaseStepFactory<
    "true",
    G,
    L,
    { isFalse: () => DefaultCaseStepFactory<"false", G, L> }
  >;
  isFalse(): DefaultCaseStepFactory<
    "false",
    G,
    L,
    { isTrue: () => DefaultCaseStepFactory<"true", G, L> }
  >;
}

const a = {} as ConditionStepFactory;

a.isTrue()
  .add("lorem", () => [1, 2, 3])
  .add("asdadasd", ($) => [1])
  .isFalse()
  .add("trip", () => true)
  .run();

// function $loop<
//   A extends Array<any> | readonly any[],
//   I extends string = "item",
//   G extends Record<string, any> = {}
// >(
//   { itemVariable = "item" as I }: { list: A; itemVariable?: I },
//   initialScope?: G
// ) {
//   return {
//     forEachItem: () =>
//       $steps(initialScope).add(itemVariable, () => {
//         return {
//           value: {} as any as A[number],
//           index: {} as number
//         };
//       })
//   };
// }

// function $if<C, G extends Record<string, any> = {}>(
//   { condition }: { condition: C },
//   initialScope?: G
// ) {
//   return {
//     isTrue: () => {
//       return $steps<G, {}, "condition">(initialScope).setOptions({
//         extend: {
//           isFalse: () =>
//             $steps<G, {}, "condition">(initialScope).setOptions({
//               type: "default"
//             })
//         }
//       });
//     },
//     isFalse: () => {
//       return $steps<G, {}, "condition">(initialScope).setOptions({
//         extend: {
//           isTrue: () =>
//             $steps<G, {}, "condition">(initialScope).setOptions({
//               type: "default"
//             })
//         }
//       });
//     }
//   };
// }

// const actions = {
//   trigger: (type: string, params: any) => {
//     return struct(params);
//   }
// };

// const steps = $steps()
//   .add("input", () => ({ name: "foo" }))

//   .add("list", () => [1, 2, 3])

//   .add("could have error", ($) => $.list)

//   .add("condition", ($) =>
//     $if({ condition: $.input.name === "foo" }, $)
//       .isTrue()

//       .add("list", () => ["lorem", "ipsum", "dolor"] as const)

//       .add("asdasd", ($) => $.list)

//       .isFalse()

//       .add("asda", ($) => true as const)
//   )

//   // .add("asdasd2", ($) => $.condition);

//   .add("loop", ($) =>
//     $loop({ list: $.list }, $)
//       .forEachItem()

//       .add("send slack message", ($) =>
//         actions.trigger("takswish.slack.send_message@credentials", {
//           channel: "#general",
//           text: `#${$.item.value}`
//         })
//       )
//   );
