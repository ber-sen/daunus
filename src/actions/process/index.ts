import { runAction } from '../workflow';

import { tineAction } from '../../tineAction';
import { TineActionOptions, TineWorkflowAction } from '../../types';
import { BASE_ACTIONS } from '../workflow/workflow-functions';

const process = tineAction(
  { action: 'process', skipParse: true },
  async (list: TineWorkflowAction<any>[], { ctx }: TineActionOptions) => {
    let res = null;

    for (const { action, payload, name } of list) {
      res = await runAction(
        ctx,
        { action, name, payload },
        { ...BASE_ACTIONS, process },
      );
    }

    return res;
  },
);

export default process;
