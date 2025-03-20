import { get } from "./get"
import { isWorkflowAction } from "./helpers"
import { type Ctx } from "./types"

const isNested = (path: string) => {
  const dotRegex = /\./g
  const matches = path.match(dotRegex)

  return matches && matches.length > 0
}

const getParent = (path: string) => path.split(".").slice(0, -1).join(".")

export const resolveAction = async <T>(ctx: Ctx, action: T, name?: string) => {
  if (isWorkflowAction(action)) {
    const { data, exception } = await executeAction(
      ctx,
      name ? { ...action, name } : action
    )

    return data || exception
  }

  return action
}

export const executeAction = async (
  ctx: Ctx,
  { type, params, name }: { type: string[]; name?: string; params?: any }
) => {
  const defaultActions = ctx.get(".defaultActions")

  let action: any =
    defaultActions[type[0]] ||
    (ctx.has(".daunus-workflow-actions-resolver")
      ? ctx.get(".daunus-workflow-actions-resolver")(type[0])
      : get(ctx.get(".daunus-workflow-actions"), type[0]))

  if (!action) {
    throw new Error("Action not found")
  }

  if (!ctx.has(".daunus-workflow-actions-resolver") && isNested(type[0])) {
    action = action.bind(
      get(ctx.get(".daunus-workflow-actions"), getParent(type[0]))
    )
  }

  return await action(params, { name }).execute(ctx)
}
