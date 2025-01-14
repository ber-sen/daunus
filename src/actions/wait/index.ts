import { Wait } from "../../daunus_exception"
import { $action } from "../../daunus_action"

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
