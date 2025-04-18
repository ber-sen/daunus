import { executeAction } from "../../execute-action"
import { $action } from "../../daunus-action"
import { type WorkflowAction } from "../../types"

const loop = $action(
  { type: "loop", skipParse: true },
  ({ ctx }) =>
    async <T>({
      list,
      action,
      itemName = "item"
    }: {
      list: Array<any>
      /**
       * Action
       * @ref https://taskwish.ai/schema/actions.json
       */
      action: WorkflowAction<T>
      itemName?: string
    }) => {
      const res = list.map(async (value, index) => {
        ctx.set(itemName, { value, index })

        const res = await executeAction(ctx, action)

        if (res.exception) {
          return res.exception
        }

        return res.data
      })

      return (await Promise.all(res)) as Array<T>
    }
)

export default loop
