import { runAction } from "../../run_action";
import { tineAction } from "../../tine_action";
import { TineActionOptions, TineWorkflowAction } from "../../types";

const parallel = tineAction(
  { type: "parallel", skipParse: true },
  (list: TineWorkflowAction<any>[], { ctx }: TineActionOptions) => {
    const promises = list.map((item) =>
      runAction(ctx, item).then((item) => item.data ?? item.error)
    );

    return Promise.all(promises);
  }
);

export default parallel;
