import { isWorkflowAction } from "./helpers"
import { runAction } from "./run_action"
import { type DaunusCtx } from "./types"

export const resolveAction = async <T>(
  ctx: DaunusCtx,
  action: T,
  name?: string
) => {
  if (isWorkflowAction(action)) {
    const { data, exception } = await runAction(
      ctx,
      name ? { ...action, name } : action
    )

    return data || exception
  }

  return action
}
