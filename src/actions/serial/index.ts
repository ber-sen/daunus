import { runAction } from "../../run_action"
import { $action } from "../../daunus_action"
import { DaunusException, DaunusWorkflowAction } from "../../types"

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
      actions: DaunusWorkflowAction<any>[]
    }) => {
      const successResuts: Array<any> = []
      const errorResults: Array<any> = []

      for (const action of actions) {
        const { data, exception } = await runAction(ctx, action)

        successResuts.push([action.name, data])

        if (exception) {
          errorResults.push([action.name, exception])
        }
      }

      if (errorResults.length === 0) {
        return Object.fromEntries(successResuts)
      }

      return [
        Object.fromEntries(successResuts),
        new DaunusException({ paths: Object.fromEntries(errorResults) })
      ]
    }
)

export default serial
