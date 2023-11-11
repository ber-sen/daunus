import { get } from '../../get';
import { TineAction, TineCtx } from '../../types';

import condition from '../condition';
import rpc from '../rpc';
import shape from '../shape';
import response from '../response';
import process from '../process';
import parallel from '../parallel';
import serial from '../serial';

export const BASE_ACTIONS = {
  shape,
  condition,
  response,
  parallel,
  process,
  serial,
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
  { type, params, name }: { type: [string]; name?: string; params?: any },
  baseActions: Record<string, TineAction<any>> = BASE_ACTIONS,
) => {
  let action =
    baseActions[type[0]] ||
    (ctx.has('.tine-workflow-actions-resolver')
      ? ctx.get('.tine-workflow-actions-resolver')(type[0])
      : get(ctx.get('.tine-workflow-actions'), type[0]));

  if (!action) {
    throw new Error('Action not found');
  }

  if (!ctx.has('.tine-workflow-actions-resolver') && isNested(type[0])) {
    action = action.bind(
      get(ctx.get('.tine-workflow-actions'), getParent(type[0])),
    );
  }

  return await action(params, { name }).run(ctx);
};
