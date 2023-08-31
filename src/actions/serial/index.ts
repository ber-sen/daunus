import { runAction } from '../workflow';

import { tineAction } from '../../tineAction';
import { TineActionOptions, TineWorkflowAction } from '../../types';
import { BASE_ACTIONS } from '../workflow/workflow-functions';

const serial = tineAction(
  { action: 'serial', skipParse: true },
  async (list: TineWorkflowAction<any>[], { ctx }: TineActionOptions) => {
    let res = [];

    for (const { action, payload, name } of list) {
      res.push(
        await runAction(
          ctx,
          { action, name, payload },
          { ...BASE_ACTIONS, serial },
        ),
      );
    }

    return res;
  },
);

export default serial;
