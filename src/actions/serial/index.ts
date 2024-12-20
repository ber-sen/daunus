import { runAction } from "../../run_action";
import { $action } from "../../daunus_action";
import { DaunusException, DaunusWorkflowAction } from "../../types";

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
      const successResuts: Array<any> = [];
      const errorResults: Array<any> = [];

      for (const action of actions) {
        const ares = await runAction(ctx, action);

        if (ares.data) {
          successResuts.push([action.name, ares.data ?? ares.exception]);
        }

        if (ares.data) {
          successResuts.push([action.name, ares.data ?? ares.exception]);
        }
      }

      if (successResuts.length === actions.length) {
        return Object.fromEntries(successResuts);
      }

      if (errorResults.length === actions.length) {
        return new DaunusException(500, {
          paths: Object.fromEntries(errorResults)
        });
      }

      return [
        Object.fromEntries(successResuts),
        new DaunusException(500, { paths: Object.fromEntries(errorResults) })
      ];
    }
);

export default serial;
