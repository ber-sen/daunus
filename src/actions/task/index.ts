import { $action } from "../../daunus_action";
import { $fn } from "../../daunus_fn";
import { DaunusCtx } from "../../types";

const task = $action(
  {
    type: "task",
    parseResponse: true
  },
  () =>
    <T>(params: (ctx: DaunusCtx) => Promise<T> | T) =>
      $fn(params)
);

export default task;
