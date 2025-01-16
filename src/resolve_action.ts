import { isWorkflowAction } from "./helpers"
import { runAction } from "./run_action"
import { type Ctx } from "./types"

export const resolveAction = async <T>(ctx: Ctx, action: T, name?: string) => {
  if (isWorkflowAction(action)) {
    const { data, exception } = await runAction(
      ctx,
      name ? { ...action, name } : action
    )

    return data || exception
  }

  return action
}
