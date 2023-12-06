import { runAction } from '../../runAction';
import { tineAction } from '../../tineAction';
import { TineActionOptions, TineWorkflowAction } from '../../types';

const parallel = tineAction(
  { type: 'parallel', skipParse: true },
  async (list: TineWorkflowAction<any>[], { ctx }: TineActionOptions) => {
    const promises = list.map((item) => runAction(ctx, item));

    return Promise.all(promises);
  },
);

export default parallel;
