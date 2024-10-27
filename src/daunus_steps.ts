import { struct } from "./actions";

interface Action<T extends string, R> {
  run: ((ctx?: Map<string, any>) => R) & { type: T };
}

type WorkflowBackoff = "constant" | "linear" | "exponential";

interface StepConfig {
  retries?: {
    limit: number;
    delay: string | number;
    backoff?: WorkflowBackoff;
  };
  timeout?: string | number;
}
class Scope<
  G extends Record<string, any> = {},
  L extends Record<string, any> = {}
> {
  public global: G;
  public local: L;

  constructor({ global, local }: { global?: G; local?: L }) {
    this.global = global ?? ({} as G);
    this.local = local ?? ({} as L);
  }
}

type ToCamelCase<T extends string> =
  T extends `${infer Left}${infer Delimiter}${infer Right}`
    ? Delimiter extends " " | "_" | "-" | "." | "," | "!"
      ? `${Left}${Capitalize<ToCamelCase<Right>>}`
      : `${Left}${ToCamelCase<`${Delimiter}${Right}`>}`
    : T;

type FormatExceptions<T> = {
  [K in keyof T as ToCamelCase<Extract<K, string>>]: T[K];
} & {};

export type NestedPretty<T> = {
  [K in keyof T]: NestedPretty<T[K]>;
} & {};

export type FormatScope<T> = {
  [K in keyof T as ToCamelCase<Extract<K, string>>]: K extends "exceptions"
    ? FormatExceptions<T[K]>
    : T[K];
} & {};

type Overwrite<G, N> = N extends keyof G ? Omit<G, N> : G;

type DisableSameName<N, L> = N extends keyof L ? never : N;

export interface StepFactory<
  G extends Record<string, any> = {},
  L extends Record<string, any> = {}
> {
  scope: Scope<FormatScope<G>, FormatScope<L>>;

  get(name: any, scope?: Record<any, any>): any;

  add(...params: any): any;
}

const resultKey: unique symbol = Symbol("resultKey");

interface DefaultStepFactory<
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

  // add<T extends DaunusAction<any, any, any>, N extends string>(
  //   name: DisableSameName<N, L>,
  //   fn: ($: FormatScope<G>) => Promise<T> | T
  // ): DefaultStepFactory<
  //   DaunusInferReturn<T>["data"] extends never
  //     ? DaunusInferReturn<T>["exception"] extends never
  //       ? Overwrite<G, N>
  //       : Overwrite<G, N> &
  //           Record<
  //             "exceptions",
  //             Record<N, DaunusInferReturn<T>["exception"] | undefined>
  //           >
  //     : DaunusInferReturn<T>["exception"] extends never
  //       ? Overwrite<G, N> & Record<N, DaunusInferReturn<T>["data"]>
  //       : Overwrite<G, N> &
  //           Record<N, DaunusInferReturn<T>["data"]> &
  //           Record<
  //             "exceptions",
  //             Record<N, DaunusInferReturn<T>["exception"] | undefined>
  //           >,
  //   L & Record<N, T>,
  //   E,
  //   N
  // > &
  //   E;

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

  get<N extends keyof L>(
    name: N,
    scope?: Record<any, any>
  ): L[N] & { meta: { fs: () => any; name: string } };
}

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

// type ExampleType = Record<
//   "name",
//   Record<"something", boolean> & Record<typeof resultKey, string>
// > &
//   Record<"lorem", Record<typeof resultKey, number>>;

// type Result = ExtractValuesByKey<ExampleType, typeof resultKey>;

// type DeepOmitResult = NestedFormat<
//   DeepOmitByPath<ExampleType, ["name", typeof resultKey]>
// >;

interface DefaultCaseStepFactory<
  C extends string,
  G extends Record<string, any> = {},
  L extends Record<any, any> = Record<C, Record<typeof resultKey, undefined>>
> extends StepFactory<G, L>,
    Action<"caseSteps", Promise<ExtractValuesByKey<L, typeof resultKey>>> {
  add<T extends Action<any, any>, N extends string>(
    name: DisableSameName<N, L>,
    options: StepConfig,
    fn: ($: FormatScope<G>) => Promise<T> | T
  ): DefaultCaseStepFactory<
    C,
    Overwrite<G, N> & Record<N, Awaited<ReturnType<T["run"]>>>,
    Omit<L, typeof resultKey> & Record<N, T> & Record<typeof resultKey, T>
  >;

  add<T extends Action<any, any>, N extends string>(
    name: DisableSameName<N, L>,
    fn: ($: FormatScope<G>) => Promise<T> | T
  ): DefaultCaseStepFactory<
    C,
    Overwrite<G, N> & Record<N, Awaited<ReturnType<T["run"]>>>,
    Omit<L, typeof resultKey> & Record<N, T> & Record<typeof resultKey, T>
  >;

  add<T, N extends string>(
    name: DisableSameName<N, L>,
    options: StepConfig,
    fn: ($: FormatScope<G>) => Promise<T> | T
  ): DefaultCaseStepFactory<
    C,
    Overwrite<G, N> & Record<N, Awaited<T>>,
    Omit<L, typeof resultKey> & Record<N, T> & Record<typeof resultKey, T>
  >;

  add<T, N extends string>(
    name: DisableSameName<N, L>,
    fn: ($: FormatScope<G>) => Promise<T> | T
  ): DefaultCaseStepFactory<
    C,
    Overwrite<G, N> & Record<N, Awaited<T>>,
    Omit<L, typeof resultKey> & Record<N, T> & Record<typeof resultKey, T>
  >;

  get<N extends keyof L>(
    name: N,
    scope?: Record<any, any>
  ): StepFactory<G, L[N]>;
}

// const a = {} as CaseStepFactory<
//   "true",
//   {},
//   Record<"false", Record<typeof resultKey, number>> &
//     Record<"false", Record<"lorem", number>> &
//     Record<"true", Record<typeof resultKey, boolean>> &
//     Record<"true", Record<"trip", boolean>>
// >;

// a.get("true").get("trip")

// a.run()

interface ParallelStepFactory<
  G extends Record<string, any> = {},
  L extends Record<string, any> = {}
> extends StepFactory<G, L>,
    Action<"steps.parallel", FormatScope<L>> {
  add<T, N extends string>(
    name: DisableSameName<N, L>,
    fn: ($: FormatScope<G>) => Promise<T> | T
  ): ParallelStepFactory<G, L & Record<N, T>>;

  get<N extends keyof L>(
    name: N,
    scope?: Record<any, any>
  ): L[N] & { meta: { fs: () => any; name: string } };
}

interface StepOptions {
  type?: "default" | "parallel" | "serial";
  extend?: {};
}

function toCamelCase(input: string): string {
  return input
    .replace(/[\s!,._-]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ""))
    .replace(/^[A-Z]/, (match) => match.toLowerCase());
}

function isAction<T extends string>(obj: any): obj is Action<T, any> {
  return obj && typeof obj.run === "function" && obj.run.type;
}

export function $steps<
  G extends Record<string, any> = {},
  L extends Record<string, any> = {}
>(
  initialScope?: Scope<G, L> | G
): DefaultStepFactory<G, L> & { setOptions: typeof setOptions } {
  const scope =
    initialScope instanceof Scope
      ? initialScope
      : new Scope<G, L>({ global: initialScope });

  function setOptions<T extends StepOptions>(
    options: T
  ): T["type"] extends "parallel"
    ? ParallelStepFactory<G, L>
    : DefaultStepFactory<G, L> {
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

      return $steps(
        new Scope({
          global: scope.global,
          local: {
            ...scope.local,
            [toCamelCase(name)]: result
          }
        })
      ).setOptions(options);
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

      if (options.type === "parallel") {
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

      for (const [name, action] of Object.entries(scope.local)) {
        let value = await action(scope.global);

        if (isAction(value)) {
          value = await value.run();
        }

        scope.global = { ...scope.global, [name]: value };
        res.push(value);
      }

      return res.at(-1);
    }

    run.type = options.type === "parallel" ? "steps.parallel" : "steps";

    return { scope, run, add, get } as any;
  }

  return { ...setOptions({ type: "default" }), setOptions };
}

function $loop<
  A extends Array<any> | readonly any[],
  I extends string = "item",
  G extends Record<string, any> = {}
>(
  { itemVariable = "item" as I }: { list: A; itemVariable?: I },
  initialScope?: G
) {
  return {
    forEachItem: () =>
      $steps(initialScope).add(itemVariable, () => {
        return {
          value: {} as any as A[number],
          index: {} as number
        };
      })
  };
}

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

const actions = {
  trigger: (type: string, params: any) => {
    return struct(params);
  }
};

const steps = $steps()
  .add("input", () => ({ name: "foo" }))

  .add("list", () => [1, 2, 3]);

// .add("actionNoError", () => struct({ status: 500 }))

// .add("error", () => exit({ status: 500 }))

// .add("could have error", () =>
//   Math.random() > 0.5 ? struct({ name: "asd" }) : exit({ status: 500 })
// )

// .add("condition", ($) =>
//   $if({ condition: $.input.name === "foo" }, $)
//     .isTrue()

//     .add("list", () => ["lorem", "ipsum", "dolor"] as const)

//     .add("asdasd", ($) => $.list)

//     .isFalse()

//     .add("asda", ($) => true as const)
// )

// .add("asdasd2", ($) => $.condition);

// .add("loop", ($) =>
//   $loop({ list: $.list }, $)
//     .forEachItem()

//     .add("send slack message", ($) =>
//       actions.trigger("takswish.slack.send_message@credentials", {
//         channel: "#general",
//         text: `#${$.item.value}`
//       })
//     )
// )
