import { runAction } from "../../run_action";
import { $action } from "../../daunus_action";

type Action =
  | {
      type: string[];
      params: Action[] | object;
    }
  | object;

interface Workflow {
  name: string;
  id?: string;
  action?: {
    type: string[];
    params: Action;
  };
}

const workflow = $action(
  { type: "workflow", skipParse: true },
  ({ ctx }) =>
    async (params: Workflow) => {
      if (!params.action) {
        return undefined;
      }

      const res = await runAction(ctx, params.action);

      return res.data ?? res.error;
    }
);

export default workflow;
