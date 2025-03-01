import { runAction } from "../../run-action"
import { $action } from "../../daunus-action"
import { type WorkflowAction } from "../../types"
import { Exception } from "../../daunus-exception"

const serial = $action(
  { type: "serial", skipParse: true },
  ({ ctx }) =>
    async ({
      actions
    }: {
      /**
       * Actions
       * @ref https://taskwish.ai/schema/actions.json
       */
      actions: WorkflowAction<any>[]
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
        new Exception({ paths: Object.fromEntries(errorResults) })
      ]
    }
)

export default serial
