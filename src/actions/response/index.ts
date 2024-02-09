import { resolveAction } from "../../resolve_action";
import { tineAction } from "../../tine_action";
import { TineActionOptions, TineVar, TineWorkflowAction } from "../../types";

const response = tineAction(
  { type: "response", skipParse: true },
  async <D, B, A>(
    {
      data,
      before,
      after
    }: {
      data: D;
      before?: TineWorkflowAction<B> | TineVar<B>;
      after?: TineWorkflowAction<A> | TineVar<A>;
    },
    { parseParams, ctx }: TineActionOptions<any>
  ) => {
    if (before) {
      await parseParams(ctx, await resolveAction(ctx, before, "before"));
    }

    const res: D = await parseParams(ctx, await resolveAction(ctx, data));

    if (after) {
      (async () => {
        await parseParams(ctx, await resolveAction(ctx, after, "after"));
      })();
    }

    return res;
  }
);

export default response;
