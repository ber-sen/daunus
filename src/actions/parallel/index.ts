import { runAction } from "../../run_action";
import { $action } from "../../daunus_action";
import { DaunusException, DaunusWorkflowAction } from "../../types";

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

      const results = await Promise.allSettled(promises);

      const values = actions.map((item, index) => {
        const result = results[index];

        return [
          item.name,
          result.status === "fulfilled" ? result.value : result.reason
        ];
      });

      const successResuts = values.filter(
        (item) => !(item[1] instanceof DaunusException)
      );

      if (successResuts.length === results.length) {
        return Object.fromEntries(successResuts);
      }

      const errorResults = values.filter(
        (item) => item[1] instanceof DaunusException
      );

      if (errorResults.length === results.length) {
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

export default parallel;
