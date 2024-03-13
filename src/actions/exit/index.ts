import { $action } from "../../daunus_action";
import { DaunusError } from "../../types";

export interface ExitParams<S extends number, D = undefined> {
  status: S;
  message?: string;
  data?: D;
}

const exit = $action(
  {
    type: "exit"
  },
  <S extends number, D>(params: ExitParams<S, D>) =>
    new DaunusError<S, D>(params.status, params.message ?? "", params.data)
);

export default exit;
