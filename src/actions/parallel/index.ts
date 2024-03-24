import { runAction } from "../../run_action";
import { $action } from "../../daunus_action";
import { DaunusWorkflowAction } from "../../types";

const parallel = $action(
  { type: "parallel", skipParse: true },
  ({ ctx }) =>
    (list: DaunusWorkflowAction<any>[]) => {
      const promises = list.map((item) =>
        runAction(ctx, item).then((item) => item.data ?? item.error)
      );

      return Promise.all(promises);
    }
);

export default parallel;
