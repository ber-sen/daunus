import { isException } from "../../helpers"
import { $action } from "../../daunus-action"
import { resolveAction } from "../../run-action"

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
