import { runAction } from "../../run_action";
import { $action } from "../../daunus_action";
import { DaunusWorkflowAction } from "../../types";

const serial = $action(
  { type: "serial", skipParse: true },
  ({ ctx }) =>
    async (list: DaunusWorkflowAction<any>[]) => {
      const res: Array<any> = [];

      for (const action of list) {
        const ares = await runAction(ctx, action);

        res.push(ares.data ?? ares.error);
      }

      return res;
    }
);

export default serial;
