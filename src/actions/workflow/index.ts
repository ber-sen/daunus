import { get } from '../../get';
import { tineAction } from '../../tineAction';
import { TineActionOptions, TineCtx } from '../../types';
import rpc from '../rpc';
import shape from '../shape';

const isNested = (path: string) => {
  const dotRegex = /\./g;
  const matches = path.match(dotRegex);
  return matches && matches.length > 1;
};

const getParent = (path: string) => path.split('.').slice(0, -1).join('.');

const runAction = async (
  ctx: TineCtx,
  {
    action: actionType,
    payload,
    name,
  }: { action: string; name?: string; payload?: any },
) => {
  let action =
    BASE_ACTIONS[actionType] ||
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

function isTopLevelAction<T extends Record<string, any>>(
  obj: T,
): obj is T & { action: string } {
  return 'action' in obj && typeof obj.action === 'string';
}

const workflow = tineAction(
  async (workflow: object, { ctx }: TineActionOptions) => {
    if (isTopLevelAction(workflow)) {
      return await runAction(ctx, workflow);
    }

    let res = null;

    for (const [name, { action, payload }] of Object.entries(workflow)) {
      res = await runAction(ctx, { action, name, payload });
    }

    return res;
  },
  { action: 'workflow', skipParse: true },
);

const BASE_ACTIONS = {
  shape,
  workflow,
  rpc,
};

export default workflow;
