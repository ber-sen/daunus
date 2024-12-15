import { runAction } from "../../run_action";
import { $action } from "../../daunus_action";
import { DaunusWorkflowAction } from "../../types";

const steps = $action(
  { type: "steps", skipParse: true },
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
      let res: any = null;

      for (const action of actions) {
        res = await runAction(ctx, action);

        if (res.exception) {
          return res.exception;
        }
      }

      return res?.data ?? res.exception;
    }
);

export default steps;
