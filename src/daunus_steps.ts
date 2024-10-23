import { exit, struct } from "./actions";
import { DaunusAction, DaunusInferReturn } from "./types";

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

type FormatGlobalScope<T> = {
  [K in keyof T as ToCamelCase<Extract<K, string>>]: K extends "exceptions"
    ? FormatExceptions<T[K]>
    : T[K];
} & {};

type Overwrite<G, N> = N extends keyof G ? Omit<G, N> : G;

type DisableSameName<N, L> = N extends keyof L ? never : N;

interface StepFactory<
  G extends Record<string, any> = {},
  L extends Record<string, any> = {}
> {
  scope: Scope<G, L>;

  add<T extends StepFactory, N extends string>(
    name: DisableSameName<N, L>,
    fn: ($: FormatGlobalScope<G>) => T
    // fix
  ): StepFactory<Overwrite<G, N> & Record<N, string>, L & Record<N, T>>;

  add<T extends DaunusAction<any, any, any>, N extends string>(
    name: DisableSameName<N, L>,
    fn: ($: FormatGlobalScope<G>) => T
  ): StepFactory<
    DaunusInferReturn<T>["data"] extends never
      ? DaunusInferReturn<T>["exception"] extends never
        ? Overwrite<G, N>
        : Overwrite<G, N> &
            Record<
              "exceptions",
              Record<N, DaunusInferReturn<T>["exception"] | undefined>
            >
      : DaunusInferReturn<T>["exception"] extends never
        ? Overwrite<G, N> & Record<N, DaunusInferReturn<T>["data"]>
        : Overwrite<G, N> &
            Record<N, DaunusInferReturn<T>["data"]> &
            Record<
              "exceptions",
              Record<N, DaunusInferReturn<T>["exception"] | undefined>
            >,
    L & Record<N, T>
  >;

  add<T, N extends string>(
    name: DisableSameName<N, L>,
    fn: ($: FormatGlobalScope<G>) => T
  ): StepFactory<Overwrite<G, N> & Record<N, T>, L & Record<N, T>>;

  get<N extends keyof L>(name: N): L[N];
}

function toCamelCase(input: string): string {
  return input
    .replace(/[\s!,._-]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ""))
    .replace(/^[A-Z]/, (match) => match.toLowerCase());
}

export function $steps<
  G extends Record<string, any> = {},
  L extends Record<string, any> = {}
>(initialScope?: Scope<G, L> | G): StepFactory<G, L> {
  const scope =
    initialScope instanceof Scope
      ? initialScope
      : new Scope<G, L>({ global: initialScope });

  function add<T, N extends string>(name: N, fn: ($: G) => T) {
    const result = fn(scope.global);

    return $steps(
      new Scope({
        global: {
          ...scope.global,
          [toCamelCase(name)]: result
        } as Overwrite<G, N>,
        local: {
          ...scope.local,
          [toCamelCase(name)]: result
        }
      })
    );
  }

  function get<N extends keyof L>(name: Extract<N, string>): L[N] {
    return scope.local[toCamelCase(name)];
  }

  return {
    scope,
    add,
    get
  };
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
    iterate: () =>
      $steps(initialScope).add(itemVariable, () => {
        return {
          value: {} as any as A[number],
          index: {} as number
        };
      })
  };
}

function $if<C, G extends Record<string, any> = {}>(
  { condition }: { condition: C },
  initialScope?: G
) {
  return {
    isTrue: () => {
      return $steps(initialScope).add("condition", () => {
        // WIP
        return condition as Exclude<
          typeof condition,
          false | "" | undefined | null
        >;
      });
    },
    isFalse: () => {
      return $steps(initialScope).add("condition", () => {
        // WIP
        return condition as Exclude<typeof condition, true | object | number>;
      });
    }
  };
}

const credentials = {
  get: (name: string) => {
    return struct({ API_KEY: "asda" });
  }
};

const actions = {
  trigger: (type: string, params: any, credentials?: any) => {
    return struct(params);
  }
};

// const steps = $steps()
//   .add("input", () => ({ name: "foo" }))

//   .add("list", () => [1, 2, 3])

//   .add("actionNoError", () => struct({ status: 500 }))

//   .add("error", () => exit({ status: 500 }))

//   .add("could have error", () =>
//     Math.random() > 0.5 ? struct({ name: "asd" }) : exit({ status: 500 })
//   )

//   .add("condition", ($) =>
//     $if({ condition: $.input.name === "foo" }, $)
//       .isTrue()

//       .add("list", () => ["lorem", "ipsum", "dolor"] as const)

//       .add("asdasd", ($) => $.exceptions.couldHaveError?.data)

//       .add("loop", ($) =>
//         $loop({ list: $.list }, $)
//           .iterate()

//           .add("send slack message", ($) =>
//             actions.trigger("takswish.slack.send_message", {
//               channel: "#general",
//               text: `#${$.item.value}`
//             })
//           )
//       )
//   );
