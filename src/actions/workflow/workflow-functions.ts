import { get } from '../../get';
import { TineAction, TineCtx } from '../../types';

import condition from '../condition';
import rpc from '../rpc';
import shape from '../shape';
import response from '../response';
import process from '../process';

export const BASE_ACTIONS = {
  shape,
  condition,
  response,
  process,
  rpc,
};

const isNested = (path: string) => {
  const dotRegex = /\./g;
  const matches = path.match(dotRegex);

  return matches && matches.length > 0;
};

const getParent = (path: string) => path.split('.').slice(0, -1).join('.');

export const runAction = async (
  ctx: TineCtx,
  {
    action: actionType,
    payload,
    name,
  }: { action: [string]; name?: string; payload?: any },
  baseActions: Record<string, TineAction<any>> = BASE_ACTIONS,
) => {
  let action =
    baseActions[actionType[0]] ||
    (ctx.has('.tine-workflow-actions-resolver')
      ? ctx.get('.tine-workflow-actions-resolver')(actionType[0])
      : get(ctx.get('.tine-workflow-actions'), actionType[0]));

  if (!action) {
    throw new Error('Action not found');
  }

  if (!ctx.has('.tine-workflow-actions-resolver') && isNested(actionType[0])) {
    action = action.bind(
      get(ctx.get('.tine-workflow-actions'), getParent(actionType[0])),
    );
  }

  return await action(payload, { name }).run(ctx);
};
