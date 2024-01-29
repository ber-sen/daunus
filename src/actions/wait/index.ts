import { z } from 'zod';

import { tineAction } from '../../tineAction';
import { Wait } from '../../types';

const wait = tineAction(
  {
    type: 'wait',
    paramsSchema: z.union([
      z.object({ delay: z.number() }),
      z.object({ until: z.date() }),
    ]),
  },
  (params, { ctx }) => {
    if (!params) {
      return;
    }

    return new Wait({ ...params, ctx });
  },
);

export default wait;
