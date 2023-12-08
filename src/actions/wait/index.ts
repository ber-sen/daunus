import { z } from 'zod';
import { tineAction } from '../../tineAction';
import { Wait } from '../../types';

const wait = tineAction(
  {
    type: 'wait',
    schema: z.object({ delay: z.number() }),
  },
  (params, { ctx }) => {
    if (!params) {
      return;
    }

    throw new Wait({ ...params, ctx });
  },
);

export default wait;
