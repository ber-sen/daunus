import { tineFn, struct, condition, tineVar, exit } from '../';

const error = exit({
  status: 404,
  message: 'Not found',
  data: {
    error: 'Resouce not found',
  },
});

const random = struct(tineFn(() => Math.random()));

const success = struct({ success: true });

const res = condition({
  if: tineVar(random, (val) => val > 0),
  then: tineVar(success),
  else: tineVar(error),
});

export default error.noParams();
