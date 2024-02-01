import { tineAction } from "../../tine_action";
import { tineFn } from "../../tine_fn";
import { TineCtx } from "../../types";

const task = tineAction(
  {
    type: "task",
    parseResponse: true
  },
  <T>(params: (ctx: TineCtx) => Promise<T> | T) => tineFn(params)
);

export default task;
