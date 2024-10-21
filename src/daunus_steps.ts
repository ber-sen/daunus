import { DaunusInferReturn } from "../dist";
import { struct } from "./actions";
import { DaunusAction } from "./types";

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

type Prettify<T> = {
  [K in keyof T]: T[K];
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
    fn: ($: Prettify<G>) => T
    // fix
  ): StepFactory<Overwrite<G, N> & Record<N, string>, L & Record<N, T>>;

  add<T extends DaunusAction<any, any, any>, N extends string>(
    name: DisableSameName<N, L>,
    fn: ($: Prettify<G>) => T
  ): StepFactory<
    Overwrite<G, N> & Record<N, DaunusInferReturn<T>>,
    L & Record<N, T>
  >;

  add<T, N extends string>(
    name: DisableSameName<N, L>,
    fn: ($: Prettify<G>) => T
  ): StepFactory<Overwrite<G, N> & Record<N, T>, L & Record<N, T>>;

  get<N extends keyof L>(name: N): L[N];
}

function $steps<
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
          [name]: result
        } as Overwrite<G, N>,
        local: {
          ...scope.local,
          [name]: result
        }
      })
    );
  }

  function get<N extends keyof L>(name: N): L[N] {
    return scope.local[name];
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
        return { value: {} as any as keyof A, index: {} as number };
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

const steps = $steps()
  .add("input", () => ({ name: "foo" }))

  .add("list", () => [1, 2, 3])

  .add("condition", ($) =>
    $if({ condition: $.input.name === "foo" }, $)
      .isTrue()

      .add("list", () => [1, 2, 4] as const)

      .add("loop", ($) =>
        $loop({ list: $.list }, $)
          .iterate()

          .add("ipsum", ($) => struct($.condition))

          .add("trip", ($) => struct($.item.value))
      )
  );
