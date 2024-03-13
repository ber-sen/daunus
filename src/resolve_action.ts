import { isAction } from "./helpers";
import { runAction } from "./run_action";
import { DaunusCtx } from "./types";

export const resolveAction = async <T>(
  ctx: DaunusCtx,
  action: T,
  name?: string
) => {
  if (isAction(action)) {
    await runAction(ctx, name ? { ...action, name } : action);
  }

  return action;
};
