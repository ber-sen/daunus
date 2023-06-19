import { get } from '../../get';
import { tineAction } from '../../tineAction';
import { TineActionOptions } from '../../types';

import shape from '../shape';

const workflow = tineAction(
  async (payload: object, { ctx }: TineActionOptions) => {
    let res = null;

    for (const [name, actionDef] of Object.entries(payload)) {
      const action =
        BASE_ACTIONS[actionDef.action] ||
        get(ctx.get('.tine-workflow-actions'), actionDef.action);

      if (!action) {
        throw new Error('Action not found');
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
};

export default workflow;
