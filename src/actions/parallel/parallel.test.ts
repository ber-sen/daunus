import { tineCtx } from '../../tineHelpers';
import parallel from './index';

describe('parallel', () => {
  it('should work with two actions', async () => {
    const action = parallel([
      {
        name: 'test',
        type: ['shape'],
        params: {
          foo: 'bar',
        },
      },
      {
        type: ['shape'],
        params: 'test',
      },
    ]);

    const res = await action.run(tineCtx());

    expect(res).toStrictEqual([{ foo: 'bar' }, 'test']);
  });

  it('should work with with nested parallel', async () => {
    const action = parallel([
      {
        name: 'test',
        type: ['parallel'],
        params: [
          {
            type: ['shape'],
            params: 'action.1.1',
          },
          {
            type: ['shape'],
            params: 'action.1.2',
          },
        ],
      },
      {
        type: ['shape'],
        params: 'action.2',
      },
    ]);

    const res = await action.run(tineCtx());

    expect(res).toStrictEqual([['action.1.1', 'action.1.2'], 'action.2']);
  });

  it('should NOT be able to access return of the first action from the second', async () => {
    const action = parallel([
      {
        name: 'test',
        type: ['shape'],
        params: {
          foo: 'bar',
        },
      },
      {
        type: ['shape'],
        params: '{{ $.test }}',
      },
    ]);

    const res = await action.run(tineCtx());

    expect(res).toStrictEqual([{ foo: 'bar' }, undefined]);
  });
});
