import { $action } from "../../daunus_action";
import { DaunusException, DaunusActionWithOptions } from "../../types";

export default function exit<S extends number>(params: {
  status: S;
}): DaunusActionWithOptions<DaunusException<S, undefined>, {}, {}>;

export default function exit<S extends number, D>(params: {
  status: S;
  data: D;
}): DaunusActionWithOptions<DaunusException<S, D>, {}, {}>;

export default function exit(params: any) {
  return $action(
    {
      type: "exit"
    },
    () => () => new DaunusException(params?.status, params?.data)
  )(params);
}
