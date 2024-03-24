import { isError } from "../../helpers";
import { resolveAction } from "../../resolve_action";
import { $action } from "../../daunus_action";

type ConditionParams<P, T, C> =
  | {
      if: C;
      do: P;
      else?: T;
    }
  | {
      if: C;
      do?: P;
      else: T;
    };

const condition = $action(
  { type: "condition", skipParse: true },
  ({ parseParams, ctx }) =>
    async <P, T, C>({
      if: $if,
      do: $then,
      else: $else
    }: ConditionParams<P, T, C>) => {
      const condition = await parseParams(ctx, await resolveAction(ctx, $if));

      if (!isError(condition) && condition) {
        return (await parseParams(ctx, await resolveAction(ctx, $then))) as P;
      }

      return ((await parseParams(ctx, await resolveAction(ctx, $else))) ??
        null) as T;
    }
);

export default condition;
