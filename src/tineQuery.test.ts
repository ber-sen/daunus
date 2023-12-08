import { resolveParams } from './resolveParams';
import { tineQuery } from './tineQuery';

const setContext = (value: object) => {
  const ctx = new Map();

  ctx.set('input', value);

  return ctx;
};

describe('tineQuery', () => {
  it('should return the value', async () => {
    const ctx = setContext({ name: 'Earth' });

    const res = await resolveParams(
      ctx,
      tineQuery(($) => $.input.name),
    );

    expect(res).toStrictEqual('Earth');
  });
});
