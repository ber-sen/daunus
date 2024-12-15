import { runAction } from "../../run_action";
import { $action } from "../../daunus_action";
import { DaunusWorkflowAction } from "../../types";

const serial = $action(
  { type: "serial", skipParse: true },
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
      const res: Array<any> = [];

      for (const action of actions) {
        const ares = await runAction(ctx, action);

        res.push(ares.data ?? ares.error);
      }

      return res;
    }
);

export default serial;
