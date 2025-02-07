import { $action } from "../../daunus-action"

const struct = $action(
  {
    type: "struct"
  },
  () =>
    <T>(params: T) =>
      params
)

export default struct
