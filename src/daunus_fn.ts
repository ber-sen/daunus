import { DaunusCtx, DaunusVar } from "./types";

export function $fn<R>(
  selector: (ctx: DaunusCtx) => R | Promise<R>
): DaunusVar<R> {
  const $fn = async (ctx: DaunusCtx) => {
    return await selector(ctx);
  };

  $fn.toString = () => `<% ${selector.toString()} %>`;
  $fn.toJSON = () => `<% ${selector.toString()} %>`;
  $fn.__type = "daunus_var";

  return $fn as any;
}
