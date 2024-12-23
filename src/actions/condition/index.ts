import { isException } from "../../helpers"
import { resolveAction } from "../../resolve_action"
import { $action } from "../../daunus_action"

type ConditionParams<P, T, C> =
  | {
      if: C
      do: P
      else?: T
    }
  | {
      if: C
      do?: P
      else: T
    }

const condition = $action(
  { type: "condition", skipParse: true },
  ({ ctx }) =>
    async <P, T, C>({
      if: $if,
      do: $then,
      else: $else
    }: ConditionParams<P, T, C>) => {
      const condition = await resolveAction(ctx, $if)

      if (!isException(condition) && condition) {
        return resolveAction(ctx, $then)
      }

      return await resolveAction(ctx, $else)
    }
)

export default condition
