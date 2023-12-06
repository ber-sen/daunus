import { z } from 'zod';
import { tineInput } from './tineHelpers';
import { resolveParams } from './resolveParams';
import { tineVar } from './tineVar';
import { TineAction, TineInput } from './types';

const getContext = <T>(input: TineInput<T> | TineAction<T>, value?: object) => {
  const ctx = new Map();

  ctx.set(input?.name, value);

  return ctx;
};

describe('tineVar', () => {
  describe('string selector', () => {
    it('should return the value', async () => {
      const input = tineInput(z.object({ name: z.string() }), {
        name: 'input',
      });

      const ctx = getContext(input, { name: 'Earth' });

      const res = await resolveParams(ctx, tineVar(input, 'name'));

      expect(res).toStrictEqual('Earth');
    });

    it('should return the value inside nested object', async () => {
      const input = tineInput(
        z.object({ variables: z.object({ name: z.string() }) }),
        { name: 'input' },
      );

      const ctx = getContext(input, { variables: { name: 'Earth' } });

      const res = await resolveParams(ctx, tineVar(input, 'variables.name'));

      expect(res).toStrictEqual('Earth');
    });

    it('should return the value inside nested object and array', async () => {
      const input = tineInput(
        z.object({ variables: z.object({ names: z.array(z.string()) }) }),
        { name: 'input' },
      );

      const ctx = getContext(input, { variables: { names: ['Earth'] } });

      const res = await resolveParams(
        ctx,
        tineVar(input, 'variables.names[0]'),
      );

      expect(res).toStrictEqual('Earth');
    });

    it("should return the value if it's fallacy", async () => {
      const input = tineInput(z.string().nullable(), { name: 'input' });

      const ctx = getContext(input, undefined);

      const res = await resolveParams(
        ctx,
        tineVar(input, (val) => Boolean(!val)),
      );

      expect(res).toStrictEqual(true);
    });

    it('should work with array the value', async () => {
      const input1 = tineInput(z.object({ firstName: z.string() }), {
        name: 'input1',
      });

      const input2 = tineInput(z.object({ lastName: z.string() }), {
        name: 'input2',
      });

      const ctx = new Map();

      ctx.set(input1.name, 'test');
      ctx.set(input2.name, 'test2');

      const res = await resolveParams(
        ctx,
        tineVar([input1, input2] as const, ([$1, $2]) => [$1, $2]),
      );

      expect(res).toStrictEqual(['test', 'test2']);
    });
  });
});
