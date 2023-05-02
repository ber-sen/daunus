import { z } from 'zod';
import { tineInput } from './tineHelpers';
import { resolvePayload } from './resolvePayload';
import { tineVar } from './tineVar';
import { TineInput } from './types';

const getContext = <T>(input: TineInput<T>, value: object) => {
  const ctx = new Map();

  ctx.set(input.name, value);

  return ctx
}

describe('tineVar', () => {
  describe('string selector', () => {
    it('should return the value', async () => {
      const input = tineInput(z.object({ name: z.string() }), { name: 'input' });

      const ctx = getContext(input, { name: "Earth" })

      const res = await resolvePayload(ctx, tineVar(input, 'name'));

      expect(res).toStrictEqual('Earth');
    });

    it('should return the value inside nested object', async () => {
      const input = tineInput(z.object({ variables: z.object({ name: z.string() }) }), { name: 'input' });

      const ctx = getContext(input, { variables: { name: "Earth" } })

      const res = await resolvePayload(ctx, tineVar(input, 'variables.name'));

      expect(res).toStrictEqual('Earth');
    });

    it('should return the value inside nested object and array', async () => {
      const input = tineInput(z.object({ variables: z.object({ names: z.array(z.string()) }) }), { name: 'input' });

      const ctx = getContext(input, { variables: { names: ["Earth"] } })

      const res = await resolvePayload(ctx, tineVar(input, 'variables.names[0]'));

      expect(res).toStrictEqual('Earth');
    });
  })
});
