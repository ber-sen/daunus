import { isError } from '../../helpers';
import { resolveAction } from '../../resolveAction';
import { tineAction } from '../../tineAction';
import { TineActionOptions } from '../../types';

type ConditionParams<P, T, C> =
  | {
      if: C;
      then: P;
      else?: T;
    }
  | {
      if: C;
      then?: P;
      else: T;
    };

const condition = tineAction(
  { type: 'condition', skipParse: true },
  async <P, T, C>(
    { if: $if, then: $then, else: $else }: ConditionParams<P, T, C>,
    { parseParams, ctx }: TineActionOptions,
  ) => {
    const condition = await parseParams(ctx, await resolveAction(ctx, $if));

    if (!isError(condition) && condition) {
      return (await parseParams(ctx, await resolveAction(ctx, $then))) as P;
    }

    return ((await parseParams(ctx, await resolveAction(ctx, $else))) ??
      null) as T;
  },
);

export default condition;
