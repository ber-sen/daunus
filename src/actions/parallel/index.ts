import { runAction } from "../../run_action";
import { $action } from "../../daunus_action";
import { DaunusWorkflowAction } from "../../types";

const parallel = $action(
  { type: "parallel", skipParse: true },
  ({ ctx }) =>
    async ({
      actions
    }: {
      /**
       * Actions
       * @ref https://taskwish.vercel.app/schema/actions.json
       */
      actions: DaunusWorkflowAction<any>[];
    }) => {
      const promises = actions.map((item) =>
        runAction(ctx, item).then((item) => {
          if (item.exception) {
            throw item.exception;
          }

          return item.data;
        })
      );

      const res = await Promise.allSettled(promises);

      const rejected = res.find((item) => item.status === "rejected");

      if (rejected) {
        return rejected.status === "rejected" && rejected.reason;
      }

      return res.map((item) => item.status === "fulfilled" && item.value);
    }
);

export default parallel;
