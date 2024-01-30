import workflow from './index';

import { tineCtx } from '../../tineHelpers';
import { tineQuery } from '../../tineQuery';

describe('workflow', () => {
  it('should work for basic example', async () => {
    const action = workflow({
      name: 'Foo',
      action: {
        type: ['process'],
        params: [
          {
            name: 'struct',
            type: ['struct'],
            params: { name: 'Bar' },
          },
          {
            type: ['struct'],
            params: tineQuery(($) => `Foo ${$.struct.data.name}`),
          },
        ],
      },
      trigger: {
        name: 'endpoint',
        type: ['endpoint'],
        params: { method: 'post' },
      },
    });

    const res = await action.run(tineCtx());

    expect(res.data).toStrictEqual('Foo Bar');
  });
});
