import { z } from 'zod';

import { tineAction } from '../../tineAction';
import { StatusError } from '../../types';

const exit = tineAction(
  {
    type: 'exit',
    paramsSchema: z.object({
      status: z.number(),
      message: z.string().optional(),
    }),
  },
  (params) => {
    if (!params) {
      return;
    }

    throw new StatusError(params.message ?? '', params.status);
  },
);

export default exit;
