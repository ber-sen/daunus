import { $action } from "../../daunus_action";
import { DaunusException, DaunusActionWithOptions } from "../../types";

export default function exit<S extends number>(params: {
  status: S;
}): DaunusActionWithOptions<DaunusException<S, undefined, undefined>, {}, {}>;

export default function exit<S extends number, D>(params: {
  status: S;
  data: D;
}): DaunusActionWithOptions<DaunusException<S, D, undefined>, {}, {}>;

export default function exit<S extends number, P>(params: {
  status: S;
  paths: P;
}): DaunusActionWithOptions<DaunusException<S, undefined, P>, {}, {}>;

export default function exit(params: any) {
  return $action(
    {
      type: "exit"
    },
    () => () => new DaunusException(params?.status, { data: params?.data, paths: params?.paths })
  )(params);
}
