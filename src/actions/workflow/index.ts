import { runAction } from './workflow-functions';

import { isAction } from '../../helpers';
import { tineAction } from '../../tineAction';
import { TineActionOptions } from '../../types';

const workflow = tineAction(
  { type: 'workflow', skipParse: true },
  async (workflow: object, { ctx }: TineActionOptions) => {
    if (isAction(workflow)) {
      return await runAction(ctx, workflow);
    }

    let res = null;

    for (const [name, { type, params }] of Object.entries(workflow)) {
      res = await runAction(ctx, { type, name, params });
    }

    return res;
  },
);

export default workflow;
export { runAction } from './workflow-functions';
