import { $action } from "../../daunus_action";
import { DaunusException } from "../../types";

export interface ExitParams<S extends number, D = undefined> {
  status: S;
  data?: D;
}

const exit = $action(
  {
    type: "exit"
  },
  () =>
    <S extends number, D>(params: ExitParams<S, D>) =>
      new DaunusException<S, D>(params.status, params.data)
);

export default exit;
