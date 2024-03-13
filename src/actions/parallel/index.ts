import { runAction } from "../../run_action";
import { $action } from "../../daunus_action";
import { DaunusActionOptions, DaunusWorkflowAction } from "../../types";

const parallel = $action(
  { type: "parallel", skipParse: true },
  (list: DaunusWorkflowAction<any>[], { ctx }: DaunusActionOptions<any>) => {
    const promises = list.map((item) =>
      runAction(ctx, item).then((item) => item.data ?? item.error)
    );

    return Promise.all(promises);
  }
);

export default parallel;
