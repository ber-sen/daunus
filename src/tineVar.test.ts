import { z } from 'zod';

import { tineInput } from './tineHelpers';
import { resolveParams } from './resolveParams';
import { tineVar } from './tineVar';

const setContext = <T>(value?: object) => {
  const ctx = new Map();

  ctx.set('input', value);

  return ctx;
};

describe('tineVar', () => {
  describe('string selector', () => {
    it('should return the value', async () => {
      const input = tineInput({ name: z.string() });

      const ctx = setContext({ name: 'Earth' });

      const res = await resolveParams(ctx, tineVar(input, 'name'));

      expect(res).toStrictEqual('Earth');
    });

    it('should return the value inside nested object', async () => {
      const input = tineInput({ variables: z.object({ name: z.string() }) });

      const ctx = setContext({ variables: { name: 'Earth' } });

      const res = await resolveParams(ctx, tineVar(input, 'variables.name'));

      expect(res).toStrictEqual('Earth');
    });

    it('should return the value inside nested object and array', async () => {
      const input = tineInput({
        variables: z.object({ names: z.array(z.string()) }),
      });

      const ctx = setContext({ variables: { names: ['Earth'] } });

      const res = await resolveParams(
        ctx,
        tineVar(input, 'variables.names[0]'),
      );

      expect(res).toStrictEqual('Earth');
    });

    it('should return the string value', async () => {
      const input = tineInput({ name: z.string() });

      expect(tineVar(input, 'name').toString()).toStrictEqual('{{ name }}');
    });
  });
});
