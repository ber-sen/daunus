import { $action } from "../../daunus_action"
import { DaunusException } from "../../types"

const exit = $action(
  {
    type: "exit"
  },
  () =>
    <S extends number = 500, D = undefined, P = undefined>(params: {
      status?: S
      data?: D
      paths?: P
    }) =>
      new DaunusException(params)
)

export default exit
