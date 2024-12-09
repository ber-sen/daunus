import { runAction } from "../../run_action";
import { $action } from "../../daunus_action";
import { DaunusWorkflowAction } from "../../types";

const steps = $action(
  { type: "steps", skipParse: true },
  ({ ctx }) =>
    async (list: DaunusWorkflowAction<any>[]) => {
      let res: any = null;

      for (const action of list) {
        res = await runAction(ctx, action);

        if (res.exception) {
          return res.exception;
        }
      }

      return res?.data || res.error;
    }
);

export default steps;
