import superjson from 'superjson';

import { rpcSchema } from './rpc-schema';

import { tineAction } from '../../tineAction';

const rpc = tineAction(
  async ({ endpoint, secret, workflow }, { ctx }) => {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tine-secret': secret,
      },
      body: JSON.stringify(superjson.serialize({ ctx, workflow })),
    });

    return superjson.deserialize(await res.json());
  },
  {
    action: 'rpc',
    schema: rpcSchema,
    skipParse: true,
  },
);

export default rpc;
