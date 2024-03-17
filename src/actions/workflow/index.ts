import { runAction } from "../../run_action";
import { $action } from "../../daunus_action";
import { DaunusActionOptions } from "../../types";

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

const workflow = $action(
  { type: "workflow", skipParse: true },
  async (params: Workflow, { ctx }: DaunusActionOptions) => {
    if (!params.action) {
      return undefined;
    }

    const res = await runAction(ctx, params.action);

    return res.data ?? res.error;
  }
);

export default workflow;
