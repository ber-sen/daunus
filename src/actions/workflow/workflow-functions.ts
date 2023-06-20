import { get } from '../../get';
import { TineCtx } from '../../types';

const isNested = (path: string) => {
  const dotRegex = /\./g;
  const matches = path.match(dotRegex);
  return matches && matches.length > 1;
};

const getParent = (path: string) => path.split('.').slice(0, -1).join('.');

export const runAction = async (
  ctx: TineCtx,
  {
    action: actionType,
    payload,
    name,
  }: { action: string; name?: string; payload?: any },
  baseAction: object,
) => {
  let action =
    baseAction[actionType] ||
    get(ctx.get('.tine-workflow-actions'), actionType);

  if (!action) {
    throw new Error('Action not found');
  }

  if (isNested(actionType)) {
    action = action.bind(
      get(ctx.get('.tine-workflow-actions'), getParent(actionType)),
    );
  }

  return await action(payload, { name }).run(ctx);
};
