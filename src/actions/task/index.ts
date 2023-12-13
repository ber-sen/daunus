import { tineAction } from '../../tineAction';
import { tineFn } from '../../tineFn';
import { TineCtx } from '../../types';

const task = tineAction(
  {
    type: 'task',
    parseResponse: true,
  },
  <T>(params: (ctx: TineCtx) => Promise<T> | T) => tineFn(params),
);

export default task;
