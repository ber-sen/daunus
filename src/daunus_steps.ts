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
>({ itemName = "item" as I }: { list: L; itemName?: I }, initialScope?: S) {
  return $steps(initialScope).add(itemName!, () => {
    return { value: {} as any as keyof L, index: {} as number };
  });
}

const lorem = $steps()
  .add("lorem", () => struct([{ asd: true }, 2, 3]))
  .add("loop", ($) =>
    $loop({ list: $.lorem.data }, $)
      .add("ipsum", ($) => struct($.lorem.data))
      .add("trip", ($) => struct($.item.value))
  )
  .add("trip2", () => struct({ name: "test" }));
