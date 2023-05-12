import { tineAction } from '../../tineAction';
import { TineActionOptions } from '../../types';

const condition = tineAction(
  async <P, T = null>(
    [condition, $true, $false = null]: [boolean, P, (T | null)?],
    { parsePayload, ctx }: TineActionOptions,
  ) => {
    if (await parsePayload(ctx, condition)) {
      return await parsePayload(ctx, $true);
    }

    return ((await parsePayload(ctx, $false)) ?? null) as T;
  },
  { action: 'condition', skipParse: true },
);

export default condition;
