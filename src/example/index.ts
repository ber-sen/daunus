import { z } from 'zod';

import { struct } from '../actions';
import { tineInput } from '../tineHelpers';
import { tineVar } from '../tineVar';

const input = tineInput({
  id: z.string(),
}).openapi('User');

const res = struct({ success: true, data: tineVar(input, 'id') });

export default res.withParams(input, {
  oSchema: z.object({ success: z.boolean(), data: z.string() }),
  openApi: {
    params: {
      id: tineVar(input, 'id'),
    },
  },
});
