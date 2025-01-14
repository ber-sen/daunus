import { runAction } from "../../run_action"
import { $action } from "../../daunus_action"
import { type DaunusWorkflowAction } from "../../types"
import { Exception } from "../../daunus_exception"

const parallel = $action(
  { type: "parallel", skipParse: true },
  ({ ctx }) =>
    async ({
      actions
    }: {
      /**
       * Actions
       * @ref https://taskwish.ai/schema/actions.json
       */
      actions: DaunusWorkflowAction<any>[]
    }) => {
      const promises = actions.map((item) =>
        runAction(ctx, item).then((item) => {
          return [item.data, item.exception]
        })
      )

      const results = await Promise.all(promises)

      const successResults: Array<any> = []
      const errorResults: Array<any> = []

      for (const [index, action] of actions.entries()) {
        const [data, exception] = results[index]

        successResults.push([action.name, data])

        if (exception) {
          errorResults.push([action.name, exception])
        }
      }

      if (errorResults.length === 0) {
        return Object.fromEntries(successResults)
      }

      return [
        Object.fromEntries(successResults),
        new Exception({ paths: Object.fromEntries(errorResults) })
      ]
    }
)

export default parallel
