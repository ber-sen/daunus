import { runAction } from '../../runAction';
import { tineAction } from '../../tineAction';
import { TineActionOptions } from '../../types';

type Action =
  | {
      type: string[];
      params: Action[] | object;
    }
  | object;

interface Workflow {
  name: string;
  id?: string;
  trigger: {
    type: string[];
    name: string;
    params: object;
  };
  action?: {
    type: string[];
    params: Action;
  };
}

const workflow = tineAction(
  { type: 'workflow', skipParse: true },
  async (params: Workflow, { ctx }: TineActionOptions) => {
    if (!params.action) {
      return undefined;
    }

    return runAction(ctx, params.action);
  },
);

export default workflow;
