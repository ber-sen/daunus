import { tineAction } from '../../tineAction';
import { tineFn } from '../../tineFn';
import { TineCtx } from '../../types';

const task = tineAction(<T>(payload: (ctx: TineCtx) => T) => tineFn(payload), {
  action: 'task',
  parseResponse: true,
});

export default task;
