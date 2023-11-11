import superjson from 'superjson';

import { rpcSchema } from './rpc-schema';

import { tineAction } from '../../tineAction';

const rpc = tineAction(
  {
    type: 'rpc',
    schema: rpcSchema,
    skipParse: true,
  },
  async ({ endpoint, secret, type, params, name }, { ctx }) => {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tine-Secret': secret,
      },
      body: JSON.stringify(superjson.serialize({ ctx, type, name, params })),
    });

    return superjson.deserialize(await res.json());
  },
);

export default rpc;
