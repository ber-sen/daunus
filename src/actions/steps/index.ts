import { runAction } from "../../run-action"
import { $action } from "../../daunus-action"
import { type WorkflowAction } from "../../types"
import { Exception } from "../../daunus-exception"

const steps = $action(
  { type: "steps", skipParse: true },
  ({ ctx }) =>
    async ({
      steps,
      continueOnError,
      stepsType = "sequential"
    }: {
      /**
       * Steps
       * @ref https://taskwish.ai/schema/steps.json
       */
      steps: WorkflowAction<any>[]
      continueOnError?: boolean,
      stepsType?: "sequential" | "parallel" | "serial"
    }) => {
      if (stepsType === "parallel") {
        const promises = steps.map((item) =>
          runAction(ctx, item).then((item) => {
            return [item.data, item.exception]
          })
        )

        const results = await Promise.all(promises)

        const successResults: Array<any> = []
        const errorResults: Array<any> = []

        for (const [index, action] of steps.entries()) {
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

      if (stepsType === "serial") {
        const successResuts: Array<any> = []
        const errorResults: Array<any> = []

        for (const action of steps) {
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

      let res: any = null

      for (const action of steps) {
        res = await runAction(ctx, action)

        if (res.exception && !continueOnError) {
          return res.exception
        }
      }

      return res?.data ?? res.exception
    }
)

export default steps
