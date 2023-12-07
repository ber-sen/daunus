import { z } from 'zod';

import { tineInput } from './tineHelpers';
import { resolveParams } from './resolveParams';
import { TineAction, TineInput } from './types';
import { tineQuery } from './tineQuery';

const getContext = <T>(input: TineInput<T> | TineAction<T>, value: object) => {
  const ctx = new Map();

  ctx.set(input.name, value);

  return ctx;
};

describe('tineQuery', () => {
  it('should return the value', async () => {
    const input = tineInput(z.object({ name: z.string() }), {
      name: 'input',
    });

    const ctx = getContext(input, { name: 'Earth' });

    const res = await resolveParams(
      ctx,
      tineQuery(($) => $.input.name),
    );

    expect(res).toStrictEqual('Earth');
  });
});
