import { $action } from "../../daunus_action";

const struct = $action(
  {
    type: "struct"
  },
  () =>
    <T>(params: T) =>
      params!
);

export default struct;
