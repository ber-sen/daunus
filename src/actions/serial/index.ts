import { runAction } from '@/runAction';

import { tineAction } from '../../tineAction';
import { TineActionOptions, TineWorkflowAction } from '../../types';

const serial = tineAction(
  { type: 'serial', skipParse: true },
  async (list: TineWorkflowAction<any>[], { ctx }: TineActionOptions) => {
    const res: Array<any> = [];

    for (const action of list) {
      const data = await runAction(ctx, action);

      res.push(data);
    }

    return res;
  },
);

export default serial;
