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

export interface StepFactory<
  G extends Record<string, any> = {},
  L extends Record<string, any> = {}
> {
  scope: Scope<FormatScope<G>, FormatScope<L>>;

  get<N extends keyof L>(
    name: N,
    scope?: Record<any, any>
  ): L[N] & { meta: { fs: () => any; name: string } };

  add(...params: any): any;

  run(): Promise<any>;
}

interface DefaultStepFactory<
  G extends Record<string, any> = {},
  L extends Record<string, any> = {},
  E = {},
  N extends keyof L | undefined = undefined
> extends StepFactory<G, L> {
  add<T extends DefaultStepFactory<any, any, any, any>, N extends string>(
    name: DisableSameName<N, L>,
    fn: ($: FormatScope<G>) => Promise<T> | T
  ): DefaultStepFactory<
    Overwrite<G, N> & Record<N, Awaited<ReturnType<T["run"]>>>,
    L & Record<N, T>,
    E,
    N
  > &
    E;

  add<T extends DaunusAction<any, any, any>, N extends string>(
    name: DisableSameName<N, L>,
    fn: ($: FormatScope<G>) => Promise<T> | T
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
    E,
    N
  > &
    E;

  add<T, N extends string>(
    name: DisableSameName<N, L>,
    fn: ($: FormatScope<G>) => Promise<T> | T
  ): DefaultStepFactory<
    Overwrite<G, N> & Record<N, Awaited<T>>,
    L & Record<N, T>,
    E,
    N
  > &
    E;

  run(): N extends string ? Promise<L[N]> : Promise<undefined>;
}

interface ParallelStepFactory<
  G extends Record<string, any> = {},
  L extends Record<string, any> = {},
  E = {}
> extends StepFactory<G, L> {
  add<T, N extends string>(
    name: DisableSameName<N, L>,
    fn: ($: FormatScope<G>) => Promise<T> | T
  ): ParallelStepFactory<G, L & Record<N, T>, E> & E;

  run(): Promise<FormatScope<L>>;
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

  function setOptions<T extends StepOptions>(
    options: T
  ): T["type"] extends "parallel"
    ? ParallelStepFactory<G, L, T["extend"]>
    : DefaultStepFactory<G, L, T["extend"], N> {
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

          if (isStepFactory(res)) {
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

        if (isStepFactory(value)) {
          value = await value.run();
        }

        scope.global = { ...scope.global, [name]: value };
        res.push(value);
      }

      return res.at(-1);
    }

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
    isTrue: <P extends StepOptions>(options?: P) => {
      return $steps(initialScope).setOptions({
        ...(options as P),
        extend: {
          isFalse: <P extends StepOptions>(options?: P) =>
            $steps(initialScope).setOptions(options as P)
        }
      });
    },
    isFalse: <P extends StepOptions>(options?: P) => {
      return $steps(initialScope).setOptions({
        ...(options as P),
        extend: {
          isTrue: <P extends StepOptions>(options?: P) =>
            $steps(initialScope).setOptions(options as P)
        }
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

const steps = $steps()
  .add("input", () => ({ name: "foo" }))

  .add("list", () => [1, 2, 3])

  .add("actionNoError", () => struct({ status: 500 }))

  // .add("error", () => exit({ status: 500 }))

  // .add("could have error", () =>
  //   Math.random() > 0.5 ? struct({ name: "asd" }) : exit({ status: 500 })
  // )

  .add("condition", ($) =>
    $if({ condition: $.input.name === "foo" }, $)
      .isTrue()

      .add("list", () => ["lorem", "ipsum", "dolor"] as const)

      .add("asdasd", ($) => 1)

      .isFalse()

      .add("asdasd2", ($) => $)

      .add("loop", ($) =>
        $loop({ list: $.list }, $)
          .iterate()

          .add("send slack message", ($) =>
            actions.trigger("takswish.slack.send_message", {
              channel: "#general",
              text: `#${$.item.value}`
            })
          )
      )
  );
