import { struct } from "./actions";
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

export type FormatScope<T> = {
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
  scope: Scope<FormatScope<G>, FormatScope<L>>;

  get<N extends keyof L>(name: N): L[N];

  add(...params: any): any;

  run(): any;
}

interface DefaultStepFactory<
  G extends Record<string, any> = {},
  L extends Record<string, any> = {},
  N extends keyof L | undefined = undefined
> extends StepFactory<G, L> {
  add<T extends DefaultStepFactory<any, any, any>, N extends string>(
    name: DisableSameName<N, L>,
    fn: ($: FormatScope<G>) => T
  ): DefaultStepFactory<
    Overwrite<G, N> & Record<N, ReturnType<T["run"]>>,
    L & Record<N, T>,
    N
  >;

  add<T extends DaunusAction<any, any, any>, N extends string>(
    name: DisableSameName<N, L>,
    fn: ($: FormatScope<G>) => T
  ): DefaultStepFactory<
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
    L & Record<N, T>,
    N
  >;

  add<T, N extends string>(
    name: DisableSameName<N, L>,
    fn: ($: FormatScope<G>) => T
  ): DefaultStepFactory<Overwrite<G, N> & Record<N, T>, L & Record<N, T>, N>;

  run(): N extends string ? L[N] : undefined;
}

interface ParallelStepFactory<
  G extends Record<string, any> = {},
  L extends Record<string, any> = {}
> extends StepFactory<G, L> {
  add<T, N extends string>(
    name: DisableSameName<N, L>,
    fn: ($: FormatScope<G>) => T
  ): ParallelStepFactory<G, L & Record<N, T>>;

  run(): FormatScope<L>;
}

function toCamelCase(input: string): string {
  return input
    .replace(/[\s!,._-]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ""))
    .replace(/^[A-Z]/, (match) => match.toLowerCase());
}

function isStepFactory(obj: any): obj is StepFactory {
  return obj.scope instanceof Scope && typeof obj.run === "function";
}

export function $steps<
  G extends Record<string, any> = {},
  L extends Record<string, any> = {},
  N extends string = ""
>(
  initialScope?: Scope<G, L> | G
): DefaultStepFactory<G, L> & { setOptions: typeof setOptions } {
  const scope =
    initialScope instanceof Scope
      ? initialScope
      : new Scope<G, L>({ global: initialScope });

  function add<T, N extends string>(name: N, fn: ($: FormatScope<G>) => T) {
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

  function run() {
    if (!Object.keys(scope.local)?.at(-1)) {
      return undefined;
    }

    const lastStep = scope.local[Object.keys(scope.local).at(-1) as N];

    if (isStepFactory(lastStep)) {
      return lastStep.run();
    }

    return lastStep;
  }

  function setOptions<
    T extends "parallel" | "default",
    N extends string = ""
  >(options: {
    type: T;
  }): T extends "parallel"
    ? ParallelStepFactory<G, L>
    : DefaultStepFactory<G, L, N> {
    return { scope, run, add, get } as any;
  }

  return {
    setOptions,
    scope,
    run,
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
