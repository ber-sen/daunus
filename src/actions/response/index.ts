import { resolveAction } from "../../resolve_action";
import { $action } from "../../daunus_action";
import { DaunusVar, DaunusWorkflowAction } from "../../types";

const response = $action(
  { type: "response", skipParse: true },
  ({ parseParams, ctx }) =>
    async <D, B, A>({
      data,
      before,
      after
    }: {
      data: D;
      before?: DaunusWorkflowAction<B> | DaunusVar<B>;
      after?: DaunusWorkflowAction<A> | DaunusVar<A>;
    }) => {
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
