import { $action } from "../../daunus_action";
import { DaunusCtx } from "../../types";

function isFunction<T>(
  param: T | ((ctx: DaunusCtx) => T)
): param is (ctx: DaunusCtx) => T {
  return typeof param === "function";
}

const struct = $action(
  {
    type: "struct"
  },
  ({ ctx }) =>
    <T>(params: T | ((ctx: DaunusCtx) => T)) =>
      isFunction(params) ? params(ctx) : params!
);

export default struct;
