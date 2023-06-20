import { resolveAction } from '../../resolveAction';
import { tineAction } from '../../tineAction';
import { TineActionOptions } from '../../types';

const condition = tineAction(
  async <P, T = null>(
    {
      if: $if,
      then: $then,
      else: $else = null,
    }: { if: boolean; then: P; else?: T | null },
    { parsePayload, ctx }: TineActionOptions,
  ) => {
    if (await parsePayload(ctx, await resolveAction(ctx, $if))) {
      return (await parsePayload(ctx, await resolveAction(ctx, $then))) as P;
    }

    return ((await parsePayload(ctx, await resolveAction(ctx, $else))) ??
      null) as T;
  },
  { action: 'condition', skipParse: true },
);

export default condition;
