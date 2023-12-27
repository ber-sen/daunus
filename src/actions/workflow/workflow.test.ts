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
            name: 'data',
            type: ['shape'],
            params: { name: 'Bar' },
          },
          {
            type: ['shape'],
            params: tineQuery(($) => `Foo ${$.data.name}`),
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

    expect(res).toStrictEqual('Foo Bar');
  });
});
