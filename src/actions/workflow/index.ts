import { executeAction } from "../../execute-action"
import { $action } from "../../daunus-action"

type Action =
  | {
      type: string[]
      params: Action[] | object
    }
  | object

interface Workflow {
  name: string
  id?: string
  action?: {
    type: string[]
    params: Action
  }
}

const workflow = $action(
  { type: "workflow", skipParse: true },
  ({ ctx }) =>
    async (params: Workflow) => {
      if (!params.action) {
        return undefined
      }

      const res = await executeAction(ctx, params.action)

      return res.data ?? res.exception
    }
)

export default workflow
