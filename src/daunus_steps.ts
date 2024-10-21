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

interface StepFactory<
  G extends Record<string, any> = {},
  L extends Record<string, any> = {}
> {
  scope: Scope<G, L>;
  add<T extends StepFactory, N extends string>(
    name: N extends keyof L ? never : N,
    fn: ($: G) => T
    // fix
  ): StepFactory<G & Record<N, string>, L & Record<N, T>>;
  add<T extends DaunusAction<any, any, any>, N extends string>(
    name: N extends keyof L ? never : N,
    fn: ($: G) => T
  ): StepFactory<G & Record<N, DaunusInferReturn<T>>, L & Record<N, T>>;
  add<T, N extends string>(
    name: N extends keyof L ? never : N,
    fn: ($: G) => T
  ): StepFactory<G & Record<N, T>, L & Record<N, T>>;
  add<T, N extends string>(
    name: N extends keyof L ? never : N,
    fn: ($: G) => T,
    override?: boolean
  ): StepFactory<Omit<G, N> & Record<N, T>, L & Record<N, T>>;
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
        },
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
  A extends Array<any>,
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
      return $steps(initialScope).add(
        "condition",
        () => {
          // WIP
          return condition as Exclude<
            typeof condition,
            false | "" | undefined | null
          >;
        },
        true
      );
    },
    isFalse: () => {
      return $steps(initialScope).add(
        "condition",
        () => {
          // WIP
          return condition as Exclude<typeof condition, true | object | number>;
        },
        true
      );
    }
  };
}

let init: { name: string } | { trip: string };

const lorem = $steps()
  .add("init", () => init)
  .add("lorem", () => struct([1, 2, 3]))
  .add("lorem3", () => struct([1, 2, 3]))
  .add("lorem2", () => struct([1, 2, 3]))
  .add("sub1", ($) =>
    $steps($)
      .add("test", ($) => $.lorem)
      .add("test2", () => 3)
  )
  .add("condition66", () => struct("test"))
  .add("condition2", ($) =>
    $if({ condition: "name" in $.init && $.init }, $)
      .isTrue()
      .add("loop2", ($) =>
        $loop({ list: $.lorem.data }, $)
          .iterate()
          .add("ipsum", ($) => struct($.condition))
          .add("trip", ($) => struct($.item.value))
      )
  )
  .add("trip2", ($) => struct({ name: $.condition66 }))
  .add("condition3", ($) =>
    $if({ condition: "name" in $.init && $.init }, $)
      .isTrue()
      .add("loop2", ($) =>
        $loop({ list: $.lorem.data }, $)
          .iterate()
          .add("ipsum", ($) => struct($.condition))
          .add("trip", ($) => struct($.item.value))
      )
  )
  .add("condition5", ($) =>
    $if({ condition: "name" in $.init && $.init }, $)
      .isTrue()
      .add("loop2", ($) =>
        $loop({ list: $.lorem.data }, $)
          .iterate()
          .add("ipsum", ($) => struct($.condition))
          .add("trip", ($) => struct($.item.value))
      )
  )
  .add("condition", ($) =>
    $if({ condition: Boolean($.init) }, $)
      .isTrue()
      .add("loop", ($) =>
        $loop({ list: $.lorem.data }, $)
          .iterate()
          .add("ipsum", ($) => struct($.condition))
          .add("trip", ($) => struct($.item.value))
      )
  )

  .add("trip24", ($) => struct({ name: "ads" }));
