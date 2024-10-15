import { runAction } from "../../run_action";
import { $action } from "../../daunus_action";
import { DaunusWorkflowAction } from "../../types";
import { DaunusActionWithOptions } from "../../../dist";

const map = $action(
  { type: "map", skipParse: true },
  ({ ctx }) =>
    async <T>({
      list,
      action,
      itemName = "item"
    }: {
      list: Array<any>;
      action: DaunusWorkflowAction<T> | DaunusActionWithOptions<T, unknown, {}>;
      itemName?: string;
    }) => {
      const res = list.map(async (item) => {
        ctx.set(itemName, item);

        const res =
          "run" in action
            ? await action.run(ctx)
            : await runAction(ctx, action);

        if (res.exception) {
          return res.exception;
        }

        return res.data;
      });

      return (await Promise.all(res)) as Array<T>;
    }
);

export default map;
