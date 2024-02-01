import { runAction } from "../../run_action";
import { tineAction } from "../../tine_action";
import { TineActionOptions } from "../../types";

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
  { type: "workflow", skipParse: true },
  async (params: Workflow, { ctx }: TineActionOptions) => {
    if (!params.action) {
      return undefined;
    }

    const res = await runAction(ctx, params.action);

    return res.data ?? res.error;
  }
);

export default workflow;
