import { runAction } from './workflow-functions';

import { isAction } from '../../helpers';
import { tineAction } from '../../tineAction';
import { TineActionOptions } from '../../types';
import condition from '../condition';
import rpc from '../rpc';
import shape from '../shape';

const workflow = tineAction(
  async (workflow: object, { ctx }: TineActionOptions) => {
    if (isAction(workflow)) {
      return await runAction(ctx, workflow, BASE_ACTIONS);
    }

    let res = null;

    for (const [name, { action, payload }] of Object.entries(workflow)) {
      res = await runAction(ctx, { action, name, payload }, BASE_ACTIONS);
    }

    return res;
  },
  { action: 'workflow', skipParse: true },
);

const BASE_ACTIONS = {
  shape,
  workflow,
  condition,
  rpc,
};

export default workflow;
