import { resolveAction } from '../../resolveAction';
import { tineAction } from '../../tineAction';
import { TineActionOptions, TineVar, TineWorkflowAction } from '../../types';

const response = tineAction(
  { type: 'response', skipParse: true },
  async <D, B, A>(
    {
      data,
      before,
      after,
    }: {
      data: D;
      before?: TineWorkflowAction<B> | TineVar<B>;
      after?: TineWorkflowAction<A> | TineVar<A>;
    },
    { parsePayload, ctx }: TineActionOptions,
  ) => {
    if (before) {
      await parsePayload(ctx, await resolveAction(ctx, before, 'before'));
    }

    const res: D = await parsePayload(ctx, await resolveAction(ctx, data));

    if (after) {
      (async () => {
        await parsePayload(ctx, await resolveAction(ctx, after, 'after'));
      })();
    }

    return res;
  },
);

export default response;
