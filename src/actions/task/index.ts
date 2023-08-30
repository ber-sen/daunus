import { tineAction } from '../../tineAction';
import { tineFn } from '../../tineFn';
import { TineCtx } from '../../types';

const task = tineAction(
  {
    action: 'task',
    parseResponse: true,
  },
  <T>(payload: (ctx: TineCtx) => T) => tineFn(payload),
);

export default task;
