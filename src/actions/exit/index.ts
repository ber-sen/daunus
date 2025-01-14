import { $action } from "../../daunus_action"
import { Exception } from "../../daunus_exception"

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
      new Exception(params)
)

export default exit
