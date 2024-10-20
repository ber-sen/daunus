import { exit, struct } from "./actions";
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

export class $steps<S extends Record<string, any> = {}> {
  public __scope: S;

  constructor(scope?: S) {
    this.__scope = scope = {} as S;
  }

  add<T, N extends string>(name: N, fn: ($: StepsContext<S>) => T) {
    return new $steps<S & Record<N, T>>({
      ...(this.__scope || ({} as S)),
      [name]: fn(this.__scope || ({} as S))
    });
  }

  get<N extends keyof S>(name: N): S[N] {
    return this.__scope[name];
  }
}

export class $loop<S extends Record<string, any> = {}> {
  public __scope: S;
  private params: { list: Array<any>; itemName: string };

  constructor(
    { itemName = "item", list }: { list: Array<any>; itemName?: string },
    scope?: S
  ) {
    this.__scope = scope ?? ({} as S);
    this.params = { itemName, list };
  }

  add<T, N extends string>(name: N, fn: (defs: StepsContext<S>) => T) {
    return new $loop<S & Record<N, T>>(this.params, {
      ...(this.__scope || ({} as S)),
      [name]: fn(this.__scope || ({} as S))
    });
  }

  get<N extends keyof S>(name: N): S[N] {
    return this.__scope[name];
  }
}

export class $condition<S extends Record<string, any> = {}> {
  public __scope: S;
  private params: { list: Array<any>; itemName: string };

  constructor(
    { itemName = "item", list }: { list: Array<any>; itemName?: string },
    scope?: S
  ) {
    this.__scope = scope ?? ({} as S);
    this.params = { itemName, list };
  }

  add<T, N extends string>(name: N, fn: (defs: S) => T) {
    return new $loop<S & Record<N, T>>(this.params, {
      ...(this.__scope || ({} as S)),
      [name]: fn(this.__scope || ({} as S))
    });
  }

  get<N extends keyof S>(name: N): S[N] {
    return this.__scope[name];
  }
}

const lorem = new $steps()
  .add("lorem", () => struct([1, 2, 3]))
  .add("loop", ($) =>
    new $loop({ list: $.lorem.data, itemName: "item" }, $)
      .add("lorem2", ($) => exit({ status: 500, data: { name: "asdasd" } }))
      .add("ipsum", ($) => struct($.lorem2.exception.data))
  )
  .add("trip", () => struct({ name: "test" }));
