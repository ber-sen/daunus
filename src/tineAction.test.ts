import { tineInput } from './tineHelpers';
import { shape } from './actions';
import { tineVar } from './tineVar';
import { TineInferInput, TineInferReturn } from './types';
import { z } from './zod';

type Expect<T extends true> = T;

type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y
  ? 1
  : 2
  ? true
  : false;

describe('tineQuery', () => {
  it('Should infer input', () => {
    const input = tineInput({
      id: z.string(),
    }).openapi('User');

    const test = shape({ success: true, data: tineVar(input, 'id') });

    const res = test.withParams(input, {
      oSchema: z.object({ success: z.boolean(), data: z.string() }),
    });

    type A = TineInferInput<typeof res>;

    type test = Expect<Equal<A, { id: string }>>;
  });

  it('Should infer return', () => {
    const input = tineInput({
      id: z.string(),
    }).openapi('User');

    const test = shape({ success: true, data: tineVar(input, 'id') });

    const res = test.withParams(input, {
      oSchema: z.object({ success: z.boolean(), data: z.string() }),
    });

    type A = TineInferReturn<typeof res>;

    type test = Expect<Equal<A, { success: boolean; data: string }>>;
  });
});
