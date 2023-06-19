import { get } from '../../get';
import { tineAction } from '../../tineAction';
import { TineActionOptions } from '../../types';
import rpc from '../rpc';
import shape from '../shape';

const isNested = (path: string) => {
  const dotRegex = /\./g;
  const matches = path.match(dotRegex);
  return matches && matches.length > 1;
};

const getParent = (path: string) => path.split('.').slice(0, -1).join('.');

const workflow = tineAction(
  async (payload: object, { ctx }: TineActionOptions) => {
    let res = null;

    for (const [name, actionDef] of Object.entries(payload)) {
      let action =
        BASE_ACTIONS[actionDef.action] ||
        get(ctx.get('.tine-workflow-actions'), actionDef.action);

      if (!action) {
        throw new Error('Action not found');
      }

      if (!BASE_ACTIONS[actionDef.action] && isNested(actionDef.action)) {
        action = action.bind(
          get(ctx.get('.tine-workflow-actions'), getParent(actionDef.action)),
        );
      }

      res = await action(actionDef.payload, { name }).run(ctx);
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
