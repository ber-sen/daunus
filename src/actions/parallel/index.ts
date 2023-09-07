import { runAction } from '../workflow';

import { tineAction } from '../../tineAction';
import { TineActionOptions, TineWorkflowAction } from '../../types';
import { BASE_ACTIONS } from '../workflow/workflow-functions';

const parallel = tineAction(
  { type: 'parallel', skipParse: true },
  async (list: TineWorkflowAction<any>[], { ctx }: TineActionOptions) => {
    const promises = list.map((item) =>
      runAction(ctx, item, { ...BASE_ACTIONS, parallel }),
    );

    return Promise.all(promises);
  },
);

export default parallel;
