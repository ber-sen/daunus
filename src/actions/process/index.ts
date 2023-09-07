import { runAction } from '../workflow';

import { tineAction } from '../../tineAction';
import { TineActionOptions, TineWorkflowAction } from '../../types';
import { BASE_ACTIONS } from '../workflow/workflow-functions';

const process = tineAction(
  { type: 'process', skipParse: true },
  async (list: TineWorkflowAction<any>[], { ctx }: TineActionOptions) => {
    let res = null;

    for (const action of list) {
      res = await runAction(ctx, action, { ...BASE_ACTIONS, process });
    }

    return res;
  },
);

export default process;
