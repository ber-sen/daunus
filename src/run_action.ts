import { get } from "./get";
import { TineCtx } from "./types";

const isNested = (path: string) => {
  const dotRegex = /\./g;
  const matches = path.match(dotRegex);

  return matches && matches.length > 0;
};

const getParent = (path: string) => path.split(".").slice(0, -1).join(".");

export const runAction = async (
  ctx: TineCtx,
  { type, params, name }: { type: string[]; name?: string; params?: any }
) => {
  const defaultActions = ctx.get(".defaultActions");

  let action: any =
    defaultActions[type[0]] ||
    (ctx.has(".tine-workflow-actions-resolver")
      ? ctx.get(".tine-workflow-actions-resolver")(type[0])
      : get(ctx.get(".tine-workflow-actions"), type[0]));

  if (!action) {
    throw new Error("Action not found");
  }

  if (!ctx.has(".tine-workflow-actions-resolver") && isNested(type[0])) {
    action = (action as any).bind(
      get(ctx.get(".tine-workflow-actions"), getParent(type[0]))
    );
  }

  return await action(params, { name }).run(ctx);
};
