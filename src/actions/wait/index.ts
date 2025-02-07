import { Wait } from "../../daunus-exception"
import { $action } from "../../daunus-action"

export type WaitParams =
  | {
      delay: string
    }
  | {
      until: Date
    }

const wait = $action(
  {
    type: "wait"
  },
  () => (params: WaitParams) => {
    return new Wait(params)
  }
)

export default wait
