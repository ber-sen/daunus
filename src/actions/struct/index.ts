import { tineAction } from "../../tine_action";

const struct = tineAction(
  {
    type: "struct"
  },
  <T>(params: T) => params!
);

export default struct;
