import { $action } from "../../daunus_action";

const define = $action(
  {
    type: "define"
  },
  () =>
    <T>(params: T) =>
      params!
);

export default define;
