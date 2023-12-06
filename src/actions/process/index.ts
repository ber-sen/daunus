import { runAction } from '@/runAction';

import { tineAction } from '../../tineAction';
import { TineActionOptions, TineWorkflowAction } from '../../types';

const process = tineAction(
  { type: 'process', skipParse: true },
  async (list: TineWorkflowAction<any>[], { ctx }: TineActionOptions) => {
    let res = null;

    for (const action of list) {
      res = await runAction(ctx, action);
    }

    return res;
  },
);

export default process;
