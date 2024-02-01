import { isAction } from "./helpers";
import { runAction } from "./run_action";
import { TineCtx } from "./types";

export const resolveAction = async <T>(
  ctx: TineCtx,
  action: T,
  name?: string
) => {
  if (isAction(action)) {
    await runAction(ctx, name ? { ...action, name } : action);
  }

  return action;
};
