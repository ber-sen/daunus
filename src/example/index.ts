import { z } from 'zod';
import { shape } from '../actions';
import { tineInput } from '../tineHelpers';
import { tineVar } from '../tineVar';
import { TineInferInput, TineInferReturn } from '../types';

const input = tineInput({
  id: z.string(),
}).openapi('User');

const test = shape({ success: true, data: tineVar(input, 'id') });

const def = test.withParams(input, {
  oSchema: z.object({ success: z.boolean(), data: z.string() }),
});

type A = TineInferInput<typeof def>;

type B = TineInferReturn<typeof def>;
