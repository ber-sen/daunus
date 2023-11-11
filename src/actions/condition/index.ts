import { resolveAction } from '../../resolveAction';
import { tineAction } from '../../tineAction';
import { TineActionOptions } from '../../types';

const condition = tineAction(
  { type: 'condition', skipParse: true },
  async <P, T = null>(
    {
      if: $if,
      then: $then,
      else: $else = null,
    }: { if: boolean; then: P; else?: T | null },
    { parseParams, ctx }: TineActionOptions,
  ) => {
    if (await parseParams(ctx, await resolveAction(ctx, $if))) {
      return (await parseParams(ctx, await resolveAction(ctx, $then))) as P;
    }

    return ((await parseParams(ctx, await resolveAction(ctx, $else))) ??
      null) as T;
  },
);

export default condition;
