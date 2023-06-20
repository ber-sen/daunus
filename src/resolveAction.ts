import { workflow } from './actions';
import { isAction } from './helpers';
import { TineCtx } from './types';

export const resolveAction = async <T>(ctx: TineCtx, obj: T) => {
  if (isAction(obj)) {
    return await workflow(obj).run(ctx);
  }

  return obj;
};
