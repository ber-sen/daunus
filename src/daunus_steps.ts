import { struct } from "./actions";
import {
  ResolveDaunusVarData,
  DaunusGetExceptions,
  DaunusAction
} from "./types";

type StepsContext<T extends Record<any, any>> = {
  [TKey in keyof T]: T[TKey] extends DaunusAction<infer R, any, any>
    ? { data: ResolveDaunusVarData<R>; exception: DaunusGetExceptions<R> }
    : T[TKey];
};

function $steps<S extends Record<string, any> = {}>(initialScope?: S) {
  const scope: S = initialScope || ({} as S);

  function add<T, N extends string>(name: N, fn: ($: StepsContext<S>) => T) {
    const result = fn(scope);

    return $steps<S & Record<N, T>>({
      ...scope,
      [name]: result
    });
  }

  function get<N extends keyof S>(name: N): S[N] {
    return scope[name];
  }

  return {
    scope,
    add,
    get
  };
}

function $loop<
  L extends Array<any>,
  I extends string = "item",
  S extends Record<string, any> = {}
>(
  { itemVariable = "item" as I }: { list: L; itemVariable?: I },
  initialScope?: S
) {
  return $steps(initialScope).add(itemVariable!, () => {
    return { value: {} as any as keyof L, index: {} as number };
  });
}

function $if<C, S extends Record<string, any> = {}>(
  { condition }: { condition: C },
  initialScope?: S
) {
  return {
    isTrue: () => {
      return $steps(initialScope).add("condition", () => {
        return condition as Exclude<
          typeof condition,
          false | "" | undefined | null
        >;
      });
    }
  };
}

let init: { name: string } | { trip: string };

const lorem = $steps()
  .add("init", () => init)
  .add("lorem", () => struct([{ asd: true }, 2, 3]))
  .add("condition", ($) =>
    $if({ condition: "name" in $.init && $.init }, $)
      .isTrue()
      .add("loop", ($) =>
        $loop({ list: $.lorem.data }, $)
          .add("ipsum", ($) => struct($.condition.name))
          .add("trip", ($) => struct($.item.value))
      )
  )
  .add("trip2", () => struct({ name: "test" }));
