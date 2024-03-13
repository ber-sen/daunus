import { runAction } from "../../run_action";
import { $action } from "../../daunus_action";
import { DaunusActionOptions, DaunusWorkflowAction } from "../../types";

const process = $action(
  { type: "process", skipParse: true },
  async (
    list: DaunusWorkflowAction<any>[],
    { ctx }: DaunusActionOptions<any>
  ) => {
    let res: any = null;

    for (const action of list) {
      res = await runAction(ctx, action);

      if (res.error) {
        return res.error;
      }
    }

    return res?.data || res.error;
  }
);

export default process;
