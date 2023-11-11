## tinejs

edge framework for nextJs

# example: 

useCases/hello/index.ts
```typescript
import { z } from 'zod';
import { tineVar, tineInput, shape } from 'tinejs';

const input = tineInput(z.object({ name: z.string().nullable() }));

const hello = shape({
  params: tineVar(input, ({ name }) => `Hello ${name || 'World'}`)
});

export default hello.withInput(input);
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
