import { DaunusCtx, DaunusQuery } from "./types";
import { get } from "./get";

export function $query<R>(selector: ($: any) => R | Promise<R>): DaunusQuery<R> {
  const $query = async (ctx: DaunusCtx) => {
    const $ = new Proxy(ctx, {
      get(target, name) {
        return get(target, name as string);
      }
    });

    return await selector($);
  };

  $query.toString = () => `{{ ${selector.toString()} }}`;
  $query.toJSON = () => `{{ ${selector.toString()} }}`;

  $query.__type = "daunus_query";

  return $query as any;
}
