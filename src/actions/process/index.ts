import { runAction } from '../../runAction';
import { tineAction } from '../../tineAction';
import { TineActionOptions, TineWorkflowAction } from '../../types';

const process = tineAction(
  { type: 'process', skipParse: true },
  async (list: TineWorkflowAction<any>[], { ctx }: TineActionOptions) => {
    let res: any = null;

    for (const action of list) {
      res = await runAction(ctx, action);

      if (res.error) {
        return res.error;
      }
    }

    return res?.data || res.error;
  },
);

export default process;
