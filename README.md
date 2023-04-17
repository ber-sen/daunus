## tinejs

edge framework for nextJs

# example: 

useCases/hello/index.ts
```typescript
import { z } from 'zod';
import { tineInput, tineVar } from 'tinejs';
import payload from 'tinejs.payload';

const schema = z.object({ name: z.string().nullable().optional() });

const input = tineInput(schema, {
  name: 'helloInput',
});

const hello = payload(
  tineVar(input, ({ name }) => `Hello ${name || 'World'}`),
  { name: 'hello' },
);

export default hello;
```

usage:
```typescript
'use client';

import useSWR from 'swr';
import { UseCases } from '@/useCases';

export default function Page() {
  const { data } = useSWR(...UseCases.hello.input({ name: 'Earth' }));

  return <pre>{JSON.stringify(data, null, '\t')}</pre>;
}
```
